import { createHash } from "node:crypto";

import {
  McpResponseSchema,
  type McpResponse,
  type Operation,
} from "../catalogo/modelos.js";
import { ComprasClient, PncpClient } from "../provedores/clientes.js";
import {
  ReadOnlyHttpClient,
  UpstreamError,
  type QueryParams,
} from "../../shared/http_readonly.js";
import { loadSettings, TtlCache, type Settings } from "../../shared/runtime.js";

const DEFAULT_RESULT_LIMIT = 100;
const DEFAULT_MAX_PAGE = 10_000;
const DEFAULT_MAX_PAGE_SIZE = 1_000;
// ordem importa: primeiro alias que aparece no payload vence (espelha o dict python)
const PAGINATION_ALIASES: ReadonlyMap<string, string> = new Map([
  ["hasNext", "has_next"],
  ["has_next", "has_next"],
  ["nextPage", "next_page"],
  ["next_page", "next_page"],
  ["proximaPagina", "next_page"],
  ["proxima_pagina", "next_page"],
  ["next", "next"],
  ["nextToken", "next_token"],
  ["next_token", "next_token"],
]);
const TOKEN_PARAMETER_NAMES: readonly string[] = [
  "pageToken",
  "page_token",
  "cursor",
  "cursorToken",
  "continuationToken",
  "nextToken",
  "token",
];
const FORMAT_VALUES: ReadonlySet<string> = new Set(["normalizado", "original"]);
const PAGE_NAMES: readonly string[] = ["pagina", "page"];
const PAGE_SIZE_NAMES: readonly string[] = [
  "tamanhoPagina",
  "tamanho_pagina",
  "pageSize",
  "page_size",
];
const BOUNDED_CONTENT_PREFIXES: readonly string[] = [
  "application/pdf",
  "application/octet-stream",
  "application/zip",
  "application/vnd.",
  "image/",
  "text/csv",
  "text/plain",
];
const BOUNDED_PATH_WORDS: readonly string[] = [
  "/arquivo",
  "/document",
  "/download",
  "/imagem",
  "csv",
];

// espaço em branco conforme str.isspace() do python (inclui \x1c-\x1f e \x85 que \s do JS ignora)
const PY_SPACE =
  /[\t\n\v\f\r\x1c\x1d\x1e\x1f \x85\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/u;

const UTF8_ENCODER = new TextEncoder();

function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullish(value: unknown): boolean {
  return value === null || value === undefined;
}

// str() do python para escalares comuns vindos de JSON/MCP
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

// repr() com o mínimo usado pelas mensagens: strings com aspas simples, None/True/False, números
function pyRepr(value: unknown): string {
  if (typeof value === "string") {
    const quote = value.includes('"') && !value.includes("'") ? '"' : "'";
    let out = quote;
    for (const character of value) {
      const code = character.codePointAt(0)!;
      if (character === quote || character === "\\") out += `\\${character}`;
      else if (character === "\n") out += "\\n";
      else if (character === "\r") out += "\\r";
      else if (character === "\t") out += "\\t";
      else if (code < 0x20) out += `\\x${code.toString(16).padStart(2, "0")}`;
      else out += character;
    }
    return out + quote;
  }
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  try {
    return JSON.stringify(value) ?? "None";
  } catch {
    return String(value);
  }
}

// ascii() do python (conversão !a em templates de caminho; exótico o suficiente para ser simples)
function pyAscii(value: unknown): string {
  return pyRepr(value).replace(
    /[\u0080-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

function pyEq(a: unknown, b: unknown): boolean {
  if (isNullish(a) && isNullish(b)) return true;
  return a === b;
}

// int() do python para strings: sinal opcional, dígitos, espaços ao redor
function pyInt(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[+-]?[0-9]+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function isCalendarDay(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]!;
  return day >= 1 && day <= days[month - 1]!;
}

// urllib.parse.quote(value, safe=""): encodeURIComponent preserva !'()* que o python escapa
function quoteSegment(text: string): string {
  return encodeURIComponent(text).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function normalizeCnpj(value: string): string {
  if (typeof value !== "string") {
    throw new Error("cnpj must contain 14 numeric digits");
  }
  let normalized = "";
  for (const character of value) {
    if (PY_SPACE.test(character)) continue;
    if (/\p{P}/u.test(character)) continue;
    normalized += character;
  }
  if (!/^[0-9]{14}$/.test(normalized)) {
    throw new Error("cnpj must contain 14 numeric digits");
  }
  return normalized;
}

// ponytail: mini string.Formatter; format_spec limitado a zero-padding de inteiro
// (único uso real em templates de caminho). Spec PEP 3101 completo se algum template exigir.
function applyFormatSpec(value: unknown, spec: string): string {
  const padded = /^0(\d+)d?$/.exec(spec);
  if (padded !== null && typeof value === "number" && Number.isInteger(value)) {
    const width = Number(padded[1]);
    const digits = String(Math.abs(value));
    const target = value < 0 ? Math.max(width - 1, 0) : width;
    return `${value < 0 ? "-" : ""}${digits.padStart(target, "0")}`;
  }
  return pyStr(value);
}

export function renderPath(template: string, values: Record<string, unknown>): string {
  const rendered: string[] = [];
  let index = 0;
  let literalStart = 0;
  while (index < template.length) {
    const character = template[index]!;
    if (character === "{" || character === "}") {
      if (template[index + 1] === character) {
        // semântica str.format: "{{" e "}}" são chaves literais escapadas
        rendered.push(template.slice(literalStart, index), character);
        index += 2;
        literalStart = index;
        continue;
      }
      if (character === "}") {
        throw new Error("Single '}' encountered in format string");
      }
      rendered.push(template.slice(literalStart, index));
    } else {
      index += 1;
      continue;
    }
    const end = template.indexOf("}", index + 1);
    if (end === -1) throw new Error("Single '{' encountered in format string");
    let field = template.slice(index + 1, end);
    let conversion: string | null = null;
    let formatSpec = "";
    const bang = field.indexOf("!");
    const colon = field.indexOf(":");
    if (bang !== -1 && (colon === -1 || bang < colon)) {
      conversion = field.slice(bang + 1, bang + 2);
      const rest = field.slice(bang + 2);
      formatSpec = rest.startsWith(":") ? rest.slice(1) : "";
      field = field.slice(0, bang);
    } else if (colon !== -1) {
      formatSpec = field.slice(colon + 1);
      field = field.slice(0, colon);
    }
    if (!Object.hasOwn(values, field)) {
      throw new Error(`missing path parameter: ${field}`);
    }
    let value: unknown = values[field];
    if (conversion === "r") value = pyRepr(value);
    else if (conversion === "s") value = pyStr(value);
    else if (conversion === "a") value = pyAscii(value);
    const text = formatSpec !== "" ? applyFormatSpec(value, formatSpec) : pyStr(value);
    rendered.push(quoteSegment(text));
    index = end + 1;
    literalStart = index;
  }
  rendered.push(template.slice(literalStart));
  return rendered.join("");
}

// json.dumps(sort_keys=True, separators=(",",":"), ensure_ascii=True) do python, byte a byte.
// ponytail: chaves ordenadas por unidade de código UTF-16 (python ordena por code point);
// divergência só com chaves não-BMP misturadas com U+E000-U+FFFF, irreal aqui.
function canonicalJson(value: unknown): string {
  return ensureAscii(canonicalValue(value));
}

function canonicalValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value) ?? "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalValue).join(",")}]`;
  const parts: string[] = [];
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record).sort()) {
    const item = record[key];
    if (item === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${canonicalValue(item)}`);
  }
  return `{${parts.join(",")}}`;
}

// ensure_ascii=True: escapa tudo fora de \x20-\x7e como \uXXXX minúsculo (pares surrogados incluídos)
function ensureAscii(text: string): string {
  return text.replace(
    /[\u0080-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export interface ProviderClient {
  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient;
  normalizePage(payload: unknown): {
    items: unknown;
    pagination: Record<string, unknown>;
  };
}

interface CacheLike {
  get(key: string): unknown;
  put(key: string, value: unknown, ttlSeconds: number): void;
}

export interface QueryServiceOptions {
  settings?: Settings;
  cache?: TtlCache;
  comprasFactory?: () => ProviderClient;
  pncpFactory?: () => ProviderClient;
  maxPage?: number;
  maxPageSize?: number;
  maxResults?: number;
  maxDocumentBytes?: number;
}

function defaultComprasFactory(): ProviderClient {
  const client = new ComprasClient();
  return {
    client: (opts) => client.client(opts),
    normalizePage: (payload) => ComprasClient.normalizePage(payload),
  };
}

function defaultPncpFactory(): ProviderClient {
  const client = new PncpClient();
  return {
    client: (opts) => client.client(opts),
    normalizePage: (payload) => PncpClient.normalizePage(payload),
  };
}

export class QueryService {
  private readonly settings: Settings;
  private readonly cache: CacheLike;
  private readonly factories: Record<string, () => ProviderClient>;
  readonly maxPage: number;
  readonly maxPageSize: number;
  readonly maxResults: number;
  readonly maxDocumentBytes: number;

  constructor(options: QueryServiceOptions = {}) {
    this.settings = options.settings ?? loadSettings();
    this.cache = options.cache ?? new TtlCache();
    this.factories = {
      compras: options.comprasFactory ?? defaultComprasFactory,
      pncp: options.pncpFactory ?? defaultPncpFactory,
    };
    this.maxPage = this._configuredLimit(
      options.maxPage,
      ["max_page", "max_pagina"],
      DEFAULT_MAX_PAGE,
      "max_page",
    );
    this.maxPageSize = this._configuredLimit(
      options.maxPageSize,
      ["max_page_size", "max_tamanho_pagina"],
      DEFAULT_MAX_PAGE_SIZE,
      "max_page_size",
    );
    this.maxResults = this._configuredLimit(
      options.maxResults,
      ["max_results", "max_resultados", "max_limite_resultados"],
      DEFAULT_RESULT_LIMIT,
      "max_results",
    );
    this.maxDocumentBytes = this._configuredLimit(
      options.maxDocumentBytes,
      ["max_document_bytes"],
      25_000_000,
      "max_document_bytes",
    );
  }

  // settings TS usa camelCase; nomes python (snake_case) são traduzidos na consulta
  private _settingValue(name: string): unknown {
    const settings = this.settings as unknown as Record<string, unknown>;
    if (Object.hasOwn(settings, name)) return settings[name];
    const camel = name.replace(/_([a-z\d])/g, (_match, letter: string) => letter.toUpperCase());
    return Object.hasOwn(settings, camel) ? settings[camel] : undefined;
  }

  private _settingInt(names: readonly string[], fallback: number): number {
    for (const name of names) {
      const value = this._settingValue(name);
      if (typeof value === "number" && Number.isInteger(value)) return value;
    }
    return fallback;
  }

  private _configuredLimit(
    explicit: number | undefined,
    names: readonly string[],
    fallback: number,
    label: string,
  ): number {
    const value: unknown = explicit !== undefined ? explicit : this._settingInt(names, fallback);
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} must be a positive integer`);
    }
    return value;
  }

  async execute(operation: Operation, args: Record<string, unknown>): Promise<McpResponse> {
    if (operation.method !== "GET") {
      throw new Error("only GET operations are supported");
    }

    QueryService._validateSupportedParameters(operation);
    const parameters = QueryService._parameters(operation);
    const resolvedArguments = this._resolveArguments(args, parameters);
    QueryService._checkRequired(resolvedArguments, parameters);

    let formato: unknown = "normalizado";
    if (Object.hasOwn(resolvedArguments, "formato")) {
      formato = resolvedArguments["formato"];
      delete resolvedArguments["formato"];
    }
    if (typeof formato !== "string" || !FORMAT_VALUES.has(formato)) {
      throw new Error("formato must be one of: normalizado, original");
    }
    let autoPaginar: unknown = false;
    if (Object.hasOwn(resolvedArguments, "auto_paginar")) {
      autoPaginar = resolvedArguments["auto_paginar"];
      delete resolvedArguments["auto_paginar"];
    }
    if (typeof autoPaginar !== "boolean") {
      throw new Error("auto_paginar must be a boolean");
    }

    const pageName = QueryService._findParameter(parameters, PAGE_NAMES);
    const pageSizeName = QueryService._findParameter(parameters, PAGE_SIZE_NAMES);
    const tokenName = QueryService._findParameter(parameters, TOKEN_PARAMETER_NAMES);
    let limitRequested: unknown;
    if (Object.hasOwn(resolvedArguments, "limite_resultados")) {
      limitRequested = resolvedArguments["limite_resultados"];
      delete resolvedArguments["limite_resultados"];
    }
    const isListOperation =
      pageName !== null || pageSizeName !== null || tokenName !== null;
    if (
      Object.hasOwn(args, "auto_paginar") &&
      (!isListOperation || (pageName === null && tokenName === null))
    ) {
      throw new Error("auto_paginar requires a documented query pagination parameter");
    }
    if (
      ((limitRequested !== undefined && limitRequested !== null) ||
        Object.hasOwn(args, "limite_resultados")) &&
      !isListOperation
    ) {
      throw new Error("limite_resultados requires a documented pagination parameter");
    }
    let limit: number | null;
    if (isListOperation) {
      limit = this._validateLimit(limitRequested);
    } else if (limitRequested !== undefined && limitRequested !== null) {
      limit = this.maxResults;
    } else {
      limit = null;
    }

    const pathValues: Record<string, unknown> = {};
    const query: Record<string, unknown> = {};
    for (const [name, rawValue] of Object.entries(resolvedArguments)) {
      const parameter = parameters[name]!;
      let value = rawValue;
      if (isNullish(value)) {
        if (parameter["required"]) {
          throw new Error(`parameter ${name} is required`);
        }
        continue;
      }
      value = QueryService._normalizeParameter(name, value);
      this._validateParameter(name, value, parameter);
      const location = parameter["in"];
      if (location === "path") {
        pathValues[name] = value;
      } else if (location === "query") {
        query[name] = value;
      } else {
        throw new Error(`unsupported parameter location for ${name}`);
      }
    }

    if (pageName !== null && Object.hasOwn(query, pageName)) {
      QueryService._validatePageValue(query[pageName], pageName, this.maxPage);
    }
    if (pageSizeName !== null && Object.hasOwn(query, pageSizeName)) {
      QueryService._validatePageValue(query[pageSizeName], pageSizeName, this.maxPageSize);
    }
    if (autoPaginar && pageName !== null && !Object.hasOwn(query, pageName)) {
      query[pageName] = 1;
    }
    if (formato === "original") {
      if (autoPaginar) {
        throw new Error("formato=original cannot be combined with auto_paginar");
      }
      if (limitRequested !== undefined && limitRequested !== null) {
        throw new Error("formato=original cannot be combined with limite_resultados");
      }
    }

    const path = renderPath(operation.path, pathValues);
    const cacheKey = this._cacheKey(
      operation,
      path,
      query,
      formato,
      autoPaginar,
      limit,
    );
    const cacheAllowed =
      this._cacheEnabled() &&
      QueryService._isPublic(operation) &&
      !QueryService._isBoundedContent(operation);
    if (cacheAllowed) {
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined && cached !== null) {
        const cachedCopy = structuredClone(cached);
        const cachedResponse = McpResponseSchema.parse(cachedCopy);
        if (QueryService._cacheableResponse(operation, cachedResponse)) {
          return cachedResponse;
        }
      }
    }

    const factory = this.factories[operation.provider];
    const adapter = factory!();
    const normalizePage = adapter.normalizePage;
    if (typeof normalizePage !== "function") {
      throw new TypeError("provider adapter must expose normalize_page");
    }

    let firstPayload: unknown = null;
    let payloadSeen = false;
    let normalizedItems: unknown[] = [];
    let itemsAreLists = false;
    const pagination: Record<string, unknown> = {};
    const currentQuery: Record<string, unknown> = { ...query };
    const visitedPositions = new Set<string>();

    try {
      const client = adapter.client({ maxDocumentBytes: this.maxDocumentBytes });
      for (;;) {
        const position = QueryService._position(currentQuery, pageName, tokenName);
        const positionKey = JSON.stringify(position);
        if (visitedPositions.has(positionKey)) {
          throw new Error("pagination did not make forward progress");
        }
        visitedPositions.add(positionKey);
        const payload = await client.get(path, currentQuery as unknown as QueryParams);
        if (!payloadSeen) {
          firstPayload = payload;
          payloadSeen = true;
        }
        if (
          QueryService._isBoundedContent(operation) &&
          QueryService._contentSize(payload) > this.maxDocumentBytes
        ) {
          return QueryService._fileSizeResponse(operation, query);
        }
        const page = normalizePage.call(adapter, payload) as {
          items: unknown;
          pagination: unknown;
        };
        const items = page.items;
        const pagePagination = QueryService._pagination(payload, page.pagination);
        Object.assign(pagination, pagePagination);
        if (Array.isArray(items)) {
          itemsAreLists = true;
          normalizedItems.push(...items);
        } else if (normalizedItems.length === 0) {
          normalizedItems = [items];
        }

        if (!autoPaginar || !Array.isArray(items)) break;
        if (limit !== null && normalizedItems.length >= limit) break;
        const nextPosition = QueryService._nextPosition(
          pagePagination,
          currentQuery,
          pageName,
          tokenName,
        );
        if (nextPosition === null) break;
        if (visitedPositions.has(JSON.stringify(nextPosition))) {
          throw new Error("pagination did not make forward progress");
        }
        if (position[0] === "page" && nextPosition[0] === "page") {
          if (Number(nextPosition[1]) <= Number(position[1])) {
            throw new Error("pagination page must make forward progress");
          }
        }
        if (nextPosition[0] === "page") {
          if (pageName === null) {
            throw new Error("upstream returned a page without a query page parameter");
          }
          const nextPage = Number(nextPosition[1]);
          QueryService._validatePageValue(nextPage, pageName, this.maxPage);
          currentQuery[pageName] = nextPage;
        } else {
          if (tokenName === null) {
            throw new Error("upstream returned a token without a query token parameter");
          }
          currentQuery[tokenName] = nextPosition[1];
        }
      }
    } catch (error) {
      if (
        !(error instanceof UpstreamError) ||
        error.kind !== "DOCUMENT_TOO_LARGE" ||
        !QueryService._isBoundedContent(operation)
      ) {
        throw error;
      }
      return QueryService._fileSizeResponse(operation, query);
    }

    let data: unknown;
    if (formato === "original") {
      data = firstPayload;
    } else if (itemsAreLists) {
      data = normalizedItems;
    } else {
      data = normalizedItems.length > 0 ? normalizedItems[0] : null;
    }
    if (formato !== "original" && limit !== null && Array.isArray(data)) {
      data = (data as unknown[]).slice(0, limit);
    }

    const response = QueryService._response(operation, query, data, pagination);
    if (cacheAllowed && QueryService._cacheableResponse(operation, response)) {
      this.cache.put(cacheKey, structuredClone(response), this._cacheTtl(operation));
    }
    return response;
  }

  // ponytail: sequencial como o python; paralelizar só se um dia precisar
  async executeMany(
    operations: Operation[],
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};
    for (const operation of operations) {
      QueryService._validateSupportedParameters(operation);
      const parameters = QueryService._parameters(operation);
      const pageName = QueryService._findParameter(parameters, PAGE_NAMES);
      const pageSizeName = QueryService._findParameter(parameters, PAGE_SIZE_NAMES);
      const tokenName = QueryService._findParameter(parameters, TOKEN_PARAMETER_NAMES);
      const isListOperation =
        pageName !== null || pageSizeName !== null || tokenName !== null;
      if (!isListOperation) {
        if (Object.hasOwn(args, "auto_paginar")) {
          throw new Error("auto_paginar requires a documented query pagination parameter");
        }
        if (Object.hasOwn(args, "limite_resultados")) {
          throw new Error("limite_resultados requires a documented pagination parameter");
        }
      }
      const allowed = new Set<string>(Object.keys(parameters));
      for (const alias of [
        "page",
        "page_size",
        "pageSize",
        "tamanhoPagina",
        "pagina",
        "tamanho_pagina",
      ]) {
        if (QueryService._resolveName(alias, parameters) !== null) allowed.add(alias);
      }
      allowed.add("formato");
      if (isListOperation) {
        allowed.add("auto_paginar");
        allowed.add("limite_resultados");
      }
      const filtered: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (allowed.has(key)) filtered[key] = value;
      }
      const response = await this.execute(operation, filtered);
      results[operation.tool || operation.id] = response;
    }
    return results;
  }

  private static _parameters(
    operation: Operation,
  ): Record<string, Record<string, unknown>> {
    const parameters: Record<string, Record<string, unknown>> = {};
    for (const rawParameter of operation.parameters) {
      const name = rawParameter["name"];
      const location = rawParameter["in"];
      if (typeof name === "string" && (location === "path" || location === "query")) {
        parameters[name] = { ...rawParameter };
      }
    }
    return parameters;
  }

  private static _validateSupportedParameters(operation: Operation): void {
    for (const parameter of operation.parameters) {
      const location = parameter["in"];
      if (location !== "path" && location !== "query" && parameter["required"]) {
        const name = Object.hasOwn(parameter, "name") ? parameter["name"] : "<unnamed>";
        throw new Error(
          `unsupported required parameter ${pyRepr(name)} in location ${pyRepr(
            location ?? null,
          )}`,
        );
      }
    }
  }

  private _resolveArguments(
    args: Record<string, unknown>,
    parameters: Record<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(args)) {
      if (name === "formato" || name === "auto_paginar" || name === "limite_resultados") {
        resolved[name] = value;
        continue;
      }
      const actualName = QueryService._resolveName(name, parameters);
      if (actualName === null) {
        throw new Error(`unknown parameter: ${name}`);
      }
      resolved[actualName] = value;
    }
    return resolved;
  }

  private static _resolveName(
    name: string,
    parameters: Record<string, Record<string, unknown>>,
  ): string | null {
    if (Object.hasOwn(parameters, name)) return name;
    const aliases: Record<string, readonly string[]> = {
      pagina: ["page"],
      page: ["pagina"],
      tamanho_pagina: ["tamanhoPagina", "pageSize", "page_size"],
      tamanhoPagina: ["tamanho_pagina", "pageSize", "page_size"],
      pageSize: ["tamanhoPagina", "tamanho_pagina", "page_size"],
      page_size: ["pageSize", "tamanhoPagina", "tamanho_pagina"],
    };
    for (const candidate of aliases[name] ?? []) {
      if (Object.hasOwn(parameters, candidate) && parameters[candidate]!["in"] === "query") {
        return candidate;
      }
    }
    return null;
  }

  private static _checkRequired(
    args: Record<string, unknown>,
    parameters: Record<string, Record<string, unknown>>,
  ): void {
    for (const [name, parameter] of Object.entries(parameters)) {
      if (
        parameter["required"] &&
        (!Object.hasOwn(args, name) || isNullish(args[name]))
      ) {
        throw new Error(`missing required parameter: ${name}`);
      }
    }
  }

  private static _findParameter(
    parameters: Record<string, Record<string, unknown>>,
    names: readonly string[],
  ): string | null {
    for (const name of names) {
      if (Object.hasOwn(parameters, name) && parameters[name]!["in"] === "query") {
        return name;
      }
    }
    return null;
  }

  private static _normalizeParameter(name: string, value: unknown): unknown {
    const lowered = name.toLowerCase();
    if (lowered.includes("cnpj") && !lowered.includes("cpf")) {
      return normalizeCnpj(value as string);
    }
    return value;
  }

  private _validateParameter(
    name: string,
    value: unknown,
    parameter: Record<string, unknown>,
  ): void {
    const schemaValue = parameter["schema"];
    const schema: Record<string, unknown> = isMapping(schemaValue) ? schemaValue : {};
    const expectedType = schema["type"];
    const expectedTypes: unknown[] = Array.isArray(expectedType)
      ? expectedType
      : expectedType !== undefined && expectedType !== null
        ? [expectedType]
        : [];
    if (
      expectedTypes.length > 0 &&
      !expectedTypes.some((typeName) => QueryService._matchesType(value, typeName))
    ) {
      const expected = expectedTypes.map((typeName) => pyStr(typeName)).join(", ");
      throw new Error(`parameter ${name} must have type ${expected}`);
    }

    const enumValues = schema["enum"];
    if (Array.isArray(enumValues) && !enumValues.some((item) => pyEq(item, value))) {
      throw new Error(
        `parameter ${name} must be one of [${enumValues.map((item) => pyRepr(item)).join(", ")}]`,
      );
    }
    QueryService._validateFormat(name, value, schema["format"]);
    const pattern = schema["pattern"];
    if (
      typeof pattern === "string" &&
      typeof value === "string" &&
      !new RegExp(pattern).test(value)
    ) {
      throw new Error(`parameter ${name} has an invalid format`);
    }
    if (typeof value === "string") {
      const minimumLength = schema["minLength"];
      const maximumLength = schema["maxLength"];
      const length = [...value].length;
      if (typeof minimumLength === "number" && length < minimumLength) {
        throw new Error(
          `parameter ${name} is shorter than ${pyStr(minimumLength)} characters`,
        );
      }
      if (typeof maximumLength === "number" && length > maximumLength) {
        throw new Error(
          `parameter ${name} is longer than ${pyStr(maximumLength)} characters`,
        );
      }
    }
    QueryService._validateBounds(name, value, schema);
  }

  private static _matchesType(value: unknown, typeName: unknown): boolean {
    switch (typeName) {
      case "string":
        return typeof value === "string";
      case "integer":
        return typeof value === "number" && Number.isInteger(value);
      case "number":
        return typeof value === "number";
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return isMapping(value);
      case "null":
        return isNullish(value);
      default:
        return true;
    }
  }

  private static _validateFormat(
    name: string,
    value: unknown,
    formatName: unknown,
  ): void {
    if (typeof formatName !== "string") return;
    if (formatName === "int32" || formatName === "int64") {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error(`parameter ${name} must be an integer`);
      }
      const bound = 2 ** (formatName === "int32" ? 31 : 63);
      if (!(value >= -bound && value < bound)) {
        throw new Error(`parameter ${name} is outside ${formatName} range`);
      }
    } else if (formatName === "date") {
      if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
        throw new Error(`parameter ${name} must be a date`);
      }
      const [year, month, day] = value.split("-").map(Number) as [number, number, number];
      if (!isCalendarDay(year, month, day)) {
        throw new Error(`parameter ${name} must be a date`);
      }
    } else if (formatName === "date-time") {
      const match =
        typeof value === "string"
          ? /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]+)?(?:Z|([+-])([0-9]{2}):([0-9]{2}))$/.exec(
              value,
            )
          : null;
      if (match === null) {
        throw new Error(`parameter ${name} must be a date-time`);
      }
      const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
      // ponytail: hora estrita <24 e offset <24h como datetime.fromisoformat; 24:00:00 não aceito
      const valid =
        isCalendarDay(Number(year), Number(month), Number(day)) &&
        Number(hour) < 24 &&
        Number(minute) < 60 &&
        Number(second) < 60 &&
        Number(offsetHour ?? 0) * 60 + Number(offsetMinute ?? 0) < 1440;
      if (!valid) {
        throw new Error(`parameter ${name} must be a date-time`);
      }
    }
  }

  private static _validateBounds(
    name: string,
    value: unknown,
    schema: Record<string, unknown>,
  ): void {
    if (typeof value !== "number") return;
    if (!Number.isFinite(value)) {
      throw new Error(`parameter ${name} must be finite`);
    }
    const minimum = schema["minimum"];
    if (typeof minimum === "number" && value < minimum) {
      throw new Error(`parameter ${name} exceeds minimum ${pyStr(minimum)}`);
    }
    const maximum = schema["maximum"];
    if (typeof maximum === "number" && value > maximum) {
      throw new Error(`parameter ${name} exceeds maximum ${pyStr(maximum)}`);
    }
    const exclusiveMinimum = schema["exclusiveMinimum"];
    if (exclusiveMinimum === true && typeof minimum === "number") {
      if (value <= minimum) {
        throw new Error(`parameter ${name} must be greater than ${pyStr(minimum)}`);
      }
    } else if (
      typeof exclusiveMinimum === "number" &&
      value <= exclusiveMinimum
    ) {
      throw new Error(
        `parameter ${name} must be greater than ${pyStr(exclusiveMinimum)}`,
      );
    }
    const exclusiveMaximum = schema["exclusiveMaximum"];
    if (exclusiveMaximum === true && typeof maximum === "number") {
      if (value >= maximum) {
        throw new Error(`parameter ${name} must be less than ${pyStr(maximum)}`);
      }
    } else if (
      typeof exclusiveMaximum === "number" &&
      value >= exclusiveMaximum
    ) {
      throw new Error(
        `parameter ${name} must be less than ${pyStr(exclusiveMaximum)}`,
      );
    }
  }

  private static _validatePageValue(
    value: unknown,
    name: string,
    maximum: number,
  ): void {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw new Error(`parameter ${name} must be a positive integer`);
    }
    if (value > maximum) {
      throw new Error(`parameter ${name} must be at most ${maximum}`);
    }
  }

  private _validateLimit(value: unknown): number {
    if (isNullish(value)) {
      if (DEFAULT_RESULT_LIMIT > this.maxResults) {
        throw new Error("max_results must be at least 100 for the default limit");
      }
      return DEFAULT_RESULT_LIMIT;
    }
    QueryService._validatePageValue(value, "limite_resultados", this.maxResults);
    return value as number;
  }

  private static _pagination(payload: unknown, normalized: unknown): Record<string, unknown> {
    const result: Record<string, unknown> = isMapping(normalized)
      ? { ...normalized }
      : {};
    if (isMapping(payload)) {
      for (const [upstreamName, normalizedName] of PAGINATION_ALIASES) {
        if (Object.hasOwn(payload, upstreamName) && !(normalizedName in result)) {
          result[normalizedName] = payload[upstreamName];
        }
      }
    }
    return result;
  }

  private static _position(
    query: Record<string, unknown>,
    pageName: string | null,
    tokenName: string | null,
  ): [string, string] {
    if (tokenName !== null && Object.hasOwn(query, tokenName)) {
      return ["token", pyStr(query[tokenName])];
    }
    if (pageName !== null && Object.hasOwn(query, pageName)) {
      return ["page", pyStr(query[pageName])];
    }
    return ["initial", ""];
  }

  private static _nextPosition(
    pagination: Record<string, unknown>,
    query: Record<string, unknown>,
    pageName: string | null,
    tokenName: string | null,
  ): [string, string] | null {
    const currentPage = pageName !== null ? query[pageName] : undefined;
    const current =
      typeof currentPage === "number" && Number.isInteger(currentPage) ? currentPage : 1;
    for (const key of ["next_page", "next_token", "next"] as const) {
      const raw = pagination[key];
      if (!(key in pagination) || raw === null || raw === undefined || raw === false) {
        continue;
      }
      if (raw === "") continue;
      if (key === "next_token") {
        if (tokenName === null) {
          throw new Error("upstream returned a token without a query token parameter");
        }
        if (
          typeof raw === "boolean" ||
          (typeof raw !== "string" &&
            !(typeof raw === "number" && Number.isInteger(raw)))
        ) {
          throw new Error("upstream returned an invalid next token");
        }
        return ["token", pyStr(raw)];
      }
      let value: unknown = raw;
      if (typeof value === "string") {
        const parsed = pyInt(value);
        if (parsed === null) {
          if (tokenName === null) {
            throw new Error(
              "upstream returned a non-numeric page without a query token parameter",
            );
          }
          return ["token", value];
        }
        value = parsed;
      } else if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error("upstream returned an invalid next page");
      }
      if (pageName === null) {
        throw new Error("upstream returned a page without a query page parameter");
      }
      return ["page", String(value)];
    }
    if (Object.hasOwn(pagination, "has_next")) {
      const hasNext = pagination["has_next"];
      if (typeof hasNext !== "boolean" || !hasNext) return null;
      if (pageName !== null) return ["page", String(current + 1)];
      throw new Error("upstream pagination did not provide a next token");
    }
    const totalPages = pagination["total_pages"];
    if (
      pageName !== null &&
      typeof totalPages === "number" &&
      Number.isInteger(totalPages) &&
      totalPages > current
    ) {
      return ["page", String(current + 1)];
    }
    return null;
  }

  private _cacheKey(
    operation: Operation,
    path: string,
    query: Record<string, unknown>,
    formato: string,
    autoPaginar: boolean,
    limit: number | null,
  ): string {
    const cacheQuery = {
      query,
      formato,
      auto_paginar: autoPaginar,
      limite_resultados: limit,
    };
    const material = canonicalJson([operation.provider, operation.id, path, cacheQuery]);
    return createHash("sha256").update(material, "utf8").digest("hex");
  }

  private _cacheEnabled(): boolean {
    const raw = this._settingValue("cache_enabled");
    const value = raw === undefined ? true : raw;
    if (typeof value === "string") {
      return !["0", "false", "no", "off"].includes(value.toLowerCase());
    }
    return Boolean(value);
  }

  private static _isPublic(operation: Operation): boolean {
    return operation.classification === "PUBLIC_USEFUL";
  }

  private static _containsUnreturnedContent(value: unknown): boolean {
    if (isMapping(value)) {
      if (value["content_returned"] === false) return true;
      return Object.values(value).some((item) =>
        QueryService._containsUnreturnedContent(item),
      );
    }
    if (Array.isArray(value)) {
      return value.some((item) => QueryService._containsUnreturnedContent(item));
    }
    return false;
  }

  private static _cacheableResponse(
    operation: Operation,
    response: McpResponse,
  ): boolean {
    return (
      QueryService._isPublic(operation) &&
      !QueryService._isBoundedContent(operation) &&
      !QueryService._containsUnreturnedContent(response.data)
    );
  }

  private _cacheTtl(operation: Operation): number {
    const extra = operation as unknown as Record<string, unknown>;
    // paridade com extra.get("cache_category", extra.get("category", "")):
    // chave presente mesmo nula → str(None) = "None" → categoria desconhecida.
    const category = pyStr(
      Object.hasOwn(extra, "cache_category")
        ? extra["cache_category"]
        : Object.hasOwn(extra, "category")
          ? extra["category"]
          : "",
    ).toLowerCase();
    const path = operation.path.toLowerCase();
    let resolved = category;
    if (!resolved) {
      if (path.includes("dominio") || path.includes("domain")) {
        resolved = "domains";
      } else if (
        ["catalog", "modalidade", "modulo-material", "modulo-servico"].some((marker) =>
          path.includes(marker),
        )
      ) {
        resolved = "catalog";
      } else if (path.includes("histor")) {
        resolved = "historical";
      } else {
        resolved = "recent";
      }
    }
    const names: Record<string, string> = {
      domain: "cache_domains_ttl",
      domains: "cache_domains_ttl",
      catalog: "cache_catalog_ttl",
      recent: "cache_recent_ttl",
      historical: "cache_historical_ttl",
    };
    return this._settingInt([names[resolved] ?? "cache_recent_ttl"], 300);
  }

  private static _isBoundedContent(operation: Operation): boolean {
    const path = operation.path.toLowerCase();
    if (BOUNDED_PATH_WORDS.some((word) => path.includes(word))) return true;
    const extra = operation as unknown as Record<string, unknown>;
    const responses = extra["responses"];
    if (!isMapping(responses)) return false;
    for (const rawResponse of Object.values(responses)) {
      if (!isMapping(rawResponse)) continue;
      const content = rawResponse["content"];
      if (
        isMapping(content) &&
        Object.keys(content).some((contentType) =>
          BOUNDED_CONTENT_PREFIXES.some((prefix) => contentType.startsWith(prefix)),
        )
      ) {
        return true;
      }
    }
    return false;
  }

  private static _contentSize(payload: unknown): number {
    if (payload instanceof Uint8Array) return payload.byteLength;
    if (payload instanceof ArrayBuffer) return payload.byteLength;
    if (typeof payload === "string") return UTF8_ENCODER.encode(payload).length;
    if (isMapping(payload)) {
      for (const key of ["content", "body"]) {
        if (Object.hasOwn(payload, key)) {
          return QueryService._contentSize(payload[key]);
        }
      }
    }
    return 0;
  }

  private static _fileSizeResponse(
    operation: Operation,
    query: Record<string, unknown>,
  ): McpResponse {
    return QueryService._response(
      operation,
      query,
      {
        download_available: true,
        content_returned: false,
        reason: "file_size_limit",
      },
      {},
    );
  }

  private static _response(
    operation: Operation,
    query: Record<string, unknown>,
    data: unknown,
    pagination: Record<string, unknown>,
  ): McpResponse {
    return {
      source: operation.provider,
      endpoint: operation.path,
      query,
      data,
      // ponytail: ms precision padded to microsecond format
      metadata: {
        retrieved_at: `${new Date().toISOString().slice(0, 23)}000+00:00`,
        pagination,
      },
    };
  }
}
