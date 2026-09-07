import { performance } from "node:perf_hooks";

const LOG_FIELDS: readonly string[] = [
  "request_id",
  "provider",
  "tool",
  "endpoint",
  "duration_ms",
  "status_code",
  "retry_count",
  "cache_hit",
];
const MAX_LOG_MESSAGE_LENGTH = 2048;
const SENSITIVE_KEY =
  /(?:private[-_ ]?key|password|passwd|token|auth|api[-_ ]?key|secret|cookie)/i;
const SENSITIVE_MESSAGE =
  /(?<prefix>\b(?:private[-_ ]?key|authorization|auth|api[-_ ]?key|password|passwd|secret|token|access[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret|cookie)\b\s*["']?\s*[:=]\s*)(?:(?<double>"(?:\\.|[^"\\])*")|(?<single>'(?:\\.|[^'\\])*')|(?<bare>(?:bearer\s+)?[^\s,;}\]]+))/gi;

export interface Settings {
  comprasBaseUrl: string;
  pncpBaseUrl: string;
  httpTimeout: number;
  httpMaxRetries: number;
  httpRequestsPerSecond: number;
  comprasMaxConcurrency: number;
  pncpMaxConcurrency: number;
  cacheEnabled: boolean;
  cacheDomainsTtl: number;
  cacheCatalogTtl: number;
  cacheRecentTtl: number;
  cacheHistoricalTtl: number;
  maxDocumentBytes: number;
  mcpTransport: "stdio" | "http";
  logLevel: string;
}

function redactJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactJsonValue);
  }
  if (typeof value === "object" && value !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactJsonValue(item);
    }
    return redacted;
  }
  if (typeof value === "string") {
    return redactJsonMessage(value) ?? value;
  }
  return value;
}

// ponytail: bracket-matching scanner emulating json raw_decode; upgrade path is
// a real incremental JSON parser only if pathological inputs show up.
function parseJsonAt(text: string, start: number): [unknown, number] | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          return [JSON.parse(text.slice(start, i + 1)), i + 1];
        } catch {
          return null;
        }
      }
    } else if (depth === 0) {
      return null;
    }
  }
  return null;
}

function redactJsonMessage(message: string): string | null {
  let cursor = 0;
  const parts: string[] = [];
  let found = false;
  while (cursor < message.length) {
    const objectStart = message.indexOf("{", cursor);
    const arrayStart = message.indexOf("[", cursor);
    const starts = [objectStart, arrayStart].filter((start) => start >= 0);
    if (starts.length === 0) break;
    const start = Math.min(...starts);
    const parsed = parseJsonAt(message, start);
    if (parsed === null) {
      cursor = start + 1;
      continue;
    }
    const [value, end] = parsed;
    if (typeof value !== "object" || value === null) {
      cursor = end;
      continue;
    }
    parts.push(message.slice(cursor, start), JSON.stringify(redactJsonValue(value)));
    cursor = end;
    found = true;
  }
  if (!found) return null;
  parts.push(message.slice(cursor));
  return parts.join("");
}

function safeMessage(message: string): string {
  let redacted = redactJsonMessage(message) ?? message;
  redacted = redacted.replace(
    SENSITIVE_MESSAGE,
    (...args: unknown[]) => {
      const groups = args[args.length - 1] as {
        prefix: string;
        double?: string;
        single?: string;
      };
      const value = groups.double || groups.single;
      const quote = value !== undefined ? value[0] : "";
      return `${groups.prefix}${quote}[REDACTED]${quote}`;
    },
  );
  if (redacted.length <= MAX_LOG_MESSAGE_LENGTH) return redacted;
  return `${redacted.slice(0, MAX_LOG_MESSAGE_LENGTH - 3)}...`;
}

function sanitizeExtra(value: unknown, key?: string): unknown {
  if (key !== undefined && SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return safeMessage(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeExtra(item));
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }
  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [rawKey, item] of Object.entries(value)) {
      sanitized[rawKey] = sanitizeExtra(item, rawKey);
    }
    return sanitized;
  }
  return safeMessage(String(value));
}

const LEVELS: Record<string, number> = {
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  critical: 50,
};

let minLevel = LEVELS["info"]!;

export function configureLogging(settings?: Settings): void {
  const name = (settings?.logLevel ?? "INFO").toLowerCase();
  minLevel = LEVELS[name] ?? LEVELS["info"]!;
}

function log(level: "INFO" | "WARNING" | "ERROR", numeric: number, message: string, extra?: Record<string, unknown>): void {
  if (numeric < minLevel) return;
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    name: "compras-publicas-br",
    message: safeMessage(message),
  };
  if (extra !== undefined) {
    for (const field of LOG_FIELDS) {
      if (Object.hasOwn(extra, field)) {
        payload[field] = sanitizeExtra(extra[field], field);
      }
    }
  }
  process.stderr.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  info(message: string, extra?: Record<string, unknown>): void {
    log("INFO", 20, message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    log("WARNING", 30, message, extra);
  },
  error(message: string, extra?: Record<string, unknown>): void {
    log("ERROR", 40, message, extra);
  },
};

let envFileLoaded = false;

function parsePositiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${name}: must be an integer`);
  }
  if (value <= 0) {
    throw new Error(`${name}: Input should be greater than 0`);
  }
  return value;
}

export function loadSettings(env: NodeJS.ProcessEnv = process.env): Settings {
  if (!envFileLoaded) {
    envFileLoaded = true;
    try {
      const loadEnvFile = (
        process as unknown as { loadEnvFile?: (path: string) => void }
      ).loadEnvFile;
      loadEnvFile?.call(process, ".env");
    } catch {
      // ignore missing/invalid .env
    }
  }

  const timeoutRaw = env["HTTP_TIMEOUT"];
  let httpTimeout = 30;
  if (timeoutRaw !== undefined) {
    if (timeoutRaw === "true" || timeoutRaw === "false") {
      throw new Error("HTTP_TIMEOUT: must be numeric seconds");
    }
    httpTimeout = Number(timeoutRaw);
    if (Number.isNaN(httpTimeout)) {
      throw new Error("HTTP_TIMEOUT: must be numeric seconds");
    }
    if (!Number.isFinite(httpTimeout)) {
      throw new Error("HTTP_TIMEOUT: must be finite");
    }
    if (httpTimeout <= 0) {
      throw new Error("HTTP_TIMEOUT: Input should be greater than 0");
    }
  }

  const cacheEnabledRaw = (env["CACHE_ENABLED"] ?? "true").toLowerCase();
  let cacheEnabled: boolean;
  if (cacheEnabledRaw === "true") cacheEnabled = true;
  else if (cacheEnabledRaw === "false") cacheEnabled = false;
  else throw new Error("CACHE_ENABLED: Input should be a valid boolean");

  const mcpTransportRaw = env["MCP_TRANSPORT"] ?? "stdio";
  if (mcpTransportRaw !== "stdio" && mcpTransportRaw !== "http") {
    throw new Error("MCP_TRANSPORT: Input should be 'stdio' or 'http'");
  }

  return {
    comprasBaseUrl: env["COMPRAS_BASE_URL"] ?? "https://dadosabertos.compras.gov.br",
    pncpBaseUrl: env["PNCP_BASE_URL"] ?? "https://pncp.gov.br/api/pncp",
    httpTimeout,
    httpMaxRetries: parsePositiveInt(env, "HTTP_MAX_RETRIES", 3),
    httpRequestsPerSecond: parsePositiveInt(env, "HTTP_REQUESTS_PER_SECOND", 5),
    comprasMaxConcurrency: parsePositiveInt(env, "COMPRAS_MAX_CONCURRENCY", 4),
    pncpMaxConcurrency: parsePositiveInt(env, "PNCP_MAX_CONCURRENCY", 4),
    cacheEnabled,
    cacheDomainsTtl: parsePositiveInt(env, "CACHE_DOMAINS_TTL", 86400),
    cacheCatalogTtl: parsePositiveInt(env, "CACHE_CATALOG_TTL", 3600),
    cacheRecentTtl: parsePositiveInt(env, "CACHE_RECENT_TTL", 300),
    cacheHistoricalTtl: parsePositiveInt(env, "CACHE_HISTORICAL_TTL", 86400),
    maxDocumentBytes: parsePositiveInt(env, "MAX_DOCUMENT_BYTES", 25_000_000),
    mcpTransport: mcpTransportRaw,
    logLevel: env["LOG_LEVEL"] ?? "INFO",
  };
}

export class TtlCache {
  private readonly maxEntries: number;
  private readonly entries = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(maxEntries = 4096) {
    if (maxEntries <= 0) {
      throw new Error("max_entries must be positive");
    }
    this.maxEntries = maxEntries;
  }

  get<T = unknown>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined || entry.expiresAt <= performance.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  put(key: string, value: unknown, ttlSeconds: number): void {
    if (ttlSeconds <= 0) {
      throw new Error("ttl_seconds must be positive");
    }
    if (!this.entries.has(key) && this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { expiresAt: performance.now() + ttlSeconds * 1000, value });
  }
}
