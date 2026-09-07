import { randomBytes, createHash } from "node:crypto";

import { logger } from "./runtime.js";

export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };
export type QueryParams = Record<string, JsonScalar | JsonScalar[]>;

const ALLOWED_HOSTNAMES = new Set(["dadosabertos.compras.gov.br", "pncp.gov.br"]);
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const RETRYABLE_KINDS = new Set(["UPSTREAM_TIMEOUT", "UPSTREAM_UNAVAILABLE"]);
const RETRY_BASE_SECONDS = 0.2;
const RETRY_JITTER_RATIO = 0.1;
const MAX_ERROR_BODY_CHARS = 4096;

export class UpstreamError extends Error {
  readonly kind: string;
  readonly status: number | null;
  readonly provider: string | null;
  readonly endpoint: string | null;
  readonly upstreamMessage: string;
  readonly retryable: boolean;

  constructor(
    kind: string,
    status: number | null,
    message: string,
    opts?: { provider?: string; endpoint?: string; upstreamMessage?: string },
  ) {
    super(`${kind}: ${message}`);
    this.name = "UpstreamError";
    this.kind = kind;
    this.status = status;
    this.provider = opts?.provider ?? null;
    this.endpoint = opts?.endpoint ?? null;
    this.upstreamMessage = (opts?.upstreamMessage ?? message).slice(0, MAX_ERROR_BODY_CHARS);
    this.retryable =
      (status !== null && RETRYABLE_STATUSES.has(status)) || RETRYABLE_KINDS.has(kind);
  }
}

export interface ReadOnlyHttpOptions {
  maxRetries?: number;
  timeout?: number;
  maxDocumentBytes?: number;
  maxConcurrency?: number;
  requestsPerSecond?: number;
  provider?: string;
  fetchImpl?: typeof globalThis.fetch;
}

class Semaphore {
  private available: number;
  private readonly waiters: (() => void)[] = [];

  constructor(max: number) {
    this.available = max;
  }

  acquire(): Promise<void> {
    if (this.available > 0) {
      this.available -= 1;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  release(): void {
    const next = this.waiters.shift();
    if (next !== undefined) next();
    else this.available += 1;
  }
}

interface RequestLimiter {
  semaphore: Semaphore | null;
  requestInterval: number | null;
  nextRequestAt: number;
  rateLock: Promise<void>;
}

// ponytail: single-threaded Node, one process-wide map keyed by origin beats Python's per-loop WeakKeyDictionary
const LIMITERS = new Map<string, RequestLimiter>();

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export class ReadOnlyHttpClient {
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly maxDocumentBytes: number;
  private readonly maxConcurrency: number | undefined;
  private readonly requestsPerSecond: number | undefined;
  private readonly base: string;
  private readonly origin: string;
  private readonly provider: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(baseUrl: string, options: ReadOnlyHttpOptions = {}) {
    const maxRetries = options.maxRetries ?? 3;
    const maxDocumentBytes = options.maxDocumentBytes ?? 25_000_000;
    if (maxRetries < 0) {
      throw new Error("max_retries must be non-negative");
    }
    if (!Number.isInteger(maxDocumentBytes) || maxDocumentBytes <= 0) {
      throw new Error("max_document_bytes must be a positive finite integer");
    }
    if (
      options.maxConcurrency !== undefined &&
      (!Number.isInteger(options.maxConcurrency) || options.maxConcurrency <= 0)
    ) {
      throw new Error("max_concurrency must be positive");
    }
    if (
      options.requestsPerSecond !== undefined &&
      (!Number.isFinite(options.requestsPerSecond) || options.requestsPerSecond <= 0)
    ) {
      throw new Error("requests_per_second must be positive");
    }

    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new Error("base_url must use a supported HTTPS port");
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      parsed.protocol !== "https:" ||
      !ALLOWED_HOSTNAMES.has(hostname) ||
      !(parsed.port === "" || parsed.port === "443") ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      throw new Error("base_url must use an allowlisted HTTPS host and supported port");
    }

    this.maxRetries = maxRetries;
    this.timeout = options.timeout ?? 30;
    this.maxDocumentBytes = maxDocumentBytes;
    this.maxConcurrency = options.maxConcurrency;
    this.requestsPerSecond = options.requestsPerSecond;
    this.base = baseUrl.replace(/\/+$/, "");
    this.origin = `https://${hostname}`;
    this.provider = options.provider ?? (hostname === "pncp.gov.br" ? "pncp" : "compras");
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async get(path: string, params?: QueryParams): Promise<JsonValue | string> {
    const requestPath = ReadOnlyHttpClient.relativePath(path);
    const endpoint = `/${requestPath}`;
    const requestId = randomBytes(16).toString("hex");

    const url = new URL(`${this.base}/${requestPath}`);
    if (params !== undefined) {
      for (const [key, value] of Object.entries(params)) {
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
          // ponytail: httpx renders None as bare key; URLSearchParams renders empty value
          url.searchParams.append(key, item === null ? "" : String(item));
        }
      }
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let retry = false;
      let statusCode: number | null = null;
      const limiter = this.getLimiter();
      if (limiter?.semaphore != null) await limiter.semaphore.acquire();
      let started = Date.now();
      try {
        await this.waitForRateLimit(limiter);
        // parity com http_readonly.py:151: o timer mede apenas o pedido real, não a espera do rate limit
        started = Date.now();
        // ponytail: redirect:"manual" mirrors httpx not following redirects; allowlisted APIs answer 2xx/4xx directly
        const response = await this.fetchImpl(url.toString(), {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(Math.max(this.timeout * 1000, 1)),
        });
        statusCode = response.status;
        const body = await this.readBody(response, endpoint);
        if (RETRYABLE_STATUSES.has(response.status)) {
          if (attempt < this.maxRetries) {
            retry = true;
          } else {
            throw new UpstreamError(
              ReadOnlyHttpClient.errorKind(response.status),
              response.status,
              ReadOnlyHttpClient.errorBodyText(response, body),
              { provider: this.provider, endpoint },
            );
          }
        } else if (response.status === 404) {
          throw new UpstreamError("NOT_FOUND", 404, ReadOnlyHttpClient.errorBodyText(response, body), {
            provider: this.provider,
            endpoint,
          });
        } else if (response.status >= 300) {
          throw new UpstreamError(
            ReadOnlyHttpClient.errorKind(response.status),
            response.status,
            ReadOnlyHttpClient.errorBodyText(response, body),
            { provider: this.provider, endpoint },
          );
        }

        if (!retry) {
          if (ReadOnlyHttpClient.isJson(response)) {
            try {
              return JSON.parse(ReadOnlyHttpClient.bodyText(response, body)) as JsonValue;
            } catch (error) {
              throw new UpstreamError(
                "UPSTREAM_SCHEMA_CHANGED",
                response.status,
                error instanceof Error ? error.message : String(error),
                { provider: this.provider, endpoint },
              );
            }
          }
          return ReadOnlyHttpClient.bodyText(response, body);
        }
      } catch (error) {
        if (error instanceof UpstreamError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        const isTimeout =
          error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
        if (attempt < this.maxRetries) {
          retry = true;
        } else {
          throw new UpstreamError(
            isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
            null,
            message,
            { provider: this.provider, endpoint },
          );
        }
      } finally {
        if (limiter?.semaphore != null) limiter.semaphore.release();
        logger.info("upstream request", {
          request_id: requestId,
          provider: this.provider,
          endpoint: createHash("sha256").update(endpoint, "utf8").digest("hex"),
          duration_ms: Math.round((Date.now() - started) * 1000) / 1000,
          status_code: statusCode,
          retry_count: attempt,
          cache_hit: false,
        });
      }
      if (retry) {
        await ReadOnlyHttpClient.sleepBeforeRetry(attempt);
        continue;
      }
    }

    throw new Error("unreachable");
  }

  private getLimiter(): RequestLimiter | null {
    let limiter = LIMITERS.get(this.origin);
    if (limiter === undefined) {
      if (this.maxConcurrency === undefined && this.requestsPerSecond === undefined) {
        return null;
      }
      limiter = {
        semaphore: this.maxConcurrency !== undefined ? new Semaphore(this.maxConcurrency) : null,
        requestInterval:
          this.requestsPerSecond !== undefined ? 1 / this.requestsPerSecond : null,
        nextRequestAt: 0,
        rateLock: Promise.resolve(),
      };
      LIMITERS.set(this.origin, limiter);
    }
    return limiter;
  }

  private async waitForRateLimit(limiter: RequestLimiter | null): Promise<void> {
    if (limiter === null || limiter.requestInterval === null) return;
    const previous = limiter.rateLock;
    let release!: () => void;
    limiter.rateLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const now = Date.now();
      if (limiter.nextRequestAt > now) {
        await sleep((limiter.nextRequestAt - now) / 1000);
      }
      limiter.nextRequestAt = Date.now() + limiter.requestInterval * 1000;
    } finally {
      release();
    }
  }

  private static relativePath(path: string): string {
    let decoded = path;
    for (;;) {
      let next: string;
      try {
        next = decodeURIComponent(decoded);
      } catch {
        break;
      }
      if (next === decoded) break;
      decoded = next;
    }
    let parsed: URL | null = null;
    try {
      parsed = new URL(`http://x${decoded}`);
    } catch {
      parsed = null;
    }
    if (
      !path.startsWith("/") ||
      parsed === null ||
      parsed.protocol !== "http:" ||
      parsed.host !== "x" ||
      decoded.startsWith("//") ||
      parsed.search !== "" ||
      parsed.hash !== "" ||
      decoded.includes("\\")
    ) {
      throw new Error("path must be relative to the fixed upstream origin");
    }
    // new URL() normalizes ".." away, so the segment check must run on the raw decoded path
    const decodedPath = decoded.split(/[?#]/)[0] ?? "";
    if (decodedPath.split("/").includes("..")) {
      throw new Error("path must be relative to the fixed upstream origin");
    }
    return path.replace(/^\/+/, "");
  }

  private static isJson(response: Response): boolean {
    const contentType = (response.headers.get("content-type") ?? "").split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    return contentType === "application/json" || (contentType?.endsWith("+json") ?? false);
  }

  private static errorKind(status: number): string {
    if (status === 429) return "UPSTREAM_RATE_LIMIT";
    if (status >= 500) return "UPSTREAM_UNAVAILABLE";
    return "UPSTREAM_BAD_REQUEST";
  }

  private static async sleepBeforeRetry(attempt: number): Promise<void> {
    const delay = RETRY_BASE_SECONDS * 2 ** attempt;
    await sleep(delay + Math.random() * delay * RETRY_JITTER_RATIO);
  }

  private async readBody(response: Response, endpoint: string): Promise<Uint8Array> {
    const contentLength = response.headers.get("content-length");
    if (contentLength !== null) {
      const declared = Number(contentLength);
      if (Number.isInteger(declared) && declared > this.maxDocumentBytes) {
        throw new UpstreamError(
          "DOCUMENT_TOO_LARGE",
          response.status,
          `response exceeds ${this.maxDocumentBytes} bytes`,
          { provider: this.provider, endpoint },
        );
      }
    }

    if (response.body === null) return new Uint8Array(0);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > this.maxDocumentBytes) {
        throw new UpstreamError(
          "DOCUMENT_TOO_LARGE",
          response.status,
          `response exceeds ${this.maxDocumentBytes} bytes`,
          { provider: this.provider, endpoint },
        );
      }
      chunks.push(value);
    }
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return body;
  }

  private static bodyText(response: Response, body: Uint8Array): string {
    const contentType = response.headers.get("content-type") ?? "";
    const match = /(?:^|;)\s*charset\s*=\s*"?([^";]+)"?/i.exec(contentType);
    const charset = (match?.[1] ?? "utf-8").trim();
    const decode = (label: string): string => new TextDecoder(label, { fatal: false }).decode(body);
    try {
      return decode(charset === "" ? "utf-8" : charset);
    } catch {
      return decode("utf-8");
    }
  }

  private static errorBodyText(response: Response, body: Uint8Array): string {
    return ReadOnlyHttpClient.bodyText(response, body).slice(0, MAX_ERROR_BODY_CHARS);
  }
}
