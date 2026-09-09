import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { parse as yamlParse } from "yaml";

import { OperationSchema, type Operation } from "../catalogo/modelos.js";
import { QueryService } from "../consultas/servico.js";
import { UpstreamError } from "../../shared/http_readonly.js";
import { configureLogging, loadSettings, logger } from "../../shared/runtime.js";

// raiz do pacote a partir do módulo (funciona em src/ e dist/, repo e npm).
// --manifest continua sobrescrevendo.
export const DEFAULT_MANIFEST = fileURLToPath(
  new URL("../../../coverage/endpoints.yaml", import.meta.url),
);

type Rec = Record<string, unknown>;

const SOURCES: readonly string[] = ["compras", "pncp"];
const SEARCH_NAMES: ReadonlySet<string> = new Set([
  "texto",
  "termo",
  "objeto",
  "descricao",
  "palavra",
  "keyword",
  "q",
]);
const IDENTIFIER_NAMES: readonly string[] = [
  "numeroControlePNCP",
  "numeroControlePncp",
  "numeroControlePncpCompra",
  "numero_controle_pncp",
  "idCompra",
  "id_compra",
];
const PAGE_NAMES: readonly string[] = ["pagina", "page"];
const PAGE_SIZE_NAMES: readonly string[] = [
  "tamanhoPagina",
  "tamanho_pagina",
  "pageSize",
  "page_size",
];
const TOKEN_NAMES: ReadonlySet<string> = new Set([
  "pageToken",
  "page_token",
  "cursor",
  "cursorToken",
  "continuationToken",
  "nextToken",
  "token",
]);
const SENSITIVE_ERROR_VALUE =
  /(\b(?:authorization|api[-_ ]?key|password|secret|token|cookie)\b\s*[:=]\s*)(?:bearer\s+)?[^\s,;}\]]+/gi;

function isRecord(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// str() do python para ids de registro (strings/vindos de JSON)
function pyStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

// repr() mínimo para mensagens de erro ({name!r} do python)
function pyRepr(value: string): string {
  const quote = value.includes('"') && !value.includes("'") ? '"' : "'";
  let out = quote;
  for (const character of value) {
    if (character === quote || character === "\\") out += `\\${character}`;
    else if (character === "\n") out += "\\n";
    else if (character === "\r") out += "\\r";
    else if (character === "\t") out += "\\t";
    else if (character.codePointAt(0)! < 0x20) {
      out += `\\x${character.codePointAt(0)!.toString(16).padStart(2, "0")}`;
    } else out += character;
  }
  return out + quote;
}

function loadManifest(path: string | undefined): Rec {
  if (path === undefined) return { endpoints: [] };
  const value: unknown = yamlParse(readFileSync(path, "utf8"));
  if (!isRecord(value) || !Array.isArray(value["endpoints"])) {
    throw new Error(`${path} must contain an endpoints list`);
  }
  return value;
}

function endpointsOf(manifest: Rec): Rec[] {
  return (manifest["endpoints"] as unknown[]).filter(isRecord);
}

export function openapiParametersToJsonSchema(
  parameters: Rec[],
): Rec {
  const properties: Rec = {};
  const required: string[] = [];
  for (const parameter of parameters) {
    const name = parameter["name"];
    const location = parameter["in"];
    if (typeof name !== "string" || (location !== "path" && location !== "query")) {
      continue;
    }
    const rawSchema = parameter["schema"];
    const schema: Rec = isRecord(rawSchema) ? { ...rawSchema } : { type: "string" };
    if (typeof parameter["description"] === "string" && !("description" in schema)) {
      schema["description"] = parameter["description"];
    }
    if (Object.hasOwn(parameter, "example") && !("example" in schema)) {
      schema["example"] = parameter["example"];
    }
    properties[name] = schema;
    if (parameter["required"] === true) required.push(name);
  }
  const parameterNames = new Set(Object.keys(properties));
  const hasPage = PAGE_NAMES.some((name) => parameterNames.has(name));
  const hasPageSize = PAGE_SIZE_NAMES.some((name) => parameterNames.has(name));
  const hasPagination =
    hasPage ||
    hasPageSize ||
    [...parameterNames].some((name) => TOKEN_NAMES.has(name));
  // ponytail: python itera set() (ordem arbitrária); ordem de lista é o empate determinístico
  if (hasPage) {
    const pageSchema =
      PAGE_NAMES.map((name) => properties[name]).find(isRecord) ?? {
        type: "integer",
        description: "Número da página.",
      };
    for (const name of PAGE_NAMES) {
      if (!(name in properties)) properties[name] = { ...pageSchema };
    }
  }
  if (hasPageSize) {
    const pageSizeSchema =
      PAGE_SIZE_NAMES.map((name) => properties[name]).find(isRecord) ?? {
        type: "integer",
        description: "Quantidade de registros por página.",
      };
    for (const name of PAGE_SIZE_NAMES) {
      if (!(name in properties)) properties[name] = { ...pageSizeSchema };
    }
  }
  if (!("formato" in properties)) {
    properties["formato"] = {
      type: "string",
      enum: ["normalizado", "original"],
      default: "normalizado",
      description: "Formato da resposta: normalizado ou payload original.",
    };
  }
  if (hasPagination && !("limite_resultados" in properties)) {
    properties["limite_resultados"] = {
      type: "integer",
      minimum: 1,
      description: "Limite máximo de resultados agregados.",
    };
  }
  const hasToken = [...parameterNames].some((name) => TOKEN_NAMES.has(name));
  if ((hasPage || hasToken) && !("auto_paginar" in properties)) {
    properties["auto_paginar"] = {
      type: "boolean",
      default: false,
      description: "Percorre as páginas seguintes enquanto houver próxima página.",
    };
  }
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function eligible(endpoint: Rec): boolean {
  return endpoint["classification"] === "PUBLIC_USEFUL" && endpoint["implemented"] === true;
}

function operations(
  endpoints: Rec[],
  predicate?: (endpoint: Rec) => boolean,
): Operation[] {
  const selected = endpoints.filter(
    (endpoint) => eligible(endpoint) && (predicate === undefined || predicate(endpoint)),
  );
  return selected.map((endpoint) => OperationSchema.parse(endpoint));
}

function validateToolName(name: string): void {
  if (name.length > 128) {
    throw new Error(
      `MCP tool name exceeds the maximum length of 128 characters: ${pyRepr(name)}`,
    );
  }
}

function upstreamErrorEnvelope(error: UpstreamError): Rec {
  // python error.message é cru; em TS Error.message carrega o prefixo "KIND: " (str(error) do python)
  const rawMessage = error.message.startsWith(`${error.kind}: `)
    ? error.message.slice(error.kind.length + 2)
    : error.message;
  return {
    error: {
      provider: error.provider,
      type: error.kind,
      status: error.status,
      message: rawMessage,
      upstream_message: error.upstreamMessage,
      retryable: error.retryable,
    },
  };
}

function probeError(provider: string, error: unknown): Rec {
  const err = error as {
    kind?: unknown;
    provider?: unknown;
    endpoint?: unknown;
    status?: unknown;
  };
  const kind =
    err !== null && typeof err === "object" && "kind" in err && err.kind !== undefined
      ? pyStr(err.kind)
      : error instanceof Error
        ? error.constructor.name
        : "Error";
  let message = (error instanceof Error ? error.message : String(error)).replace(
    SENSITIVE_ERROR_VALUE,
    "$1[REDACTED]",
  );
  if (message.length > 512) message = `${message.slice(0, 509)}...`;
  const errorProvider = err?.provider;
  const providerValue =
    typeof errorProvider === "string" && errorProvider ? errorProvider : provider;
  const endpointValue = typeof err?.endpoint === "string" ? err.endpoint : null;
  const status = err?.status;
  return {
    provider: providerValue,
    endpoint: endpointValue,
    kind,
    type: kind,
    status:
      typeof status === "number" || status === null || status === undefined
        ? status ?? null
        : String(status),
    message,
  };
}

function snapshotMetadata(manifest: Rec): Rec {
  const value = manifest["source_version"];
  const sources = isRecord(value) ? value : {};
  const snapshots: Rec = {};
  for (const source of SOURCES) {
    const sourceValue = sources[source];
    if (isRecord(sourceValue)) snapshots[source] = sourceValue["snapshot"] ?? null;
  }
  return snapshots;
}

function lastSnapshot(manifest: Rec): string | null {
  const result: string[] = [];
  for (const snapshot of Object.values(snapshotMetadata(manifest))) {
    const match = /\d{4}-\d{2}-\d{2}/.exec(pyStr(snapshot));
    if (match) result.push(match[0]);
  }
  return result.length > 0 ? result.reduce((a, b) => (a > b ? a : b)) : null;
}

// ponytail: sort JS ordena por unidade UTF-16 vs code point do python; diverge só com não-BMP
function domainNames(endpoints: Rec[], provider: string): string[] {
  const domains = new Set<string>();
  for (const endpoint of endpoints) {
    if (endpoint["provider"] !== provider) continue;
    const metadata = isRecord(endpoint["operation_metadata"]) ? endpoint["operation_metadata"] : {};
    const tags = Array.isArray(metadata["tags"]) ? (metadata["tags"] as unknown[]) : [];
    for (const tag of tags) {
      const text = pyStr(tag);
      if (text.trim()) domains.add(text);
    }
    const pathParts = pyStr(endpoint["path"] ?? "").split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const domain =
        pathParts[0]!.startsWith("v") && pathParts.length > 1 ? pathParts[1]! : pathParts[0]!;
      domains.add(domain);
    }
  }
  return [...domains].sort();
}

function coverage(endpoints: Rec[], provider?: string): Rec {
  const selected =
    provider === undefined
      ? endpoints
      : endpoints.filter((endpoint) => endpoint["provider"] === provider);
  const publicEndpoints = selected.filter(
    (endpoint) => endpoint["classification"] === "PUBLIC_USEFUL",
  );
  const implemented = publicEndpoints.filter(
    (endpoint) => endpoint["implemented"] === true,
  );
  const ratio = publicEndpoints.length > 0 ? implemented.length / publicEndpoints.length : 1.0;
  return {
    provider: provider ?? null,
    public_endpoints: publicEndpoints.length,
    implemented_endpoints: implemented.length,
    coverage: ratio,
  };
}

function pathMatches(endpoint: Rec, pattern: RegExp): boolean {
  return (
    endpoint["provider"] === "pncp" && pattern.test(pyStr(endpoint["path"] ?? ""))
  );
}

function requiredParametersAvailable(endpoint: Rec, names: ReadonlySet<string>): boolean {
  const parameters = Array.isArray(endpoint["parameters"])
    ? (endpoint["parameters"] as unknown[])
    : [];
  return parameters.every(
    (parameter) =>
      !isRecord(parameter) ||
      !parameter["required"] ||
      ((parameter["in"] === "path" || parameter["in"] === "query") &&
        names.has(pyStr(parameter["name"]))),
  );
}

function requiredArgumentsAvailable(
  operation: Operation,
  args: Rec,
): boolean {
  return operation.parameters.every((parameter) => {
    if (!parameter["required"]) return true;
    const name = parameter["name"];
    return (
      (parameter["in"] === "path" || parameter["in"] === "query") &&
      typeof name === "string" &&
      Object.hasOwn(args, name) &&
      args[name] !== null &&
      args[name] !== undefined
    );
  });
}

function searchCandidate(endpoint: Rec): boolean {
  const parameters = Array.isArray(endpoint["parameters"])
    ? (endpoint["parameters"] as unknown[])
    : [];
  return parameters.some(
    (parameter) =>
      isRecord(parameter) && SEARCH_NAMES.has(pyStr(parameter["name"] ?? "").toLowerCase()),
  );
}

function searchArguments(
  texto: string,
  orgao: unknown,
  uasg: unknown,
  cnpj: unknown,
  modalidade: unknown,
  dataInicio: unknown,
  dataFim: unknown,
  codigoMaterial: unknown,
  codigoServico: unknown,
): Rec {
  const args: Rec = {
    texto,
    termo: texto,
    objeto: texto,
    descricao: texto,
    palavra: texto,
    keyword: texto,
    q: texto,
    orgao,
    uasg,
    cnpj,
    modalidade,
    data_inicio: dataInicio,
    dataInicio,
    data_publicacao_min: dataInicio,
    data_fim: dataFim,
    dataFim,
    data_publicacao_max: dataFim,
    codigo_material: codigoMaterial,
    codigoMaterial,
    codigo_servico: codigoServico,
    codigoServico,
  };
  return Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== null && value !== undefined),
  );
}

async function executeManyOrError(
  service: QueryService,
  ops: Operation[],
  args: Rec,
): Promise<Rec> {
  try {
    return await service.executeMany(ops, args);
  } catch (error) {
    if (error instanceof UpstreamError) return upstreamErrorEnvelope(error);
    throw error;
  }
}

function records(value: unknown): Rec[] {
  if (isRecord(value)) {
    const data = value["data"];
    if (Array.isArray(data)) return data.filter(isRecord);
    if (isRecord(data)) return [data];
  }
  return [];
}

function withOverlapMarker(results: Rec): Rec {
  const seen = new Map<string, { source: string; tool: string }[]>();
  for (const [tool, value] of Object.entries(results)) {
    if (!isRecord(value)) continue;
    const source = value["source"] === undefined ? "" : pyStr(value["source"]);
    for (const record of records(value)) {
      for (const identifier of IDENTIFIER_NAMES) {
        const rawId = record[identifier];
        if (rawId !== null && rawId !== undefined && pyStr(rawId).trim()) {
          const key = pyStr(rawId);
          const refs = seen.get(key) ?? [];
          refs.push({ source, tool });
          seen.set(key, refs);
          break;
        }
      }
    }
  }
  const references: { source: string; tool: string }[] = [];
  for (const refs of seen.values()) {
    if (new Set(refs.map((item) => item.source)).size > 1) references.push(...refs);
  }
  if (references.length > 0) {
    results["possible_same_record"] = true;
    results["references"] = references;
  }
  return results;
}

function normalizeNumero(value: unknown): string {
  return pyStr(value).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function contratacaoResumoPncp(record: Rec): Rec {
  return {
    numero_controle_pncp: record["numeroControlePNCP"] ?? null,
    cnpj: record["orgaoEntidadeCnpj"] ?? null,
    ano: record["anoCompraPncp"] ?? null,
    sequencial_contratacao: record["sequencialCompraPncp"] ?? null,
    numero_compra: record["numeroCompra"] ?? null,
    uasg: record["unidadeOrgaoCodigoUnidade"] ?? null,
    orgao: record["orgaoEntidadeRazaoSocial"] ?? null,
    objeto: record["objetoCompra"] ?? null,
    modalidade: record["modalidadeNome"] ?? null,
    situacao: record["situacaoCompraNomePncp"] ?? null,
    data_publicacao_pncp: record["dataPublicacaoPncp"] ?? null,
  };
}

function contratacaoProximoPasso(matches: Rec[]): Rec | null {
  const first = matches.find(
    (match) => match["cnpj"] && match["ano"] && match["sequencial_contratacao"],
  );
  if (!first) return null;
  return {
    ferramenta: "pncp_obter_contratacao_completa",
    argumentos: {
      cnpj: first["cnpj"],
      ano: first["ano"],
      sequencial_contratacao: first["sequencial_contratacao"],
    },
  };
}

interface ResolucaoContratacao {
  found: boolean;
  lookup: string;
  codigo_consultado: string;
  contratacoes: Rec[];
  mensagem?: string;
  error?: Rec;
}

async function resolverContratacao(
  service: QueryService,
  lookupOperation: Operation,
  scanOperation: Operation,
  args: Rec,
): Promise<ResolucaoContratacao> {
  const parsed = /^(\d{1,10})(?:\/(\d{4}))?$/.exec(pyStr(args["numero"] ?? "").trim());
  if (!parsed) {
    throw new Error('numero must be digits or "numero/ano", e.g. "90010" or "90010/2025"');
  }
  const ano = Number(args["ano"]);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    throw new Error("ano must be a four-digit year between 2000 and 2100");
  }
  const uasg = pyStr(args["uasg"] ?? "").trim();
  if (!/^\d{6}$/.test(uasg)) throw new Error("uasg must be a 6-digit code");
  if (parsed[2] !== undefined && Number(parsed[2]) !== ano) {
    throw new Error(`numero year ${parsed[2]} conflicts with ano ${ano}`);
  }
  const numero = parsed[1]!.replace(/^0+(?=\d)/, "");
  const codigo = `${uasg}_${numero}_${ano}`;
  try {
    const quick = records(
      await service.execute(lookupOperation, {
        tipo: "numeroControlePNCPCompra",
        codigo,
      }),
    ).filter((record) => pyStr(record["numeroControlePNCP"] ?? "").trim());
    if (quick.length > 0) {
      return {
        found: true,
        lookup: "numeroControlePNCPCompra",
        codigo_consultado: codigo,
        contratacoes: quick.map(contratacaoResumoPncp),
      };
    }
  } catch (error) {
    if (error instanceof UpstreamError) {
      return {
        found: false,
        lookup: "numeroControlePNCPCompra",
        codigo_consultado: codigo,
        contratacoes: [],
        error: upstreamErrorEnvelope(error),
      };
    }
    throw error;
  }
  const modalidade = args["modalidade"];
  if (modalidade === null || modalidade === undefined) {
    return {
      found: false,
      lookup: "numeroControlePNCPCompra",
      codigo_consultado: codigo,
      contratacoes: [],
      mensagem:
        "Nenhuma contratação localizada pelo numeroControlePNCP; unidades fora do Siafi podem " +
        "usar outro código de unidade. Informe modalidade para varrer as contratações da UASG.",
    };
  }
  const scanArgs: Rec = {
    unidadeOrgaoCodigoUnidade: uasg,
    codigoModalidade: modalidade,
    dataPublicacaoPncpInicial: args["data_inicio"] ?? `${ano}-01-01`,
    dataPublicacaoPncpFinal: args["data_fim"] ?? `${ano}-12-31`,
    auto_paginar: true,
    tamanhoPagina: 50,
  };
  if (args["limite_resultados"] !== null && args["limite_resultados"] !== undefined) {
    scanArgs["limite_resultados"] = args["limite_resultados"];
  }
  let scan: unknown;
  try {
    scan = await service.execute(scanOperation, scanArgs);
  } catch (error) {
    if (error instanceof UpstreamError) {
      return {
        found: false,
        lookup: "varredura_uasg",
        codigo_consultado: codigo,
        contratacoes: [],
        error: upstreamErrorEnvelope(error),
      };
    }
    throw error;
  }
  const contratacoes = records(scan)
    .filter(
      (record) =>
        normalizeNumero(record["numeroCompra"] ?? "") === numero &&
        Number(record["anoCompraPncp"]) === ano,
    )
    .map(contratacaoResumoPncp);
  return {
    found: contratacoes.length > 0,
    lookup: "varredura_uasg",
    codigo_consultado: codigo,
    contratacoes,
  };
}

async function buscarContratacaoPorNumeroAnoUasg(
  service: QueryService,
  lookupOperation: Operation,
  scanOperation: Operation,
  args: Rec,
): Promise<Rec> {
  const resolucao = await resolverContratacao(service, lookupOperation, scanOperation, args);
  if (resolucao.error) return resolucao.error;
  const resposta: Rec = {
    found: resolucao.found,
    source: "compras",
    lookup: resolucao.lookup,
    codigo_consultado: resolucao.codigo_consultado,
    ...(resolucao.mensagem ? { mensagem: resolucao.mensagem } : {}),
    contratacoes: resolucao.contratacoes,
  };
  if (resolucao.found) resposta["proximo_passo"] = contratacaoProximoPasso(resolucao.contratacoes);
  return resposta;
}

function normalizarTexto(value: unknown): string {
  return pyStr(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function documentoResumo(record: Rec): Rec {
  return {
    sequencial_documento: record["sequencialDocumento"] ?? null,
    tipo_documento_id: record["tipoDocumentoId"] ?? null,
    tipo_documento: record["tipoDocumentoNome"] ?? null,
    titulo: record["titulo"] ?? null,
    url: record["url"] ?? null,
    uri: record["uri"] ?? null,
    status_ativo: record["statusAtivo"] ?? null,
    data_publicacao_pncp: record["dataPublicacaoPncp"] ?? null,
  };
}

function filtrarDocumentosPorTipo(documentos: Rec[], tipoDocumento: string): {
  documentos: Rec[];
  tipos_disponiveis: string[];
} {
  const alvo = normalizarTexto(tipoDocumento);
  const tipos = [...new Set(documentos.map((d) => pyStr(d["tipo_documento"] ?? "")).filter(Boolean))];
  const exatos = documentos.filter((d) => normalizarTexto(d["tipo_documento"]) === alvo);
  if (exatos.length > 0) return { documentos: exatos, tipos_disponiveis: tipos };
  const contidos = documentos.filter((d) => normalizarTexto(d["tipo_documento"]).includes(alvo));
  return { documentos: contidos.length === 1 ? contidos : [], tipos_disponiveis: tipos };
}

function ataResumo(record: Rec): Rec {
  return {
    numero_ata: record["numeroAtaRegistroPreco"] ?? null,
    ano_ata: record["anoAta"] ?? null,
    sequencial_ata: record["sequencialAta"] ?? null,
    numero_controle_pncp: record["numeroControlePNCP"] ?? null,
    data_assinatura: record["dataAssinatura"] ?? null,
    data_vigencia_inicio: record["dataVigenciaInicio"] ?? null,
    data_vigencia_fim: record["dataVigenciaFim"] ?? null,
    cancelado: record["cancelado"] ?? null,
    objeto: record["objetoCompra"] ?? null,
    possibilidade_adesao: record["possibilidadeAdesao"] ?? null,
  };
}

function resolucaoNaoEncontrada(resolucao: ResolucaoContratacao): Rec {
  return {
    found: false,
    source: "pncp",
    lookup: resolucao.lookup,
    codigo_consultado: resolucao.codigo_consultado,
    ...(resolucao.mensagem ? { mensagem: resolucao.mensagem } : {}),
  };
}

function resumoIncompleto(match: Rec): Rec {
  return {
    ...match,
    mensagem: "identificadores incompletos para consultar o PNCP",
  };
}

async function listarDocumentosContratacao(
  service: QueryService,
  lookupOperation: Operation,
  scanOperation: Operation,
  arquivosOperation: Operation,
  args: Rec,
): Promise<Rec> {
  const resolucao = await resolverContratacao(service, lookupOperation, scanOperation, args);
  if (resolucao.error) return resolucao.error;
  if (!resolucao.found) return resolucaoNaoEncontrada(resolucao);
  const contratacoes: Rec[] = [];
  for (const match of resolucao.contratacoes) {
    if (!match["cnpj"] || !match["ano"] || !match["sequencial_contratacao"]) {
      contratacoes.push({ ...resumoIncompleto(match), documentos: [] });
      continue;
    }
    let envelope: unknown;
    try {
      envelope = await service.execute(arquivosOperation, {
        cnpj: match["cnpj"],
        ano: match["ano"],
        sequencial: match["sequencial_contratacao"],
        auto_paginar: true,
        tamanhoPagina: 50,
      });
    } catch (error) {
      if (error instanceof UpstreamError) return upstreamErrorEnvelope(error);
      throw error;
    }
    let documentos = records(envelope).map(documentoResumo);
    const entrada: Rec = { ...match };
    const filtro = args["tipo_documento"];
    if (typeof filtro === "string" && filtro.trim()) {
      const filtrado = filtrarDocumentosPorTipo(documentos, filtro);
      documentos = filtrado.documentos;
      entrada["tipos_disponiveis"] = filtrado.tipos_disponiveis;
    }
    entrada["documentos"] = documentos;
    const primeiro = documentos[0];
    if (primeiro) {
      entrada["proximo_passo"] = {
        ferramenta:
          "pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial_sequencialdocumento",
        argumentos: {
          cnpj: match["cnpj"],
          ano: match["ano"],
          sequencial: match["sequencial_contratacao"],
          sequencial_documento: primeiro["sequencial_documento"],
        },
      };
    }
    contratacoes.push(entrada);
  }
  return {
    found: true,
    source: "pncp",
    codigo_consultado: resolucao.codigo_consultado,
    contratacoes,
  };
}

async function listarArpsContratacao(
  service: QueryService,
  lookupOperation: Operation,
  scanOperation: Operation,
  atasOperation: Operation,
  args: Rec,
): Promise<Rec> {
  const resolucao = await resolverContratacao(service, lookupOperation, scanOperation, args);
  if (resolucao.error) return resolucao.error;
  if (!resolucao.found) return resolucaoNaoEncontrada(resolucao);
  const contratacoes: Rec[] = [];
  for (const match of resolucao.contratacoes) {
    if (!match["cnpj"] || !match["ano"] || !match["sequencial_contratacao"]) {
      contratacoes.push({ ...resumoIncompleto(match), arps: [] });
      continue;
    }
    let envelope: unknown;
    try {
      envelope = await service.execute(atasOperation, {
        cnpj: match["cnpj"],
        anoCompra: match["ano"],
        sequencialCompra: match["sequencial_contratacao"],
        auto_paginar: true,
        tamanhoPagina: 50,
      });
    } catch (error) {
      if (error instanceof UpstreamError) return upstreamErrorEnvelope(error);
      throw error;
    }
    const arps = records(envelope).map(ataResumo);
    const entrada: Rec = { ...match, arps };
    const primeira = arps[0];
    if (primeira && primeira["sequencial_ata"]) {
      entrada["proximo_passo"] = {
        ferramenta: "pncp_obter_ata_completa",
        argumentos: {
          cnpj: match["cnpj"],
          ano: match["ano"],
          sequencial_contratacao: match["sequencial_contratacao"],
          sequencial_ata: primeira["sequencial_ata"],
        },
      };
    }
    contratacoes.push(entrada);
  }
  const temArps = contratacoes.some(
    (contratacao) => Array.isArray(contratacao["arps"]) && (contratacao["arps"] as unknown[]).length > 0,
  );
  return {
    found: temArps,
    source: "pncp",
    codigo_consultado: resolucao.codigo_consultado,
    ...(temArps
      ? {}
      : { mensagem: "Contratação localizada mas sem atas de registro de preços publicadas." }),
    contratacoes,
  };
}

interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Rec;
  handler: (args: Rec) => Promise<unknown>;
}

interface ResourceSpec {
  uri: string;
  name: string;
  description: string;
  read: () => unknown;
}

const EMPTY_SCHEMA: Rec = { type: "object", properties: {}, additionalProperties: false };

// fastmcp expõe remove_tool/@server.tool sobre um registro único; o McpServer do SDK
// tem registro interno bypassado pelos handlers abaixo, então ambos roteiam para o map interno.
export interface ServidorMcp extends McpServer {
  removeTool(name: string): void;
}

function optionalSchema(type: string): Rec {
  return { anyOf: [{ type }, { type: "null" }], default: null };
}

function buildServerFromManifest(
  manifest: Rec,
  service: QueryService = new QueryService(),
): ServidorMcp {
  const endpoints = endpointsOf(manifest);
  const mcp = new McpServer({ name: "MCP Compras Públicas Brasil", version: "0.1.0" });
  const tools = new Map<string, ToolSpec>();
  const resources = new Map<string, ResourceSpec>();

  const addTool = (spec: ToolSpec): void => {
    validateToolName(spec.name);
    tools.set(spec.name, spec);
  };

  // registro único estilo fastmcp: remove_tool/add_tool operam no map interno servido
  // pelos handlers abaixo (o registro nativo do McpServer fica bypassado)
  const notifyToolsChanged = (): void => {
    try {
      void mcp.server
        .notification({ method: "notifications/tools/list_changed" })
        .catch(() => {});
    } catch {
      // nenhum cliente conectado ainda: ignora
    }
  };
  const servidor = mcp as ServidorMcp;
  servidor.removeTool = (name: string): void => {
    tools.delete(name);
    notifyToolsChanged();
  };
  servidor.registerTool = ((
    name: string,
    spec: Rec,
    handler: (args: Rec) => Promise<unknown>,
  ) => {
    addTool({
      name,
      description: String(spec["description"] ?? ""),
      inputSchema: isRecord(spec["inputSchema"]) ? spec["inputSchema"] : {},
      handler,
    });
    notifyToolsChanged();
  }) as unknown as ServidorMcp["registerTool"];

  const atomicOperations = operations(endpoints);
  for (const operation of atomicOperations) {
    if (typeof operation.tool !== "string") {
      throw new Error(`implemented public endpoint has no tool name: ${operation.id}`);
    }
    addTool({
      name: operation.tool,
      description: operation.description,
      inputSchema: openapiParametersToJsonSchema(operation.parameters),
      handler: async (args) => {
        try {
          return await service.execute(operation, args);
        } catch (error) {
          if (error instanceof UpstreamError) return upstreamErrorEnvelope(error);
          throw error;
        }
      },
    });
  }
  const atomicNames = new Set(
    atomicOperations
      .map((operation) => operation.tool)
      .filter((tool): tool is string => typeof tool === "string"),
  );

  addTool({
    name: "listar_capacidades_mcp",
    description: "Retorna fontes, domínios, cobertura e versão do catálogo MCP.",
    inputSchema: { ...EMPTY_SCHEMA },
    handler: async () => ({
      sources: [...SOURCES],
      domains: Object.fromEntries(
        SOURCES.map((source) => [source, domainNames(endpoints, source)]),
      ),
      atomic_tools: atomicOperations.length,
      endpoints: endpoints.length,
      version: manifest["catalog_version"] ?? null,
      last_snapshot: lastSnapshot(manifest),
    }),
  });

  addTool({
    name: "verificar_saude_fontes",
    description:
      "Executa probes públicos leves catalogados e informa a saúde de cada fonte.",
    inputSchema: { ...EMPTY_SCHEMA },
    handler: async () => {
      const probes: Record<string, string> = {
        compras: "/modulo-indicadores/1_consultarIndicadoresConsolidados",
        pncp: "/v1/modalidades",
      };
      const statuses: Rec = {};
      const errors: Rec = {};
      for (const [source, path] of Object.entries(probes)) {
        const candidates = operations(
          endpoints,
          (endpoint) => endpoint["provider"] === source && endpoint["path"] === path,
        );
        if (candidates.length === 0) {
          statuses[source] = "unavailable";
          errors[source] = {
            provider: source,
            type: "NO_HEALTH_PROBE",
            status: null,
            message:
              "No lightweight public health probe is cataloged for this provider.",
          };
          continue;
        }
        try {
          await service.execute(candidates[0]!, {});
          statuses[source] = "operational";
        } catch (error) {
          statuses[source] = "unavailable";
          errors[source] = probeError(source, error);
        }
      }
      return Object.keys(errors).length > 0 ? { ...statuses, errors } : statuses;
    },
  });

  const snapshotMeta = snapshotMetadata(manifest);
  resources.set("mcp://coverage", {
    uri: "mcp://coverage",
    name: "mcp_coverage",
    description:
      "Expõe a cobertura atômica geral e por fonte, incluindo o total público.",
    read: () => {
      const overall = coverage(endpoints);
      const result: Rec = Object.fromEntries(
        SOURCES.map((source) => [source, coverage(endpoints, source)]),
      );
      result["overall"] = {
        coverage: overall["coverage"],
        public_endpoints: overall["public_endpoints"],
        implemented_endpoints: overall["implemented_endpoints"],
      };
      result["public_endpoints"] = overall["public_endpoints"];
      return result;
    },
  });
  resources.set("compras://coverage", {
    uri: "compras://coverage",
    name: "compras_coverage",
    description: "Expõe a cobertura dos endpoints públicos úteis do Compras.gov.br.",
    read: () => coverage(endpoints, "compras"),
  });
  resources.set("compras://providers", {
    uri: "compras://providers",
    name: "compras_providers",
    description: "Expõe as fontes catalogadas, seus snapshots e quantidades de endpoints.",
    read: () =>
      Object.fromEntries(
        SOURCES.map((source) => [
          source,
          {
            snapshot: snapshotMeta[source] ?? null,
            endpoints: endpoints.filter((endpoint) => endpoint["provider"] === source).length,
          },
        ]),
      ),
  });
  resources.set("compras://endpoints", {
    uri: "compras://endpoints",
    name: "compras_endpoints",
    description: "Expõe o manifesto de endpoints catalogados em formato JSON.",
    read: () => endpoints,
  });
  resources.set("compras://domains", {
    uri: "compras://domains",
    name: "compras_domains",
    description: "Expõe os domínios identificados no catálogo do Compras.gov.br.",
    read: () => ({ provider: "compras", domains: domainNames(endpoints, "compras") }),
  });
  resources.set("pncp://domains", {
    uri: "pncp://domains",
    name: "pncp_domains",
    description: "Expõe os domínios identificados no catálogo do PNCP.",
    read: () => ({ provider: "pncp", domains: domainNames(endpoints, "pncp") }),
  });
  resources.set("pncp://api-version", {
    uri: "pncp://api-version",
    name: "pncp_api_version",
    description: "Expõe a versão OpenAPI e o snapshot catalogado do PNCP.",
    read: () => {
      const sourceVersion = manifest["source_version"];
      const source = isRecord(sourceVersion) ? sourceVersion["pncp"] : undefined;
      return isRecord(source) ? source : {};
    },
  });

  // ------- ferramentas compostas -------
  const addComposite = (spec: ToolSpec): void => {
    if (!atomicNames.has(spec.name)) addTool(spec);
  };

  const contractOperations = operations(
    endpoints,
    (endpoint) =>
      pathMatches(
        endpoint,
        /^\/v1\/orgaos\/\{cnpj\}\/compras\/\{(?:ano|anoCompra)\}\/\{(?:sequencial|sequencialCompra)\}(?:\/|$)/,
      ) &&
      requiredParametersAvailable(
        endpoint,
        new Set(["cnpj", "ano", "anoCompra", "sequencial", "sequencialCompra"]),
      ),
  );
  if (contractOperations.length > 0) {
    addComposite({
      name: "pncp_obter_contratacao_completa",
      description:
        "Consulta os recursos públicos relacionados a uma contratação PNCP.",
      inputSchema: {
        type: "object",
        properties: {
          cnpj: { type: "string" },
          ano: { type: "integer" },
          sequencial_contratacao: { type: "integer" },
        },
        required: ["cnpj", "ano", "sequencial_contratacao"],
        additionalProperties: false,
      },
      handler: (args) =>
        executeManyOrError(service, contractOperations, {
          cnpj: args["cnpj"],
          ano: args["ano"],
          anoCompra: args["ano"],
          sequencial: args["sequencial_contratacao"],
          sequencialCompra: args["sequencial_contratacao"],
        }),
    });
  }

  const ataOperations = operations(
    endpoints,
    (endpoint) =>
      pathMatches(
        endpoint,
        /^\/v1\/orgaos\/\{cnpj\}\/compras\/\{(?:ano|anoCompra)\}\/\{(?:sequencial|sequencialCompra)\}\/atas\/\{sequencialAta\}(?:\/|$)/,
      ) &&
      requiredParametersAvailable(
        endpoint,
        new Set([
          "cnpj",
          "ano",
          "anoCompra",
          "sequencial",
          "sequencialCompra",
          "sequencialAta",
        ]),
      ),
  );
  if (ataOperations.length > 0) {
    addComposite({
      name: "pncp_obter_ata_completa",
      description: "Consulta os recursos públicos relacionados a uma ata PNCP.",
      inputSchema: {
        type: "object",
        properties: {
          cnpj: { type: "string" },
          ano: { type: "integer" },
          sequencial_contratacao: { type: "integer" },
          sequencial_ata: { type: "integer" },
        },
        required: ["cnpj", "ano", "sequencial_contratacao", "sequencial_ata"],
        additionalProperties: false,
      },
      handler: (args) =>
        executeManyOrError(service, ataOperations, {
          cnpj: args["cnpj"],
          ano: args["ano"],
          anoCompra: args["ano"],
          sequencial: args["sequencial_contratacao"],
          sequencialCompra: args["sequencial_contratacao"],
          sequencialAta: args["sequencial_ata"],
        }),
    });
  }

  const contratoOperations = operations(
    endpoints,
    (endpoint) =>
      pathMatches(
        endpoint,
        /^\/v1\/orgaos\/\{cnpj\}\/contratos\/\{(?:ano|anoContratacao)\}\/\{(?:sequencial|sequencialContrato)\}(?:\/|$)/,
      ) &&
      requiredParametersAvailable(
        endpoint,
        new Set(["cnpj", "ano", "anoContratacao", "sequencial", "sequencialContrato"]),
      ),
  );
  if (contratoOperations.length > 0) {
    addComposite({
      name: "pncp_obter_contrato_completo",
      description: "Consulta os recursos públicos relacionados a um contrato PNCP.",
      inputSchema: {
        type: "object",
        properties: {
          cnpj: { type: "string" },
          ano: { type: "integer" },
          sequencial_contrato: { type: "integer" },
        },
        required: ["cnpj", "ano", "sequencial_contrato"],
        additionalProperties: false,
      },
      handler: (args) =>
        executeManyOrError(service, contratoOperations, {
          cnpj: args["cnpj"],
          ano: args["ano"],
          anoContratacao: args["ano"],
          sequencial: args["sequencial_contrato"],
          sequencialContrato: args["sequencial_contrato"],
        }),
    });
  }

  const lookupContratacaoPncpOperation = operations(
    endpoints,
    (endpoint) =>
      endpoint["id"] ===
      "compras.GET./modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id",
  )[0];
  const scanContratacoesPncpOperation = operations(
    endpoints,
    (endpoint) =>
      endpoint["id"] === "compras.GET./modulo-contratacoes/1_consultarContratacoes_PNCP_14133",
  )[0];
  if (lookupContratacaoPncpOperation && scanContratacoesPncpOperation) {
    const buscaSchema = (properties: Rec): Rec => ({
      type: "object",
      properties: {
        numero: {
          type: "string",
          description: 'Número da contratação, aceitando "90010" ou "90010/2025".',
        },
        ano: { type: "integer", description: "Ano da contratação, por exemplo 2025." },
        uasg: { type: "string", description: "Código UASG da unidade compradora, 6 dígitos." },
        modalidade: {
          anyOf: [{ type: "integer" }, { type: "null" }],
          default: null,
          description:
            "Código da modalidade (ex.: Pregão Eletrônico) usado apenas na varredura por UASG " +
            "quando o numeroControlePNCP não existe.",
        },
        data_inicio: optionalSchema("string"),
        data_fim: optionalSchema("string"),
        limite_resultados: optionalSchema("integer"),
        ...properties,
      },
      required: ["numero", "ano", "uasg"],
      additionalProperties: false,
    });

    addComposite({
      name: "pncp_buscar_contratacao_por_numero_ano_uasg",
      description:
        "Localiza os identificadores PNCP de uma contratação (CNPJ do órgão, ano e sequencial) a " +
        "partir do número da contratação, ano e UASG — por exemplo Pregão Eletrônico 90010/2025 na " +
        "UASG 200350. Use antes de pncp_obter_contratacao_completa quando o numeroControlePNCP não " +
        "for conhecido.",
      inputSchema: buscaSchema({}),
      handler: (args) =>
        buscarContratacaoPorNumeroAnoUasg(
          service,
          lookupContratacaoPncpOperation,
          scanContratacoesPncpOperation,
          args,
        ),
    });

    const arquivosContratacaoOperation = operations(
      endpoints,
      (endpoint) =>
        endpoint["id"] === "pncp.GET./v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos",
    )[0];
    if (arquivosContratacaoOperation) {
      addComposite({
        name: "pncp_listar_documentos_contratacao_por_numero_ano_uasg",
        description:
          "Lista os documentos públicos de uma contratação do PNCP — ETP, Termo de Referência, " +
          "Edital e anexos — a partir do número da contratação, ano e UASG, com tipo, título, url e " +
          "sequencial_documento para download. Use quando os identificadores PNCP não forem " +
          "conhecidos.",
        inputSchema: buscaSchema({
          tipo_documento: {
            anyOf: [{ type: "string" }, { type: "null" }],
            default: null,
            description:
              'Filtro pelo nome do tipo de documento, por exemplo "Edital", "ETP" ou ' +
              '"Termo de Referência".',
          },
        }),
        handler: (args) =>
          listarDocumentosContratacao(
            service,
            lookupContratacaoPncpOperation,
            scanContratacoesPncpOperation,
            arquivosContratacaoOperation,
            args,
          ),
      });
    }

    const atasContratacaoOperation = operations(
      endpoints,
      (endpoint) =>
        endpoint["id"] ===
        "pncp.GET./v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas",
    )[0];
    if (atasContratacaoOperation) {
      addComposite({
        name: "pncp_listar_arps_contratacao_por_numero_ano_uasg",
        description:
          "Lista as Atas de Registro de Preços (ARPs) vinculadas a uma contratação do PNCP a partir " +
          "do número da contratação, ano e UASG, distinguindo contratação sem atas de contratação " +
          "não localizada. Use quando os identificadores PNCP não forem conhecidos.",
        inputSchema: buscaSchema({}),
        handler: (args) =>
          listarArpsContratacao(
            service,
            lookupContratacaoPncpOperation,
            scanContratacoesPncpOperation,
            atasContratacaoOperation,
            args,
          ),
      });
    }
  }

  const searchOperations = operations(
    endpoints,
    (endpoint) =>
      searchCandidate(endpoint) &&
      requiredParametersAvailable(
        endpoint,
        new Set([
          "texto",
          "termo",
          "objeto",
          "descricao",
          "palavra",
          "keyword",
          "q",
          "orgao",
          "uasg",
          "cnpj",
          "modalidade",
          "data_inicio",
          "dataInicio",
          "data_publicacao_min",
          "data_fim",
          "dataFim",
          "data_publicacao_max",
          "codigo_material",
          "codigoMaterial",
          "codigo_servico",
          "codigoServico",
        ]),
      ),
  );
  if (searchOperations.length > 0) {
    addComposite({
      name: "buscar_compras_publicas",
      description:
        "Pesquisa compras públicas nas fontes catalogadas sem deduplicar resultados.",
      inputSchema: {
        type: "object",
        properties: {
          texto: { type: "string" },
          orgao: optionalSchema("string"),
          uasg: optionalSchema("integer"),
          cnpj: optionalSchema("string"),
          modalidade: optionalSchema("integer"),
          data_inicio: optionalSchema("string"),
          data_fim: optionalSchema("string"),
          codigo_material: optionalSchema("integer"),
          codigo_servico: optionalSchema("integer"),
          fonte: { default: "todas", type: "string" },
        },
        required: ["texto"],
        additionalProperties: false,
      },
      handler: async (args) => {
        const fonte = args["fonte"] ?? "todas";
        if (fonte !== "compras" && fonte !== "pncp" && fonte !== "todas") {
          throw new Error("fonte must be compras, pncp or todas");
        }
        if (typeof args["texto"] !== "string") {
          throw new Error("missing required parameter: texto");
        }
        const searchArgs = searchArguments(
          args["texto"],
          args["orgao"],
          args["uasg"],
          args["cnpj"],
          args["modalidade"],
          args["data_inicio"],
          args["data_fim"],
          args["codigo_material"],
          args["codigo_servico"],
        );
        const selected = searchOperations.filter(
          (operation) =>
            (fonte === "todas" || operation.provider === fonte) &&
            requiredArgumentsAvailable(operation, searchArgs),
        );
        const results = await executeManyOrError(service, selected, searchArgs);
        return withOverlapMarker(results);
      },
    });
  }

  // ------- wiring por baixo do McpServer: schemas JSON crus do manifesto na fio -------
  // registerTool do SDK só aceita Zod e reconverte para JSON Schema, o que não preserva
  // keys do manifesto (example/format/etc.). Os handlers abaixo substituem os do McpServer
  // (setRequestHandler substitui handler existente) e servem o JSON Schema byte a byte.
  // ponytail: ceiling — relies on setRequestHandler replace-ordering vs McpServer internals; recheck on SDK major bump
  mcp.server.registerCapabilities({
    tools: { listChanged: true },
    resources: { listChanged: true },
  });
  mcp.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [...tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));
  mcp.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.get(request.params.name);
    if (!tool) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Tool ${request.params.name} not found`,
      );
    }
    try {
      const value = await tool.handler(
        isRecord(request.params.arguments) ? request.params.arguments : {},
      );
      const result: CallToolResult = {
        content: [{ type: "text", text: JSON.stringify(value) }],
      };
      if (isRecord(value)) result.structuredContent = value;
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      } satisfies CallToolResult;
    }
  });
  mcp.server.setRequestHandler(ListResourcesRequestSchema, () => ({
    resources: [...resources.values()].map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: "text/plain",
    })),
  }));
  mcp.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const resource = resources.get(uri);
    if (!resource) {
      throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} not found`);
    }
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: "text/plain",
          text: JSON.stringify(resource.read()),
        },
      ],
    };
  });

  return servidor;
}

export function buildServer(manifestPath?: string): ServidorMcp {
  return buildServerFromManifest(loadManifest(manifestPath));
}

interface ServerArgs {
  manifest: string;
  transport?: "stdio" | "http";
  port?: number;
}

// argparse (help/choices/invalid int/unrecognized) reimplementado no mínimo
// Retorna undefined quando --help foi impresso (argparse exit 0, não inicia servidor).
function parseArgs(argv: string[]): ServerArgs | null | undefined {
  const tokens: string[] = [];
  for (const token of argv) {
    const match = /^(--manifest|--transport|--port)=(.*)$/.exec(token);
    if (match) tokens.push(match[1]!, match[2]!);
    else tokens.push(token);
  }
  const args: ServerArgs = { manifest: DEFAULT_MANIFEST };
  const unrecognized: string[] = [];
  const fail = (message: string): null => {
    process.stderr.write(
      `usage: mcp-compras-publicas-br [-h] [--manifest MANIFEST] [--transport {stdio,http}] [--port PORT]\n` +
        `mcp-compras-publicas-br: error: ${message}\n`,
    );
    process.exitCode = 2;
    return null;
  };
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]!;
    if (token === "-h" || token === "--help") {
      // argparse print_help(): stdout, exit 0.
      process.stdout.write(
        "usage: mcp-compras-publicas-br [-h] [--manifest MANIFEST] [--transport {stdio,http}] [--port PORT]\n\n" +
          "Servidor MCP somente leitura de compras públicas\n\n" +
          "options:\n" +
          "  -h, --help            show this help message and exit\n" +
          "  --manifest MANIFEST\n" +
          "  --transport {stdio,http}\n" +
          "  --port PORT\n",
      );
      return undefined;
    }
    if (token === "--manifest") {
      const value = tokens[++index];
      if (value === undefined) return fail("argument --manifest: expected one argument");
      args.manifest = value;
    } else if (token === "--transport") {
      const value = tokens[++index];
      if (value === undefined) return fail("argument --transport: expected one argument");
      if (value !== "stdio" && value !== "http") {
        return fail(
          `argument --transport: invalid choice: '${value}' (choose from stdio, http)`,
        );
      }
      args.transport = value;
    } else if (token === "--port") {
      const value = tokens[++index];
      if (value === undefined) return fail("argument --port: expected one argument");
      if (!/^[+-]?\d+$/.test(value.trim())) {
        return fail(`argument --port: invalid int value: '${value}'`);
      }
      args.port = Number(value.trim());
    } else {
      unrecognized.push(token);
    }
  }
  if (unrecognized.length > 0) {
    return fail(`unrecognized arguments: ${unrecognized.join(" ")}`);
  }
  return args;
}

export async function main(argv?: string[]): Promise<void> {
  const args = parseArgs(argv ?? process.argv.slice(2));
  if (args === null || args === undefined) return;
  const settings = loadSettings();
  configureLogging(settings);
  const transport = args.transport ?? settings.mcpTransport;

  if (transport === "http") {
    let port = args.port;
    if (port === undefined && process.env["PORT"] !== undefined) {
      port = Number(process.env["PORT"]);
      if (!Number.isInteger(port) || port <= 0) {
        throw new Error("PORT: must be a positive integer");
      }
    }
    if (port === undefined) port = 8000;
    const manifest = loadManifest(args.manifest);
    const service = new QueryService({ settings });
    const httpServer = createServer((req, res) => {
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
      if (pathname !== "/mcp") {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Not Found" },
            id: null,
          }),
        );
        return;
      }
      // stateless: servidor novo por request (manifesto e serviço/cache compartilhados)
      void (async () => {
        try {
          const app = buildServerFromManifest(manifest, service);
          const session = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          res.on("close", () => {
            void session.close();
            void app.close();
          });
          await app.connect(session);
          await session.handleRequest(req, res);
        } catch {
          if (!res.headersSent) {
            res.writeHead(500, { "content-type": "application/json" });
          }
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32603, message: "Internal server error" },
              id: null,
            }),
          );
        }
      })();
    });
    await new Promise<void>((resolve) => httpServer.listen(port, resolve));
    logger.info("MCP server listening", { endpoint: `http://127.0.0.1:${port}/mcp` });
    return;
  }

  const server = buildServerFromManifest(
    loadManifest(args.manifest),
    new QueryService({ settings }),
  );
  await server.connect(new StdioServerTransport());
}
