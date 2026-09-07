import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join } from "node:path";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

import type { Classification, CoverageReport, Operation } from "./modelos.js";

export const DEFAULT_OFFICIAL_URLS: Record<string, string> = {
  compras: "https://dadosabertos.compras.gov.br/v3/api-docs",
  pncp: "https://pncp.gov.br/pncp-api/v3/api-docs",
};
export const TOOL_NAME_OVERRIDES_VERSION = 1;
export const TOOL_NAME_OVERRIDES: Record<string, string> = {
  "compras.GET./modulo-indicadores/1_consultarIndicadoresConsolidados":
    "compras_consultar_indicadores_consolidados",
  "pncp.GET./v1/modalidades": "pncp_listar_modalidades",
};
export const TOOL_NAME_RE = /^(compras|pncp)_[a-z0-9_]+$/;
const _NON_ATOMIC_TOOLS: readonly (readonly [string, string, string, string])[] = [
  [
    "listar_capacidades_mcp",
    "Lista as fontes, domínios, cobertura, quantidade de ferramentas atômicas " +
      "e versão do catálogo MCP.",
    "nenhum.",
    "consulta metadados carregados do manifesto e não faz alterações nas fontes " +
      "ou no catálogo.",
  ],
  [
    "verificar_saude_fontes",
    "Executa probes públicos leves e informa se as fontes Compras.gov.br e PNCP " +
      "estão operacionais ou indisponíveis.",
    "nenhum.",
    "faz apenas requisições GET catalogadas para " +
      "`/modulo-indicadores/1_consultarIndicadoresConsolidados` e `/v1/modalidades`.",
  ],
  [
    "pncp_obter_contratacao_completa",
    "Consulta, em conjunto, os recursos públicos relacionados a uma contratação no PNCP.",
    "`cnpj` (string), `ano` (inteiro) e `sequencial_contratacao` (inteiro).",
    "agrega consultas GET dos recursos da contratação e não cria, altera ou exclui dados.",
  ],
  [
    "pncp_obter_ata_completa",
    "Consulta, em conjunto, os recursos públicos relacionados a uma ata de registro " +
      "de preços no PNCP.",
    "`cnpj` (string), `ano` (inteiro), `sequencial_contratacao` (inteiro) e " +
      "`sequencial_ata` (inteiro).",
    "agrega consultas GET dos recursos da ata e não cria, altera ou exclui dados.",
  ],
  [
    "pncp_obter_contrato_completo",
    "Consulta, em conjunto, os recursos públicos relacionados a um contrato no PNCP.",
    "`cnpj` (string), `ano` (inteiro) e `sequencial_contrato` (inteiro).",
    "agrega consultas GET dos recursos do contrato e não cria, altera ou exclui dados.",
  ],
  [
    "buscar_compras_publicas",
    "Pesquisa compras públicas nas fontes catalogadas, no Compras.gov.br, no PNCP ou em ambas.",
    "`texto` (string), `orgao`, `uasg`, `cnpj`, `modalidade`, `data_inicio`, `data_fim`, " +
      "`codigo_material`, `codigo_servico` e `fonte` (`compras`, `pncp` ou `todas`).",
    "executa apenas consultas GET catalogadas, sem deduplicar ou modificar resultados, " +
      "registros ou fontes.",
  ],
];
const _NON_ATOMIC_TOOL_NAMES = new Set(_NON_ATOMIC_TOOLS.map(([name]) => name));
export const CURATION_FIELDS = new Set(["classification", "implemented", "tool", "exclusion"]);
export const UNORDERED_LIST_FIELDS = new Set(["enum", "required"]);
export const CLASSIFICATIONS = new Set([
  "PUBLIC_USEFUL",
  "PUBLIC_NOT_USEFUL",
  "AUTHENTICATED",
  "DEPRECATED",
  "BROKEN_UPSTREAM",
  "INTERNAL",
  "UNKNOWN",
]);
export type ChangeType =
  | "response_changed"
  | "security_changed"
  | "deprecated_changed"
  | "parameter_added"
  | "parameter_removed"
  | "parameter_required_changed"
  | "parameter_type_changed"
  | "description_changed"
  | "source_version_changed";
export type ChangeImpact = "breaking" | "non_breaking" | "documentation_only";
export const CHANGE_TYPES: readonly ChangeType[] = [
  "response_changed",
  "security_changed",
  "deprecated_changed",
  "parameter_added",
  "parameter_removed",
  "parameter_required_changed",
  "parameter_type_changed",
  "description_changed",
  "source_version_changed",
];
export const CHANGE_IMPACTS: readonly ChangeImpact[] = [
  "breaking",
  "non_breaking",
  "documentation_only",
];

type Rec = Record<string, unknown>;

export interface CatalogChange {
  operation_id: string;
  change_type: ChangeType;
  impact: ChangeImpact;
  before: unknown;
  after: unknown;
  readonly kind: ChangeType;
  readonly classification: ChangeImpact;
  readonly type: ChangeType;
  readonly severity: ChangeImpact;
  readonly id: string;
}

export interface CatalogDiff {
  added: Rec[];
  removed: Rec[];
  changed: Rec[];
  changes: CatalogChange[];
  readonly typed_changes: CatalogChange[];
  readonly semantic_changes: CatalogChange[];
  readonly semantic: CatalogChange[];
}

export type SemanticChange = CatalogChange;

function isRec(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mirrors dict.get(key): missing keys yield null (Python None).
function get(o: unknown, key: string): unknown {
  return isRec(o) && Object.hasOwn(o, key) ? o[key] : null;
}

// Mirrors dict.get(key, default): an explicit null stays null, only missing keys yield the default.
function getD(o: unknown, key: string, fallback: unknown): unknown {
  return isRec(o) && Object.hasOwn(o, key) ? o[key] : fallback;
}

function pyBool(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRec(value)) return Object.keys(value).length > 0;
  return true;
}

// Python repr/str of a float: integral floats keep the ".0" suffix.
function pyFloat(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e16) return value.toFixed(1);
  return String(value);
}

function pyStr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : pyFloat(value);
  return pyRepr(value);
}

function pyRepr(value: unknown): string {
  if (typeof value === "string") {
    const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
    let out = quote;
    for (const ch of value) {
      if (ch === "\\") out += "\\\\";
      else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch === quote) out += "\\" + ch;
      else out += ch;
    }
    return out + quote;
  }
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : pyFloat(value);
  if (Array.isArray(value)) return "[" + value.map(pyRepr).join(", ") + "]";
  if (isRec(value)) {
    return (
      "{" +
      Object.entries(value)
        .map(([k, item]) => pyRepr(k) + ": " + pyRepr(item))
        .join(", ") +
      "}"
    );
  }
  return String(value);
}

// str((a, b)) of a two-tuple: repr of elements, comma+space, inside parentheses.
// Doubles as the (name, in) identity key: a collision would need adversarial parameter names.
function pairRepr(a: unknown, b: unknown): string {
  return "(" + pyRepr(a) + ", " + pyRepr(b) + ")";
}

function jsonString(value: string, ensureAscii: boolean): string {
  let out = '"';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i] as string;
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else {
      const code = value.charCodeAt(i);
      if (code < 0x20 || (ensureAscii && code > 0x7e)) {
        out += "\\u" + code.toString(16).padStart(4, "0");
      } else {
        out += ch;
      }
    }
  }
  return out + '"';
}

// Mirrors json.dumps(sort_keys=True); separators/ensure_ascii configurable to match every
// json.dumps call site in the python original.
// ponytail: JS cannot tell int from float (1.0 stringifies as "1", Python as "1.0"). Only sort-key
// ordering could drift for structures carrying float values; revisit if upstream enums ever do.
function jsonDumps(value: unknown, ensureAscii = true, itemSep = ", ", keySep = ": "): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return jsonString(value, ensureAscii);
  if (Array.isArray(value)) {
    return (
      "[" +
      value.map((item) => jsonDumps(item, ensureAscii, itemSep, keySep)).join(itemSep) +
      "]"
    );
  }
  const mapping = value as Rec;
  const parts = Object.keys(mapping)
    .sort()
    .map(
      (key) => jsonString(key, ensureAscii) + keySep + jsonDumps(mapping[key], ensureAscii, itemSep, keySep)
    );
  return "{" + parts.join(itemSep) + "}";
}

// Structural equality over canonical (sorted-key) JSON, mirroring Python != on parsed data.
function jsonEquals(a: unknown, b: unknown): boolean {
  return jsonDumps(a, false) === jsonDumps(b, false);
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function readText(path: string): string {
  // Python read_text applies universal newlines; mimic so generated-text byte compares match.
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function writeText(text: string, output: string | null): void {
  if (output === null) process.stdout.write(text);
  else writeFileSync(output, text, "utf8");
}

// Mirrors str.splitlines() well enough for markdown documents.
function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n|\v|\f|\u00a0|\u2028|\u2029/);
}

// Mirrors " ".join(text.split()).
function collapseWhitespace(text: string): string {
  return text.split(/\s+/).filter(Boolean).join(" ");
}

export function loadOpenapi(path: string): Rec {
  /** Load an OpenAPI JSON or YAML document from a local snapshot. */
  const text = readText(path);
  const extension = extname(path).toLowerCase();
  const document: unknown =
    extension === ".yaml" || extension === ".yml" ? yamlParse(text) : JSON.parse(text);
  const documentMapping = isRec(document) ? document : null;
  if (documentMapping === null || !isRec(get(documentMapping, "paths"))) {
    throw new Error(`${path} is not an OpenAPI document with a paths object`);
  }
  return documentMapping;
}

function _pointer(document: Rec, reference: string): unknown {
  if (!reference.startsWith("#/")) {
    throw new Error(`only local OpenAPI references are supported: ${reference}`);
  }
  let value: unknown = document;
  for (const part of reference.slice(2).split("/")) {
    const key = part.replaceAll("~1", "/").replaceAll("~0", "~");
    const current = isRec(value) ? value : null;
    if (current === null || !Object.hasOwn(current, key)) {
      throw new Error(`unresolved OpenAPI reference: ${reference}`);
    }
    value = current[key];
  }
  return value;
}

function _resolve(value: unknown, document: Rec, stack: readonly string[] = []): unknown {
  if (isRec(value)) {
    const mapping = value;
    const reference = get(mapping, "$ref");
    if (typeof reference === "string") {
      if (!reference.startsWith("#/")) return mapping;
      if (stack.includes(reference)) {
        throw new Error(`cyclic OpenAPI reference: ${reference}`);
      }
      const resolved = _resolve(_pointer(document, reference), document, [...stack, reference]);
      if (Object.keys(mapping).length === 1) return resolved;
      if (isRec(resolved)) {
        const merged: Rec = { ...resolved };
        for (const [key, item] of Object.entries(mapping)) {
          if (key !== "$ref") merged[key] = _resolve(item, document, stack);
        }
        return merged;
      }
      return resolved;
    }
    const result: Rec = {};
    for (const [key, item] of Object.entries(mapping)) {
      result[key] = _resolve(item, document, stack);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((item) => _resolve(item, document, stack));
  }
  return value;
}

function _containsExternalRef(value: unknown): boolean {
  if (isRec(value)) {
    const reference = get(value, "$ref");
    if (typeof reference === "string" && !reference.startsWith("#/")) return true;
    return Object.values(value).some(_containsExternalRef);
  }
  if (Array.isArray(value)) return value.some(_containsExternalRef);
  return false;
}

function _isExternalRef(value: unknown): boolean {
  if (!isRec(value)) return false;
  const reference = get(value, "$ref");
  return typeof reference === "string" && !reference.startsWith("#/");
}

function _securityClassification(
  security: unknown,
  document: Rec
): [Record<string, string[]>[], Classification] {
  if (security === null || security === undefined) return [[], "UNKNOWN"];
  if (_containsExternalRef(security)) return [[], "UNKNOWN"];
  let resolvedSecurity: unknown;
  try {
    resolvedSecurity = _resolve(security, document);
  } catch {
    return [[], "UNKNOWN"];
  }
  if (!Array.isArray(resolvedSecurity)) return [[], "UNKNOWN"];
  const normalized: Record<string, string[]>[] = [];
  const componentsValue = getD(document, "components", {});
  const components = isRec(componentsValue) ? componentsValue : {};
  const schemesValue = getD(components, "securitySchemes", {});
  const knownSchemes = isRec(schemesValue) ? schemesValue : {};
  const resolvedSchemes: Rec = {};
  for (const requirement of resolvedSecurity) {
    if (!isRec(requirement)) return [[], "UNKNOWN"];
    const normalizedRequirement: Record<string, string[]> = {};
    for (const [name, scopes] of Object.entries(requirement)) {
      if (!Array.isArray(scopes)) return [[], "UNKNOWN"];
      if (!scopes.every((scope) => typeof scope === "string")) return [[], "UNKNOWN"];
      const scopeNames = scopes as string[];
      if (Object.hasOwn(knownSchemes, name) && _containsExternalRef(knownSchemes[name])) {
        return [[], "UNKNOWN"];
      }
      let scheme: unknown;
      try {
        scheme = Object.hasOwn(knownSchemes, name) ? _resolve(knownSchemes[name], document) : null;
      } catch {
        return [[], "UNKNOWN"];
      }
      if (!isRec(scheme)) {
        if (!Object.hasOwn(knownSchemes, name) && name.toLowerCase() === "bearerauth") {
          normalizedRequirement[name] = [...scopeNames].sort(compareStrings);
          continue;
        }
        return [[], "UNKNOWN"];
      }
      resolvedSchemes[name] = scheme;
      normalizedRequirement[name] = [...scopeNames].sort(compareStrings);
    }
    normalized.push(
      Object.fromEntries(
        Object.keys(normalizedRequirement)
          .sort(compareStrings)
          .map((name) => [name, normalizedRequirement[name] as string[]])
      )
    );
  }
  normalized.sort((a, b) => compareStrings(jsonDumps(a), jsonDumps(b)));
  if (normalized.length === 0) return [[], "PUBLIC_USEFUL"];
  if (normalized.some((requirement) => Object.keys(requirement).length === 0)) {
    return [normalized, "PUBLIC_USEFUL"];
  }
  for (const requirement of normalized) {
    for (const name of Object.keys(requirement)) {
      const scheme = Object.hasOwn(knownSchemes, name)
        ? resolvedSchemes[name]
        : { type: "http", scheme: "bearer" };
      const schemeMapping = isRec(scheme) ? scheme : {};
      const isBearer =
        isRec(scheme) &&
        pyStr(getD(schemeMapping, "type", "")).toLowerCase() === "http" &&
        pyStr(getD(schemeMapping, "scheme", "")).toLowerCase() === "bearer";
      if (isBearer || name.toLowerCase() === "bearerauth") return [normalized, "AUTHENTICATED"];
      const schemeType = pyStr(getD(schemeMapping, "type", "")).toLowerCase();
      if (["apikey", "oauth2", "openidconnect", "mutualtls"].includes(schemeType)) {
        return [normalized, "AUTHENTICATED"];
      }
      if (schemeType === "http") return [normalized, "AUTHENTICATED"];
    }
  }
  return [normalized, "UNKNOWN"];
}

function _operationParameters(
  pathItem: Rec,
  operation: Rec,
  document: Rec
): Record<string, unknown>[] {
  let parameters: Record<string, unknown>[] = [];
  const pathParametersValue = getD(pathItem, "parameters", []);
  const operationParametersValue = getD(operation, "parameters", []);
  const pathParameters = Array.isArray(pathParametersValue) ? pathParametersValue : [];
  const operationParameters = Array.isArray(operationParametersValue)
    ? operationParametersValue
    : [];
  for (const raw of [...pathParameters, ...operationParameters]) {
    const resolved = _resolve(raw, document);
    if (!isRec(resolved)) {
      throw new Error("OpenAPI parameter must resolve to an object");
    }
    if (Object.hasOwn(resolved, "$ref")) {
      throw new Error("unresolved OpenAPI parameter reference");
    }
    const key = pairRepr(get(resolved, "name"), get(resolved, "in"));
    parameters = parameters.filter(
      (old) => pairRepr(get(old, "name"), get(old, "in")) !== key
    );
    parameters.push(resolved);
  }
  return parameters;
}

interface ParamEntry {
  name: unknown;
  location: unknown;
  param: Rec;
}

export function classifyOperations(spec: Rec, provider: string): Operation[] {
  if (provider !== "compras" && provider !== "pncp") {
    throw new Error(`unsupported provider: ${provider}`);
  }
  const operations: Operation[] = [];
  const pathsValue = getD(spec, "paths", {});
  const paths = isRec(pathsValue) ? pathsValue : {};
  const rootSecurity = getD(spec, "security", []);
  for (const path of Object.keys(paths).sort(compareStrings)) {
    const rawPathValue = paths[path];
    if (_isExternalRef(rawPathValue)) {
      throw new Error(`external OpenAPI path-item reference cannot be resolved: ${path}`);
    }
    const pathItemValue = _resolve(rawPathValue, spec);
    if (!isRec(pathItemValue)) {
      throw new Error(`OpenAPI path item is not an object: ${path}`);
    }
    if (_containsExternalRef(pathItemValue)) {
      throw new Error(`external OpenAPI path-item reference cannot be resolved: ${path}`);
    }
    const pathItem = pathItemValue;
    for (const method of Object.keys(pathItem).sort(compareStrings)) {
      if (method.toLowerCase() !== "get") continue;
      const rawOperationRef = pathItem[method];
      if (_isExternalRef(rawOperationRef)) {
        throw new Error(`external OpenAPI GET reference cannot be resolved: ${path}`);
      }
      const operationValue = _resolve(rawOperationRef, spec);
      if (!isRec(operationValue)) {
        throw new Error(`OpenAPI GET operation is not an object: ${path}`);
      }
      if (_containsExternalRef(operationValue)) {
        throw new Error(`external OpenAPI GET reference cannot be resolved: ${path}`);
      }
      const rawOperation = operationValue;
      const security = Object.hasOwn(rawOperation, "security")
        ? rawOperation["security"]
        : rootSecurity;
      const [normalizedSecurity, classification] = _securityClassification(security, spec);
      const parameters = _operationParameters(pathItem, rawOperation, spec);
      let description: unknown = get(rawOperation, "summary");
      if (!pyBool(description)) description = get(rawOperation, "description");
      if (!pyBool(description)) description = path;
      if (typeof description !== "string") description = path;
      // ponytail: OperationSchema.parse skipped; every field is constructed typed here, pydantic
      // would only re-check our own literals.
      const operation = {
        id: `${provider}.GET.${path}`,
        provider,
        method: "GET",
        path,
        security: normalizedSecurity,
        parameters,
        description,
        classification,
        implemented: false,
        tool: null,
      } as unknown as Operation;
      const extra = operation as unknown as Rec;
      extra["responses"] = _resolve(getD(rawOperation, "responses", {}), spec);
      extra["deprecated"] = pyBool(getD(rawOperation, "deprecated", false));
      const componentsValue = getD(spec, "components", {});
      const components = isRec(componentsValue) ? componentsValue : {};
      const schemesValue = getD(components, "securitySchemes", {});
      const schemes = isRec(schemesValue) ? schemesValue : {};
      let securitySchemes: Rec = {};
      for (const requirement of normalizedSecurity) {
        for (const name of Object.keys(requirement)) {
          if (!Object.hasOwn(schemes, name)) continue;
          try {
            securitySchemes[name] = _resolve(schemes[name], spec);
          } catch {
            securitySchemes = {};
            break;
          }
        }
        if (Object.keys(securitySchemes).length === 0 && Object.keys(requirement).length > 0) {
          break;
        }
      }
      extra["security_schemes"] = securitySchemes;
      const operationMetadata: Rec = {};
      for (const [key, value] of Object.entries(rawOperation)) {
        if (
          !["summary", "description", "parameters", "security", "responses", "deprecated"].includes(
            key
          )
        ) {
          operationMetadata[key] = _resolve(value, spec);
        }
      }
      extra["operation_metadata"] = operationMetadata;
      operations.push(operation);
    }
  }
  return operations;
}

function _canonical(value: unknown, ignoreDescriptions = false, ignoreCuration = false): unknown {
  if (isRec(value)) {
    const normalized: Rec = {};
    for (const key of Object.keys(value).sort(compareStrings)) {
      if (ignoreDescriptions && (key === "description" || key === "summary")) continue;
      if (ignoreCuration && CURATION_FIELDS.has(key)) continue;
      let child = _canonical(value[key], ignoreDescriptions, ignoreCuration);
      if (Array.isArray(child) && UNORDERED_LIST_FIELDS.has(key)) {
        child = [...child].sort((a, b) => compareStrings(jsonDumps(a), jsonDumps(b)));
      }
      normalized[key] = child;
    }
    return normalized;
  }
  if (Array.isArray(value)) {
    return value.map((item) => _canonical(item, ignoreDescriptions, ignoreCuration));
  }
  return value;
}

// Maps (name, in) tuples; key is pairRepr so it doubles as the Python str(tuple) sort key.
function _parametersByKey(value: unknown): Map<string, ParamEntry> {
  const result = new Map<string, ParamEntry>();
  if (!Array.isArray(value)) return result;
  for (const parameter of value) {
    if (isRec(parameter)) {
      const name = get(parameter, "name");
      const location = get(parameter, "in");
      result.set(pairRepr(name, location), { name, location, param: parameter });
    }
  }
  return result;
}

function _canonicalParameters(value: unknown): Rec {
  const parameters = _parametersByKey(value);
  const result: Rec = {};
  for (const key of [...parameters.keys()].sort(compareStrings)) {
    const entry = parameters.get(key) as ParamEntry;
    result[`${pyStr(entry.name)}:${pyStr(entry.location)}`] = _canonical(entry.param, true, true);
  }
  return result;
}

function _canonicalSecurity(value: unknown): unknown {
  if (!Array.isArray(value)) return _canonical(value);
  const normalized: unknown[] = [];
  for (const requirement of value) {
    if (isRec(requirement)) {
      const normalizedRequirement: Rec = {};
      for (const [name, scopes] of [...Object.entries(requirement)].sort((a, b) =>
        compareStrings(pyStr(a[0]), pyStr(b[0]))
      )) {
        normalizedRequirement[pyStr(name)] = Array.isArray(scopes)
          ? [...scopes].sort((a, b) => compareStrings(pyStr(a), pyStr(b)))
          : scopes;
      }
      normalized.push(_canonical(normalizedRequirement, false, true));
    } else {
      normalized.push(_canonical(requirement));
    }
  }
  if (
    normalized.some((requirement) => isRec(requirement) && Object.keys(requirement).length === 0)
  ) {
    return [];
  }
  return [...normalized].sort((a, b) => compareStrings(jsonDumps(a), jsonDumps(b)));
}

function _upstreamContract(value: Rec): Rec {
  const contract: Rec = {};
  for (const [key, item] of Object.entries(value)) {
    if (!CURATION_FIELDS.has(key) && key !== "description" && key !== "summary") {
      contract[key] = item;
    }
  }
  contract["parameters"] = _canonicalParameters(getD(value, "parameters", []));
  contract["security"] = _canonicalSecurity(getD(value, "security", []));
  contract["responses"] = _canonical(getD(value, "responses", {}), true, false);
  contract["deprecated"] = pyBool(getD(value, "deprecated", false));
  return _canonical(contract, true, true) as Rec;
}

function _changeImpact(changeType: ChangeType, before: unknown, after: unknown): ChangeImpact {
  if (changeType === "deprecated_changed") return "documentation_only";
  if (changeType === "description_changed") return "documentation_only";
  if (changeType === "parameter_added") {
    const parameter = isRec(after) ? after : {};
    return pyBool(get(parameter, "required")) ? "breaking" : "non_breaking";
  }
  if (
    changeType === "parameter_removed" ||
    changeType === "parameter_type_changed" ||
    changeType === "parameter_required_changed"
  ) {
    return "breaking";
  }
  if (changeType === "security_changed") {
    const beforeSecurity = _canonicalSecurity(before);
    const afterSecurity = _canonicalSecurity(after);
    return pyBool(beforeSecurity) && !pyBool(afterSecurity) ? "non_breaking" : "breaking";
  }
  if (changeType === "response_changed") {
    if (!isRec(before) || !isRec(after)) return "breaking";
    const oldResponses = before;
    const newResponses = after;
    if (Object.keys(oldResponses).some((status) => !Object.hasOwn(newResponses, status))) {
      return "breaking";
    }
    for (const status of Object.keys(oldResponses).filter((status) =>
      Object.hasOwn(newResponses, status)
    )) {
      if (
        !jsonEquals(
          _canonical(oldResponses[status], true, false),
          _canonical(newResponses[status], true, false)
        )
      ) {
        return "breaking";
      }
    }
    return "non_breaking";
  }
  return "documentation_only";
}

function _parameterTypeSignature(schema: unknown): unknown {
  if (!isRec(schema)) return schema;
  const result: Rec = {};
  for (const key of ["$ref", "type", "format"]) {
    if (Object.hasOwn(schema, key)) result[key] = schema[key];
  }
  return result;
}

function _descriptionProjection(value: unknown): unknown {
  if (isRec(value)) {
    const projection: Rec = {};
    for (const [key, item] of Object.entries(value)) {
      const child = _descriptionProjection(item);
      if (key === "description" || key === "summary" || child !== null) {
        projection[key] = child !== null ? child : item;
      }
    }
    return Object.keys(projection).length > 0 ? projection : null;
  }
  if (Array.isArray(value)) {
    const items = value.map(_descriptionProjection);
    return items.some((item) => item !== null) ? items : null;
  }
  return null;
}

function _catalogChange(
  operationId: string,
  changeType: ChangeType,
  impact: ChangeImpact,
  options: { before?: unknown; after?: unknown } = {}
): CatalogChange {
  const before = Object.hasOwn(options, "before") ? options["before"] : null;
  const after = Object.hasOwn(options, "after") ? options["after"] : null;
  return {
    operation_id: operationId,
    change_type: changeType,
    impact,
    before,
    after,
    get kind() {
      return this.change_type;
    },
    get classification() {
      return this.impact;
    },
    get type() {
      return this.change_type;
    },
    get severity() {
      return this.impact;
    },
    get id() {
      return this.operation_id;
    },
  };
}

function _semanticChanges(old: Rec, next: Rec): CatalogChange[] {
  const operationId = pyStr(getD(next, "id", getD(old, "id", "")));
  const changes: CatalogChange[] = [];
  const oldDescriptions = _descriptionProjection(old);
  const newDescriptions = _descriptionProjection(next);
  if (!jsonEquals(oldDescriptions, newDescriptions)) {
    changes.push(
      _catalogChange(operationId, "description_changed", "documentation_only", {
        before: oldDescriptions,
        after: newDescriptions,
      })
    );
  }
  const oldParameters = _parametersByKey(get(old, "parameters"));
  const newParameters = _parametersByKey(get(next, "parameters"));
  for (const key of [...newParameters.keys()]
    .filter((key) => !oldParameters.has(key))
    .sort(compareStrings)) {
    const parameter = (newParameters.get(key) as ParamEntry).param;
    changes.push(
      _catalogChange(
        operationId,
        "parameter_added",
        _changeImpact("parameter_added", null, parameter),
        { after: parameter }
      )
    );
  }
  for (const key of [...oldParameters.keys()]
    .filter((key) => !newParameters.has(key))
    .sort(compareStrings)) {
    const parameter = (oldParameters.get(key) as ParamEntry).param;
    changes.push(
      _catalogChange(operationId, "parameter_removed", "breaking", { before: parameter })
    );
  }
  for (const key of [...oldParameters.keys()]
    .filter((key) => newParameters.has(key))
    .sort(compareStrings)) {
    const oldParameter = (oldParameters.get(key) as ParamEntry).param;
    const newParameter = (newParameters.get(key) as ParamEntry).param;
    const oldRequired = pyBool(getD(oldParameter, "required", false));
    const newRequired = pyBool(getD(newParameter, "required", false));
    if (oldRequired !== newRequired) {
      changes.push(
        _catalogChange(
          operationId,
          "parameter_required_changed",
          newRequired ? "breaking" : "non_breaking",
          { before: oldRequired, after: newRequired }
        )
      );
    }
    const oldType = _parameterTypeSignature(getD(oldParameter, "schema", {}));
    const newType = _parameterTypeSignature(getD(newParameter, "schema", {}));
    if (!jsonEquals(oldType, newType)) {
      changes.push(
        _catalogChange(operationId, "parameter_type_changed", "breaking", {
          before: oldType,
          after: newType,
        })
      );
    }
  }

  const oldSecurity = getD(old, "security", []);
  const newSecurity = getD(next, "security", []);
  if (!jsonEquals(_canonicalSecurity(oldSecurity), _canonicalSecurity(newSecurity))) {
    changes.push(
      _catalogChange(
        operationId,
        "security_changed",
        _changeImpact("security_changed", oldSecurity, newSecurity),
        { before: oldSecurity, after: newSecurity }
      )
    );
  }

  const oldDeprecated = pyBool(getD(old, "deprecated", false));
  const newDeprecated = pyBool(getD(next, "deprecated", false));
  if (oldDeprecated !== newDeprecated) {
    changes.push(
      _catalogChange(operationId, "deprecated_changed", "documentation_only", {
        before: oldDeprecated,
        after: newDeprecated,
      })
    );
  }

  const oldResponses = getD(old, "responses", {});
  const newResponses = getD(next, "responses", {});
  if (
    !jsonEquals(
      _canonical(oldResponses, true, false),
      _canonical(newResponses, true, false)
    )
  ) {
    changes.push(
      _catalogChange(
        operationId,
        "response_changed",
        _changeImpact("response_changed", oldResponses, newResponses),
        { before: oldResponses, after: newResponses }
      )
    );
  }
  return changes;
}

function _sourceVersionChanges(previous: unknown, current: unknown): CatalogChange[] {
  const oldSources = isRec(previous) ? previous : {};
  const newSources = isRec(current) ? current : {};
  const changes: CatalogChange[] = [];
  const providers = [...new Set([...Object.keys(oldSources), ...Object.keys(newSources)])].sort(
    compareStrings
  );
  for (const provider of providers) {
    const oldValue = get(oldSources, provider);
    const newValue = get(newSources, provider);
    const oldMapping = isRec(oldValue) ? oldValue : {};
    const newMapping = isRec(newValue) ? newValue : {};
    const before: Rec = { openapi: get(oldMapping, "openapi") };
    const after: Rec = { openapi: get(newMapping, "openapi") };
    if (!jsonEquals(before, after)) {
      changes.push(
        _catalogChange(
          `source_version.${provider}`,
          "source_version_changed",
          "documentation_only",
          { before, after }
        )
      );
    }
  }
  return changes;
}

export function compareCatalogs(
  previous: Rec[],
  current: Rec[],
  options: {
    previous_source_version?: unknown;
    current_source_version?: unknown;
  } = {}
): CatalogDiff {
  const old = new Map<string, Rec>();
  for (const item of previous) old.set(item["id"] as string, item);
  const newIds = new Set(current.map((item) => item["id"] as string));
  const changes = _sourceVersionChanges(
    options["previous_source_version"],
    options["current_source_version"]
  );
  for (const item of current) {
    const id = item["id"] as string;
    if (old.has(id)) changes.push(..._semanticChanges(old.get(id) as Rec, item));
  }
  return {
    added: current.filter((item) => !old.has(item["id"] as string)),
    removed: previous.filter((item) => !newIds.has(item["id"] as string)),
    changed: current.filter((item) => {
      const id = item["id"] as string;
      return old.has(id) && !jsonEquals(_upstreamContract(item), _upstreamContract(old.get(id) as Rec));
    }),
    changes,
    get typed_changes() {
      return this.changes;
    },
    get semantic_changes() {
      return this.changes;
    },
    get semantic() {
      return this.changes;
    },
  };
}

export function renderCoverage(endpoints: Rec[]): CoverageReport {
  const publicUseful = endpoints.filter((item) => get(item, "classification") === "PUBLIC_USEFUL");
  const implemented = publicUseful.filter(
    (item) => pyBool(get(item, "implemented")) && pyBool(get(item, "tool"))
  );
  return {
    public_useful: publicUseful.length,
    implemented: implemented.length,
    ratio: publicUseful.length > 0 ? implemented.length / publicUseful.length : 1.0,
  };
}

function _words(path: string): string[] {
  const replacements = new Map<string, string>([
    ["órgãos", "orgaos"],
    ["órgão", "orgao"],
    ["unidades", "unidades"],
    ["contratações", "contratacoes"],
    ["contratação", "contratacao"],
    ["compras", "compras"],
    ["ata", "ata"],
    ["atas", "atas"],
    ["contratos", "contratos"],
    ["contrato", "contrato"],
    ["itens", "itens"],
    ["item", "item"],
  ]);
  const result: string[] = [];
  for (let segment of path.split("/")) {
    if (!segment || segment.startsWith("{")) continue;
    segment = segment.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
    for (const rawWord of segment.split(/[^A-Za-z0-9]+/)) {
      const lower = rawWord.toLowerCase();
      const word = replacements.has(lower) ? (replacements.get(lower) as string) : lower;
      if (word && word !== "v1" && word !== "v2" && word !== "api") result.push(word);
    }
  }
  return result.length > 0 ? result : ["consulta"];
}

function _suggestedToolName(operation: Rec): string {
  const provider = pyStr(operation["provider"]);
  const path = pyStr(operation["path"]);
  const words = _words(path);
  const action = /\{[^}]+\}/.test(path) ? "obter" : "listar";
  return `${provider}_${action}_${words.join("_")}`;
}

function _manifestEntry(operation: Operation, tool: string | null): Rec {
  const entry: Rec = {
    id: operation.id,
    provider: operation.provider,
    method: operation.method,
    path: operation.path,
    classification: operation.classification,
    implemented: tool !== null,
    tool,
    description: operation.description,
    security: operation.security,
    parameters: operation.parameters,
  };
  if (operation.classification === "AUTHENTICATED") {
    entry["implemented"] = false;
    entry["tool"] = null;
    entry["exclusion"] = { reason: "authentication_required" };
  } else if (operation.classification === "UNKNOWN") {
    entry["implemented"] = false;
    entry["tool"] = null;
    entry["exclusion"] = { reason: "security_metadata_unresolved" };
  } else if (operation.classification === "PUBLIC_USEFUL" && tool === null) {
    entry["exclusion"] = {
      reason: "tool_mapping_review_required",
      suggested_tool: _suggestedToolName(operation as unknown as Rec),
    };
  }
  const extra = operation as unknown as Rec;
  for (const key of ["responses", "deprecated", "security_schemes", "operation_metadata"]) {
    if (Object.hasOwn(extra, key)) entry[key] = extra[key];
  }
  return entry;
}

function _manifestFromSpecs(specs: Record<string, Rec>, sources: Record<string, string>): Rec {
  const allOperations: Operation[] = [];
  const sourceVersion: Rec = {};
  for (const provider of ["compras", "pncp"]) {
    const spec = specs[provider] as Rec;
    allOperations.push(...classifyOperations(spec, provider));
    sourceVersion[provider] = {
      snapshot: sources[provider],
      openapi: getD(spec, "openapi", "unknown"),
    };
  }
  const endpoints: Rec[] = [];
  for (const operation of allOperations) {
    const tool = Object.hasOwn(TOOL_NAME_OVERRIDES, operation.id)
      ? (TOOL_NAME_OVERRIDES[operation.id] as string)
      : null;
    endpoints.push(_manifestEntry(operation, tool));
  }
  return {
    catalog_version: 1,
    tool_name_overrides_version: TOOL_NAME_OVERRIDES_VERSION,
    source_version: sourceVersion,
    endpoints,
  };
}

function _readManifest(path: string): Rec {
  const value = yamlParse(readText(path));
  const valueMapping = isRec(value) ? value : null;
  if (valueMapping === null || !Array.isArray(get(valueMapping, "endpoints"))) {
    throw new Error(`${path} must contain an endpoints list`);
  }
  return valueMapping;
}

function _validateManifest(manifest: Rec): string[] {
  const errors: string[] = [];
  const endpointsValue = get(manifest, "endpoints");
  if (!Array.isArray(endpointsValue)) return ["manifest.endpoints must be a list"];
  const endpoints = endpointsValue as unknown[];
  const ids = new Set<string>();
  const tools = new Set<string>();
  const required = ["id", "provider", "method", "path", "classification", "implemented"];
  endpoints.forEach((rawEndpoint, index) => {
    if (!isRec(rawEndpoint)) {
      errors.push(`endpoints[${index}] must be an object`);
      return;
    }
    const endpoint = rawEndpoint;
    const missing = required.filter((key) => !Object.hasOwn(endpoint, key)).sort(compareStrings);
    if (missing.length > 0) {
      errors.push(`endpoints[${index}] missing explicit fields: ${missing.join(", ")}`);
    }
    const endpointId = get(endpoint, "id");
    if (typeof endpointId !== "string" || endpointId.trim() === "") {
      errors.push(`endpoints[${index}] id must be a non-empty string`);
    }
    if (typeof endpointId === "string" && ids.has(endpointId)) {
      errors.push(`duplicate endpoint id: ${endpointId}`);
    }
    if (typeof endpointId === "string") ids.add(endpointId);
    const provider = get(endpoint, "provider");
    if (typeof provider !== "string" || (provider !== "compras" && provider !== "pncp")) {
      errors.push(`invalid provider: ${pyStr(endpointId)}`);
    }
    if (get(endpoint, "method") !== "GET") {
      errors.push(`manifest only supports GET operations: ${pyStr(endpointId)}`);
    }
    const endpointPath = get(endpoint, "path");
    if (typeof endpointPath !== "string" || endpointPath.trim() === "") {
      errors.push(`endpoint path must be a non-empty string: ${pyStr(endpointId)}`);
    }
    if (
      typeof provider === "string" &&
      (provider === "compras" || provider === "pncp") &&
      typeof endpointPath === "string"
    ) {
      const expectedId = `${provider}.GET.${endpointPath}`;
      if (endpointId !== expectedId) {
        errors.push(`id must be ${expectedId}: ${pyStr(endpointId)}`);
      }
    }
    const description = get(endpoint, "description");
    if (typeof description !== "string" || description.trim() === "") {
      errors.push(`endpoint description must be non-empty: ${pyStr(endpointId)}`);
    }
    const parameters = get(endpoint, "parameters");
    if (!Array.isArray(parameters)) {
      errors.push(`endpoint parameters must be a list: ${pyStr(endpointId)}`);
    } else {
      if (!parameters.every((parameter) => isRec(parameter))) {
        errors.push(`endpoint parameters must contain objects: ${pyStr(endpointId)}`);
      }
      const parameterKeys = new Set<string>();
      for (const rawParameter of parameters) {
        if (!isRec(rawParameter)) continue;
        const parameter = rawParameter;
        const parameterName = get(parameter, "name");
        if (typeof parameterName !== "string" || parameterName.trim() === "") {
          errors.push(`parameter name must be non-empty: ${pyStr(endpointId)}`);
        }
        const location = get(parameter, "in");
        if (
          typeof location !== "string" ||
          !["path", "query", "header", "cookie"].includes(location)
        ) {
          errors.push(`parameter location is invalid: ${pyStr(endpointId)}`);
        }
        if (Object.hasOwn(parameter, "schema") && !isRec(parameter["schema"])) {
          errors.push(`parameter schema must be an object: ${pyStr(endpointId)}`);
        }
        if (Object.hasOwn(parameter, "required") && typeof parameter["required"] !== "boolean") {
          errors.push(`parameter required must be boolean: ${pyStr(endpointId)}`);
        }
        if (typeof parameterName === "string" && typeof location === "string") {
          const key = pairRepr(parameterName, location);
          if (parameterKeys.has(key)) {
            errors.push(`duplicate parameter: ${pyStr(endpointId)}: ${key}`);
          }
          parameterKeys.add(key);
        }
        if (
          Object.hasOwn(parameter, "description") &&
          typeof parameter["description"] !== "string"
        ) {
          errors.push(`parameter description must be a string: ${pyStr(endpointId)}`);
        }
      }
    }
    const security = get(endpoint, "security");
    if (!Array.isArray(security)) {
      errors.push(`endpoint security must be a list: ${pyStr(endpointId)}`);
    } else {
      for (const requirement of security) {
        if (!isRec(requirement)) {
          errors.push(`security requirements must be objects: ${pyStr(endpointId)}`);
          continue;
        }
        for (const [schemeName, scopes] of Object.entries(requirement)) {
          if (schemeName.trim() === "" || !Array.isArray(scopes)) {
            errors.push(`security requirement shape is invalid: ${pyStr(endpointId)}`);
          } else if (!scopes.every((scope) => typeof scope === "string")) {
            errors.push(`security scopes must be strings: ${pyStr(endpointId)}`);
          }
        }
      }
    }
    if (typeof get(endpoint, "implemented") !== "boolean") {
      errors.push(`endpoint implemented must be boolean: ${pyStr(endpointId)}`);
    }
    const classification = get(endpoint, "classification");
    if (typeof classification !== "string" || !CLASSIFICATIONS.has(classification)) {
      errors.push(`invalid classification: ${pyStr(endpointId)}`);
    }
    if (classification === "PUBLIC_USEFUL") {
      const tool = get(endpoint, "tool");
      if (get(endpoint, "implemented") === true) {
        if (typeof tool !== "string" || !TOOL_NAME_RE.test(tool)) {
          errors.push(`public endpoint lacks a valid implemented tool: ${pyStr(endpointId)}`);
        } else if (!tool.startsWith(`${provider}_`)) {
          errors.push(`tool prefix does not match provider: ${pyStr(endpointId)}`);
        } else if (tools.has(tool)) {
          errors.push(`duplicate tool: ${tool}`);
        } else {
          tools.add(tool);
        }
      } else if (get(endpoint, "implemented") === false) {
        if (tool !== null) {
          errors.push(
            `endpoint with implemented=false must not have a tool: ${pyStr(endpointId)}`
          );
        }
        const exclusion = get(endpoint, "exclusion");
        const exclusionMapping = isRec(exclusion) ? exclusion : null;
        if (
          exclusionMapping === null ||
          pyStr(getD(exclusionMapping, "reason", "")).trim() === ""
        ) {
          errors.push(`public review exclusion is required: ${pyStr(endpointId)}`);
        }
      } else {
        errors.push(`public endpoint lacks a valid implemented tool: ${pyStr(endpointId)}`);
      }
    } else {
      if (get(endpoint, "implemented") !== false) {
        errors.push(`non-public endpoint must not be implemented: ${pyStr(endpointId)}`);
      }
      if (get(endpoint, "tool") !== null) {
        errors.push(`non-public endpoint must not have a tool: ${pyStr(endpointId)}`);
      }
    }
    if (classification === "AUTHENTICATED") {
      const exclusion = get(endpoint, "exclusion");
      const exclusionMapping = isRec(exclusion) ? exclusion : null;
      if (
        exclusionMapping === null ||
        get(exclusionMapping, "reason") !== "authentication_required"
      ) {
        errors.push(
          `authenticated endpoint needs authentication exclusion: ${pyStr(endpointId)}`
        );
      }
    } else if (classification === "UNKNOWN") {
      errors.push(`unknown classification: ${pyStr(endpointId)}`);
    } else if (
      typeof classification === "string" &&
      CLASSIFICATIONS.has(classification) &&
      classification !== "PUBLIC_USEFUL"
    ) {
      const exclusion = get(endpoint, "exclusion");
      const exclusionMapping = isRec(exclusion) ? exclusion : null;
      if (
        exclusionMapping === null ||
        pyStr(getD(exclusionMapping, "reason", "")).trim() === ""
      ) {
        errors.push(`excluded endpoint needs a reason: ${pyStr(endpointId)}`);
      }
    }
  });
  return errors;
}

function _manifestEndpoints(manifest: Rec): Rec[] {
  const value = get(manifest, "endpoints");
  if (!Array.isArray(value)) throw new Error("manifest endpoints must contain only objects");
  if (!value.every((item) => isRec(item))) {
    throw new Error("manifest endpoints must contain only objects");
  }
  return value as Rec[];
}

type SnapshotSource = { url: string } | { file: string } | null;

function _snapshotForProvider(
  manifest: Rec,
  manifestPath: string,
  provider: string,
  explicit: string | undefined
): [SnapshotSource, string | null] {
  const sourceVersion = get(manifest, "source_version");
  if (!isRec(sourceVersion)) {
    return [null, "manifest requires source_version for compras and pncp"];
  }
  const providerSource = get(sourceVersion, provider);
  if (!isRec(providerSource)) return [null, `source_version missing provider: ${provider}`];
  const openapi = get(providerSource, "openapi");
  if (typeof openapi !== "string" || !/^3\.(?:0|1)(?:\.\d+)?$/.test(openapi)) {
    return [null, `source_version.${provider}.openapi must be a non-empty 3.x version`];
  }
  const snapshot = get(providerSource, "snapshot");
  if (typeof snapshot !== "string" || snapshot.trim() === "") {
    return [
      null,
      `source_version.${provider}.snapshot must be a local path or fixed official URL`,
    ];
  }
  if (snapshot.startsWith("http://") || snapshot.startsWith("https://")) {
    if (snapshot !== DEFAULT_OFFICIAL_URLS[provider]) {
      return [null, `source_version.${provider}.snapshot must use its fixed official URL`];
    }
    return [{ url: snapshot }, null];
  }
  let candidate = explicit ?? snapshot;
  if (!existsSync(candidate)) {
    candidate = isAbsolute(candidate) ? candidate : join(dirname(manifestPath), candidate);
  }
  return [{ file: candidate }, null];
}

async function _checkSourceCompleteness(
  manifest: Rec,
  manifestPath: string,
  compras: string | undefined,
  pncp: string | undefined
): Promise<string[]> {
  const errors: string[] = [];
  const endpoints = _manifestEndpoints(manifest);
  const sourceVersionValue = get(manifest, "source_version");
  const sourceVersion = isRec(sourceVersionValue) ? sourceVersionValue : {};
  const sources: [string, string | undefined][] = [
    ["compras", compras],
    ["pncp", pncp],
  ];
  for (const [provider, explicit] of sources) {
    const [snapshot, sourceError] = _snapshotForProvider(
      manifest,
      manifestPath,
      provider,
      explicit
    );
    if (sourceError !== null) {
      errors.push(sourceError);
      continue;
    }
    if (snapshot === null) continue;
    let sourceDocument: Rec;
    if ("url" in snapshot) {
      sourceDocument = await _officialSpec(snapshot.url);
    } else {
      if (!existsSync(snapshot.file)) {
        errors.push(`snapshot not found for ${provider}: ${snapshot.file}`);
        continue;
      }
      sourceDocument = loadOpenapi(snapshot.file);
    }
    const providerMapping = get(sourceVersion, provider) as Rec;
    const expectedOpenapi = get(providerMapping, "openapi");
    const loadedOpenapi = get(sourceDocument, "openapi");
    if (loadedOpenapi !== expectedOpenapi) {
      errors.push(
        `source_version.${provider}.openapi does not match snapshot: ` +
          `${pyRepr(expectedOpenapi)} != ${pyRepr(loadedOpenapi)}`
      );
    }
    if (typeof loadedOpenapi !== "string" || !/^3\.(?:0|1)(?:\.\d+)?$/.test(loadedOpenapi)) {
      errors.push(`snapshot openapi is not supported for ${provider}: ${pyRepr(loadedOpenapi)}`);
    }
    if (loadedOpenapi !== expectedOpenapi || typeof loadedOpenapi !== "string") continue;
    const discovered = classifyOperations(sourceDocument, provider);
    for (const operation of discovered) {
      if (operation.classification === "UNKNOWN") {
        errors.push(`unknown security classification: ${operation.id}`);
      }
    }
    const discoveredById = new Map<string, Rec>();
    const discoveredClassifications = new Map<string, string>();
    for (const operation of discovered) {
      discoveredById.set(operation.id, _upstreamContract(operation as unknown as Rec));
      discoveredClassifications.set(operation.id, operation.classification);
    }
    const manifestById = new Map<string, Rec>();
    const manifestEndpointsById = new Map<string, Rec>();
    for (const endpoint of endpoints) {
      if (get(endpoint, "provider") === provider) {
        const id = pyStr(get(endpoint, "id"));
        manifestById.set(id, _upstreamContract(endpoint));
        manifestEndpointsById.set(id, endpoint);
      }
    }
    const discoveredIds = [...discoveredById.keys()];
    const manifestIds = [...manifestById.keys()];
    for (const endpointId of discoveredIds
      .filter((id) => !manifestById.has(id))
      .sort(compareStrings)) {
      errors.push(`missing manifest endpoint: ${endpointId}`);
    }
    for (const endpointId of manifestIds
      .filter((id) => !discoveredById.has(id))
      .sort(compareStrings)) {
      errors.push(`extra manifest endpoint: ${endpointId}`);
    }
    for (const endpointId of discoveredIds
      .filter((id) => manifestById.has(id))
      .sort(compareStrings)) {
      const discoveredContract = discoveredById.get(endpointId) as Rec;
      const manifestContract = manifestById.get(endpointId) as Rec;
      const manifestEndpoint = manifestEndpointsById.get(endpointId) as Rec;
      const discoveredClassification = discoveredClassifications.get(endpointId) as string;
      const manifestClassification = get(manifestEndpoint, "classification");
      if (discoveredClassification !== manifestClassification) {
        errors.push(
          `classification mismatch: ${endpointId}: ` +
            `${pyRepr(manifestClassification)} -> ${pyRepr(discoveredClassification)}`
        );
      }
      if (discoveredClassification === "AUTHENTICATED") {
        if (manifestClassification !== "AUTHENTICATED") {
          errors.push(`authenticated endpoint must remain AUTHENTICATED: ${endpointId}`);
        }
        if (get(manifestEndpoint, "implemented") !== false) {
          errors.push(`authenticated endpoint must remain unimplemented: ${endpointId}`);
        }
        const exclusion = get(manifestEndpoint, "exclusion");
        const exclusionMapping = isRec(exclusion) ? exclusion : null;
        if (
          exclusionMapping === null ||
          get(exclusionMapping, "reason") !== "authentication_required"
        ) {
          errors.push(`authenticated endpoint needs authentication exclusion: ${endpointId}`);
        }
      }
      const discoveredPath = get(discoveredContract, "path");
      const manifestContractPath = get(manifestContract, "path");
      if (discoveredPath !== manifestContractPath) {
        errors.push(
          `changed operation path: ${endpointId}: ` +
            `${pyStr(manifestContractPath)} -> ${pyStr(discoveredPath)}`
        );
      } else if (!jsonEquals(discoveredContract, manifestContract)) {
        errors.push(`changed upstream contract: ${endpointId}`);
      }
    }
  }
  return errors;
}

function _writeYaml(value: unknown, output: string | null): void {
  // ponytail: lineWidth 0 skips Python safe_dump's wrapping heuristics; QUOTE_SINGLE keeps
  // PyYAML (YAML 1.1) from re-reading date/bool-lookalike strings as date/bool objects.
  const text = yamlStringify(value, { lineWidth: 0, defaultStringType: "QUOTE_SINGLE" });
  if (output === null) process.stdout.write(text);
  else writeFileSync(output, text, "utf8");
}

// ponytail: discovery CLI uses raw fetch on fixed official URLs, mirrors _official_spec.
async function _officialSpec(url: string): Promise<Rec> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }
  const value: unknown = await response.json();
  const valueMapping = isRec(value) ? value : null;
  if (valueMapping === null || !isRec(get(valueMapping, "paths"))) {
    throw new Error(`official URL did not return an OpenAPI paths object: ${url}`);
  }
  return valueMapping;
}

async function _loadSource(
  path: string | undefined | null,
  provider: string,
  official: boolean
): Promise<[Rec, string]> {
  if (official) {
    const sourceUrl = DEFAULT_OFFICIAL_URLS[provider] as string;
    return [await _officialSpec(sourceUrl), sourceUrl];
  }
  if (path === null || path === undefined) {
    throw new Error(`--${provider} is required unless --official is used`);
  }
  return [loadOpenapi(path), path];
}

function _formatDiff(diff: CatalogDiff): string {
  const lines = [
    `added=${diff.added.length} removed=${diff.removed.length} changed=${diff.changed.length}`,
  ];
  const groups: [string, Rec[]][] = [
    ["ADDED", diff.added],
    ["REMOVED", diff.removed],
    ["CHANGED", diff.changed],
  ];
  for (const [label, items] of groups) {
    for (const item of items) {
      lines.push(
        `${label}: ${pyStr(getD(item, "method", "GET"))} ${pyStr(
          getD(item, "path", getD(item, "id", ""))
        )}`
      );
    }
  }
  for (const change of diff.typed_changes) {
    lines.push(`SEMANTIC: ${change.change_type} ${change.impact} ${change.operation_id}`);
  }
  return lines.join("\n");
}

// Mirrors f"{ratio:.1%}".
function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

async function _checkManifest(
  path: string,
  compras: string | undefined = undefined,
  pncp: string | undefined = undefined
): Promise<number> {
  const manifest = _readManifest(path);
  let errors = _validateManifest(manifest);
  if (errors.length === 0) {
    errors = errors.concat(await _checkSourceCompleteness(manifest, path, compras, pncp));
  }
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
    return 1;
  }
  const endpoints = _manifestEndpoints(manifest);
  const report = renderCoverage(endpoints);
  const byProvider = new Map<string, Rec[]>();
  for (const endpoint of endpoints) {
    const provider = pyStr(get(endpoint, "provider"));
    if (!byProvider.has(provider)) byProvider.set(provider, []);
    (byProvider.get(provider) as Rec[]).push(endpoint);
  }
  for (const provider of ["compras", "pncp"]) {
    const providerReport = renderCoverage(byProvider.get(provider) ?? []);
    const label = provider === "compras" ? "Compras.gov.br" : "PNCP";
    process.stdout.write(`${label}: ${formatPercent(providerReport.ratio)}\n`);
  }
  process.stdout.write(`overall=${pyFloat(report.ratio)}\n`);
  process.stdout.write(
    `Unmapped public useful GET endpoints: ${report.public_useful - report.implemented}\n`
  );
  return report.ratio === 1.0 ? 0 : 1;
}

function _renderTools(path: string, output: string | null): number {
  const manifest = _readManifest(path);
  const errors = _validateManifest(manifest);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
    return 1;
  }
  writeText(_toolsMarkdown(manifest), output);
  return 0;
}

function _toolsMarkdown(manifest: Rec): string {
  const endpoints = _manifestEndpoints(manifest);
  const lines: string[] = [
    "# Ferramentas",
    "",
    "Ferramentas atômicas geradas a partir do manifesto.",
    "",
  ];
  for (const endpoint of endpoints) {
    if (
      get(endpoint, "classification") !== "PUBLIC_USEFUL" ||
      get(endpoint, "implemented") !== true
    ) {
      continue;
    }
    const description = collapseWhitespace(pyStr(endpoint["description"]));
    lines.push(
      `## \`${endpoint["tool"]}\``,
      "",
      `- Provedor: \`${endpoint["provider"]}\``,
      `- Endpoint: \`${endpoint["method"]} ${endpoint["path"]}\``,
      `- Descrição: ${description}`,
      "",
      "### Parâmetros"
    );
    const parametersValue = getD(endpoint, "parameters", []);
    for (const rawParameter of Array.isArray(parametersValue) ? parametersValue : []) {
      const parameter = rawParameter as Rec;
      const name = getD(parameter, "name", "");
      const location = getD(parameter, "in", "");
      const required = pyBool(getD(parameter, "required", false)) ? "obrigatório" : "opcional";
      const schema = jsonDumps(getD(parameter, "schema", {}), false, ",", ":");
      const parameterDescription = collapseWhitespace(pyStr(getD(parameter, "description", "")));
      lines.push(
        `- \`${name}\` (\`${location}\`, ${required}): schema: ${schema}; ` +
          `descrição: ${parameterDescription}`
      );
    }
    lines.push("");
  }
  lines.push(
    "## Ferramentas semânticas e diagnóstico",
    "",
    "Ferramentas compostas e de diagnóstico que realizam somente consultas de leitura " +
      "nas fontes oficiais.",
    ""
  );
  for (const [name, description, parameters, behavior] of _NON_ATOMIC_TOOLS) {
    lines.push(
      `### \`${name}\``,
      "",
      `- Descrição: ${description}`,
      `- Argumentos principais: ${parameters}`,
      `- Comportamento somente leitura: ${behavior}`,
      ""
    );
  }
  return lines.join("\n");
}

function _coverageMarkdown(manifest: Rec): string {
  const endpoints = _manifestEndpoints(manifest);
  const lines: string[] = [
    "# Cobertura de endpoints",
    "",
    "| API | GET oficiais | Públicos úteis | Implementados | Cobertura |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];
  const providers: [string, string][] = [
    ["compras", "Compras.gov.br"],
    ["pncp", "PNCP"],
  ];
  for (const [provider, label] of providers) {
    const providerEndpoints = endpoints.filter(
      (endpoint) => get(endpoint, "provider") === provider
    );
    const report = renderCoverage(providerEndpoints);
    lines.push(
      `| ${label} | ${providerEndpoints.length} | ${report.public_useful} | ` +
        `${report.implemented} | ${formatPercent(report.ratio)} |`
    );
  }
  const report = renderCoverage(endpoints);
  lines.push(
    `| **Total** | **${endpoints.length}** | **${report.public_useful}** | ` +
      `**${report.implemented}** | **${formatPercent(report.ratio)}** |`,
    "",
    "## Endpoints",
    ""
  );
  for (const endpoint of endpoints) {
    if (get(endpoint, "classification") === "AUTHENTICATED") {
      lines.push(
        `- \`AUTH\` ${get(endpoint, "method")} ${get(endpoint, "path")}` +
          " | Excluído: authentication_required"
      );
      continue;
    }
    const marker = pyBool(get(endpoint, "implemented")) ? "OK" : "PENDING";
    lines.push(`- \`${marker}\` ${get(endpoint, "method")} ${get(endpoint, "path")}`);
  }
  return lines.join("\n") + "\n";
}

function _renderCoverage(path: string, output: string | null): number {
  const manifest = _readManifest(path);
  const errors = _validateManifest(manifest);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
    return 1;
  }
  writeText(_coverageMarkdown(manifest), output);
  return 0;
}

function _fullmatch(pattern: RegExp, line: string | undefined): RegExpMatchArray | null {
  if (line === undefined) return null;
  return line.match(pattern);
}

function _parseToolsDocument(document: string): [Record<string, Rec>, string[]] {
  const parsed: Rec = {};
  const errors: string[] = [];
  let semanticSectionSeen = false;
  const blocks = document.split(/^##\s+/gm);
  blocks.slice(1).forEach((block, offset) => {
    const index = offset + 1;
    const lines = splitLines(block);
    if (lines.length > 0 && lines[0] === "Ferramentas semânticas e diagnóstico") {
      if (semanticSectionSeen) errors.push("duplicate semantic tools section");
      semanticSectionSeen = true;
      const semanticBlocks = lines.slice(2).join("\n").split(/^###\s+/gm);
      semanticBlocks.slice(1).forEach((semanticBlock, semanticOffset) => {
        const semanticIndex = semanticOffset + 1;
        const semanticLines = splitLines(semanticBlock);
        const nameMatch = _fullmatch(/^`([^`]+)`$/, semanticLines[0]);
        if (nameMatch === null) {
          errors.push(`malformed semantic tool heading at block ${semanticIndex}`);
          return;
        }
        const name = nameMatch[1] as string;
        if (!_NON_ATOMIC_TOOL_NAMES.has(name)) {
          errors.push(`unknown semantic tool: ${name}`);
          return;
        }
        if (Object.hasOwn(parsed, name)) errors.push(`duplicate tool block: ${name}`);
        // (.*) after the fixed prefix always fullmatches a prefix line, so find() is equivalent.
        const descriptionLine = semanticLines
          .slice(2)
          .find((line) => line.startsWith("- Descrição: "));
        const parametersLine = semanticLines
          .slice(2)
          .find((line) => line.startsWith("- Argumentos principais: "));
        const description =
          descriptionLine === undefined
            ? undefined
            : descriptionLine.slice("- Descrição: ".length);
        const parametersText =
          parametersLine === undefined
            ? undefined
            : parametersLine.slice("- Argumentos principais: ".length);
        if (description === undefined || description.trim() === "") {
          errors.push(`semantic tool description must be non-empty: ${name}`);
          return;
        }
        if (parametersText === undefined || parametersText.trim() === "") {
          errors.push(`semantic tool parameters must be non-empty: ${name}`);
          return;
        }
        parsed[name] = {
          description: collapseWhitespace(description),
          parameters: collapseWhitespace(parametersText),
        };
      });
      return;
    }
    const nameMatch = _fullmatch(/^`((?:compras|pncp)_[a-z0-9_]+)`$/, lines[0]);
    if (nameMatch === null) {
      errors.push(`malformed tool heading at block ${index}`);
      return;
    }
    const name = nameMatch[1] as string;
    if (Object.hasOwn(parsed, name)) errors.push(`duplicate tool block: ${name}`);
    const providerMatch =
      lines.length > 2 ? _fullmatch(/^- Provedor: `([^`]+)`$/, lines[2]) : null;
    const endpointMatch =
      lines.length > 3 ? _fullmatch(/^- Endpoint: `(GET) (.+)`$/, lines[3]) : null;
    const descriptionMatch =
      lines.length > 4 ? _fullmatch(/^- Descrição: (.*)$/, lines[4]) : null;
    if (!providerMatch || !endpointMatch || !descriptionMatch) {
      errors.push(`malformed metadata for tool: ${name}`);
      return;
    }
    const parameters: Rec[] = [];
    if (lines.length < 6 || lines[6] !== "### Parâmetros") {
      errors.push(`missing parameter section for tool: ${name}`);
      return;
    }
    const parameterNames = new Set<string>();
    for (const line of lines.slice(7)) {
      if (!line) continue;
      const parameterMatch = _fullmatch(
        /^- `([^`]+)` \(`([^`]+)`, (obrigatório|opcional)\): schema: (.+); descrição: (.*)$/,
        line
      );
      if (parameterMatch === null) {
        errors.push(`malformed parameter for tool: ${name}`);
        continue;
      }
      let schema: unknown;
      try {
        schema = JSON.parse(parameterMatch[4] as string);
      } catch {
        errors.push(`invalid parameter schema for tool: ${name}`);
        continue;
      }
      if (!isRec(schema)) {
        errors.push(`parameter schema must be an object for tool: ${name}`);
        continue;
      }
      const parameterKey = pairRepr(parameterMatch[1], parameterMatch[2]);
      if (parameterNames.has(parameterKey)) {
        errors.push(`duplicate parameter for tool: ${name}: ${parameterKey}`);
      }
      parameterNames.add(parameterKey);
      parameters.push({
        name: parameterMatch[1],
        in: parameterMatch[2],
        required: parameterMatch[3] === "obrigatório",
        schema,
        description: parameterMatch[5],
      });
    }
    parsed[name] = {
      provider: providerMatch[1],
      method: endpointMatch[1],
      path: endpointMatch[2],
      description: collapseWhitespace(descriptionMatch[1] as string),
      parameters,
    };
  });
  if (!semanticSectionSeen) errors.push("missing semantic tools section");
  for (const name of _NON_ATOMIC_TOOL_NAMES) {
    if (!Object.hasOwn(parsed, name)) errors.push(`missing semantic tool: ${name}`);
  }
  return [parsed as Record<string, Rec>, errors];
}

function _checkTools(toolsPath: string, manifestPath: string): number {
  const manifest = _readManifest(manifestPath);
  const errors = _validateManifest(manifest);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
    return 1;
  }
  const expected: Rec = {};
  for (const endpoint of _manifestEndpoints(manifest)) {
    if (
      get(endpoint, "classification") !== "PUBLIC_USEFUL" ||
      get(endpoint, "implemented") !== true
    ) {
      continue;
    }
    const parametersValue = getD(endpoint, "parameters", []);
    expected[pyStr(endpoint["tool"])] = {
      provider: endpoint["provider"],
      method: endpoint["method"],
      path: endpoint["path"],
      description: collapseWhitespace(pyStr(endpoint["description"])),
      parameters: (Array.isArray(parametersValue) ? parametersValue : []).map((rawParameter) => {
        const parameter = rawParameter as Rec;
        return {
          name: parameter["name"],
          in: parameter["in"],
          required: pyBool(getD(parameter, "required", false)),
          schema: getD(parameter, "schema", {}),
          description: collapseWhitespace(pyStr(getD(parameter, "description", ""))),
        };
      }),
    };
  }
  for (const [name, description, parameters] of _NON_ATOMIC_TOOLS) {
    expected[name] = { description, parameters };
  }
  const actualText = readText(toolsPath);
  const [actual, parseErrors] = _parseToolsDocument(actualText);
  if (
    parseErrors.length > 0 ||
    !jsonEquals(actual, expected) ||
    actualText !== _toolsMarkdown(manifest)
  ) {
    process.stderr.write(
      `tools document differs: expected=${Object.keys(expected).length} ` +
        `actual=${Object.keys(actual).length} errors=${parseErrors.length}\n`
    );
    return 1;
  }
  process.stdout.write(
    `tools document is current: ${toolsPath} (${Object.keys(expected).length} tools)\n`
  );
  return 0;
}

function _checkCoverageDoc(manifestPath: string, documentPath: string): number {
  const manifest = _readManifest(manifestPath);
  const errors = _validateManifest(manifest);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`ERROR: ${error}\n`);
    return 1;
  }
  const expected = _coverageMarkdown(manifest);
  const actual = existsSync(documentPath) ? readText(documentPath) : "";
  if (actual !== expected) {
    process.stderr.write(`coverage document differs: ${documentPath}\n`);
    return 1;
  }
  process.stdout.write(`coverage document is current: ${documentPath}\n`);
  return 0;
}

function _checkPair(
  values: string[] | undefined,
  defaultDocument: string,
  defaultManifest: string
): [string, string] {
  if (!values || values.length === 0) return [defaultDocument, defaultManifest];
  if (values.length === 1) {
    const candidate = values[0] as string;
    return extname(candidate).toLowerCase() === ".md"
      ? [candidate, defaultManifest]
      : [defaultDocument, candidate];
  }
  return [values[0] as string, values[1] as string];
}

const USAGE =
  "usage: catalogo [-h] [--check MANIFEST | --check-tools [PATH ...] | " +
  "--check-coverage-doc [PATH ...]] [--coverage-doc PATH] " +
  "{discover,render-tools,render-coverage} ...";

function printHelp(): void {
  process.stdout.write(
    `${USAGE}\n\nDescobre e compara contratos oficiais\n\n` +
      "positional arguments:\n" +
      "  {discover,render-tools,render-coverage}\n" +
      "    discover            descobre endpoints e gera manifesto YAML\n" +
      "    render-tools\n" +
      "    render-coverage\n\n" +
      "options:\n" +
      "  -h, --help            show this help message and exit\n" +
      "  --check MANIFEST\n" +
      "  --check-tools [PATH ...]\n" +
      "  --check-coverage-doc [PATH ...]\n" +
      "  --coverage-doc PATH\n"
  );
}

function argparseError(message: string): void {
  process.stderr.write(`${USAGE}\n`);
  process.stderr.write(`catalogo: error: ${message}\n`);
}

interface Args {
  command?: string;
  check?: string;
  checkTools?: string[];
  checkCoverageDoc?: string[];
  coverageDoc: string;
  compras?: string;
  pncp?: string;
  official: boolean;
  compare?: string;
  failOnDiff: boolean;
  output?: string;
  manifest?: string;
  renderCoverageDoc?: string;
}

type ParseResult = { kind: "ok"; args: Args } | { kind: "help" } | { kind: "error" };

function _isOption(token: string): boolean {
  return token.startsWith("-") && token.length > 1;
}

// Mirrors _parser() with the legacy leading `check <file>` positional accepted for --check.
// ponytail: no argparse abbreviation matching (--comp → --compare); nothing in the repo relies on it.
function _parseArgs(argv: string[]): ParseResult {
  const args: Args = { coverageDoc: "ENDPOINT_COVERAGE.md", official: false, failOnDiff: false };
  const fail = (message: string): ParseResult => {
    argparseError(message);
    return { kind: "error" };
  };
  let i = 0;
  const unrecognized: string[] = [];
  // argparse consumes all top-level optionals, reports invalid positionals and unknown
  // options together, and only then enforces the mutually exclusive group.
  let firstCheckOption: string | null = null;
  const conflict = (token: string): ParseResult =>
    fail(`argument ${token}: not allowed with argument ${firstCheckOption as string}`);
  for (; i < argv.length; i++) {
    const token = argv[i] as string;
    if (token === "-h" || token === "--help") {
      printHelp();
      return { kind: "help" };
    } else if (token === "--check") {
      if (i + 1 >= argv.length) return fail("argument --check: expected one argument");
      if (firstCheckOption !== null && args.check === undefined) return conflict(token);
      args.check = argv[++i] as string;
      firstCheckOption = token;
    } else if (token === "--check-tools" || token === "--check-coverage-doc") {
      if (firstCheckOption !== null) return conflict(token);
      const values: string[] = [];
      while (i + 1 < argv.length && !_isOption(argv[i + 1] as string)) {
        values.push(argv[++i] as string);
      }
      if (token === "--check-tools") args.checkTools = values;
      else args.checkCoverageDoc = values;
      firstCheckOption = token;
    } else if (token === "--coverage-doc") {
      if (i + 1 >= argv.length) return fail("argument --coverage-doc: expected one argument");
      args.coverageDoc = argv[++i] as string;
    } else if (_isOption(token)) {
      unrecognized.push(token);
    } else if (token === "discover" || token === "render-tools" || token === "render-coverage") {
      args.command = token;
      break;
    } else {
      return fail(
        `argument command: invalid choice: '${token}' ` +
          "(choose from discover, render-tools, render-coverage)"
      );
    }
  }
  if (unrecognized.length > 0) return fail(`unrecognized arguments: ${unrecognized.join(" ")}`);
  if (args.command === undefined) return { kind: "ok", args };
  i++;
  // Subparser: unknown tokens (with their values) accumulate into parse_args' extras.
  const extras: string[] = [];
  for (; i < argv.length; i++) {
    const token = argv[i] as string;
    if (token === "-h" || token === "--help") {
      printHelp();
      return { kind: "help" };
    }
    const needsValue =
      (args.command === "discover" &&
        ["--compras", "--pncp", "--compare", "--output"].includes(token)) ||
      (args.command !== "discover" &&
        (token === "--output" || (args.command === "render-coverage" && token === "--coverage-doc")));
    if (needsValue) {
      if (i + 1 >= argv.length) return fail(`argument ${token}: expected one argument`);
      const value = argv[++i] as string;
      if (token === "--compras") args.compras = value;
      else if (token === "--pncp") args.pncp = value;
      else if (token === "--compare") args.compare = value;
      else if (token === "--coverage-doc") args.renderCoverageDoc = value;
      else args.output = value;
    } else if (token === "--official") {
      args.official = true;
    } else if (token === "--fail-on-diff") {
      args.failOnDiff = true;
    } else if (_isOption(token)) {
      extras.push(token);
      if (i + 1 < argv.length && !_isOption(argv[i + 1] as string)) extras.push(argv[++i] as string);
    } else if (args.command !== "discover" && args.manifest === undefined) {
      args.manifest = token;
    } else {
      extras.push(token);
    }
  }
  if (extras.length > 0) return fail(`unrecognized arguments: ${extras.join(" ")}`);
  if ((args.command === "render-tools" || args.command === "render-coverage") && !args.manifest) {
    return fail("the following arguments are required: manifest");
  }
  return { kind: "ok", args };
}

export async function main(argv: string[]): Promise<number> {
  // Legacy first-positional form: `catalogo check MANIFEST` == `catalogo --check MANIFEST`.
  if (argv[0] === "check") argv = ["--check", ...argv.slice(1)];
  const parsed = _parseArgs(argv);
  if (parsed.kind === "help") return 0;
  if (parsed.kind === "error") return 2;
  const args = parsed.args;
  try {
    let checkModes = [args.check, args.checkTools, args.checkCoverageDoc].filter(
      (value) => value !== undefined
    ).length;
    if (
      (args.command === "render-tools" || args.command === "render-coverage") &&
      checkModes > 0
    ) {
      throw new Error("check modes cannot be combined with a render command");
    }
    if (args.command === "discover") {
      if (checkModes > 0) throw new Error("check modes cannot be combined with discover");
      if (args.failOnDiff && args.compare === undefined) {
        throw new Error("--fail-on-diff requires --compare");
      }
      if (args.official && (args.compras !== undefined || args.pncp !== undefined)) {
        throw new Error("--official cannot be combined with local snapshot paths");
      }
      const specs: Record<string, Rec> = {};
      const sources: Record<string, string> = {};
      for (const provider of ["compras", "pncp"]) {
        const [spec, source] = await _loadSource(
          provider === "compras" ? args.compras : args.pncp,
          provider,
          args.official
        );
        specs[provider] = spec;
        sources[provider] = source;
      }
      const manifest = _manifestFromSpecs(specs, sources);
      if (args.compare !== undefined) {
        const previous = _readManifest(args.compare);
        const diff = compareCatalogs(
          _manifestEndpoints(previous),
          _manifestEndpoints(manifest),
          {
            previous_source_version: get(previous, "source_version"),
            current_source_version: get(manifest, "source_version"),
          }
        );
        process.stdout.write(`${_formatDiff(diff)}\n`);
        if (
          args.failOnDiff &&
          (diff.added.length > 0 ||
            diff.removed.length > 0 ||
            diff.changed.length > 0 ||
            diff.changes.length > 0)
        ) {
          return 1;
        }
      }
      if (args.output) _writeYaml(manifest, args.output);
      else if (args.compare === undefined) _writeYaml(manifest, null);
      return 0;
    }
    if (args.command === "render-tools") {
      return _renderTools(args.manifest as string, args.output ?? null);
    }
    if (args.command === "render-coverage") {
      const output = args.output || args.renderCoverageDoc || args.coverageDoc;
      return _renderCoverage(args.manifest as string, output);
    }
    checkModes = [args.check, args.checkTools, args.checkCoverageDoc].filter(
      (value) => value !== undefined
    ).length;
    if (checkModes > 1) throw new Error("only one check mode is allowed");
    if (args.check) return await _checkManifest(args.check);
    if (args.checkTools !== undefined) {
      const [toolsPath, manifestPath] = _checkPair(
        args.checkTools,
        "TOOLS.md",
        "coverage/endpoints.yaml"
      );
      return _checkTools(toolsPath, manifestPath);
    }
    if (args.checkCoverageDoc !== undefined) {
      const [documentPath, manifestPath] = _checkPair(
        args.checkCoverageDoc,
        args.coverageDoc,
        "coverage/endpoints.yaml"
      );
      return _checkCoverageDoc(manifestPath, documentPath);
    }
    printHelp();
    return 0;
  } catch (error) {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

// Alias for the load_openapi → loadOpenApi spelling used by the CLI migration notes.
export { loadOpenapi as loadOpenApi };
