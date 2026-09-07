import { ReadOnlyHttpClient } from "../../shared/http_readonly.js";
import { loadSettings } from "../../shared/runtime.js";

const PAGINATION_KEYS: ReadonlyMap<string, string> = new Map([
  ["totalRegistros", "total_items"],
  ["totalPaginas", "total_pages"],
  ["numeroPagina", "page"],
  ["tamanhoPagina", "page_size"],
]);

export interface NormalizedPage {
  items: unknown;
  pagination: Record<string, unknown>;
}

function normalizePage(payload: unknown, ...itemKeys: string[]): NormalizedPage {
  if (Array.isArray(payload)) return { items: payload, pagination: {} };

  if (typeof payload === "object" && payload !== null) {
    const page = payload as Record<string, unknown>;
    let items: unknown = page;
    for (const itemKey of itemKeys) {
      if (Object.hasOwn(page, itemKey)) {
        items = page[itemKey];
        break;
      }
    }
    const pagination: Record<string, unknown> = {};
    for (const [upstreamKey, normalizedKey] of PAGINATION_KEYS) {
      if (Object.hasOwn(page, upstreamKey)) {
        pagination[normalizedKey] = page[upstreamKey];
      }
    }
    return { items, pagination };
  }

  return { items: payload, pagination: {} };
}

interface ClientOptions {
  maxDocumentBytes?: number;
}

function buildClient(
  baseUrl: string,
  provider: "compras" | "pncp",
  maxConcurrency: number,
  settings: ReturnType<typeof loadSettings>,
  opts: ClientOptions | undefined,
): ReadOnlyHttpClient {
  return new ReadOnlyHttpClient(baseUrl, {
    requestsPerSecond: settings.httpRequestsPerSecond,
    maxConcurrency,
    provider,
    maxRetries: settings.httpMaxRetries,
    timeout: settings.httpTimeout,
    maxDocumentBytes: opts?.maxDocumentBytes ?? settings.maxDocumentBytes,
  });
}

export class ComprasClient {
  static readonly baseUrl = "https://dadosabertos.compras.gov.br";

  static normalizePage(payload: unknown): NormalizedPage {
    return normalizePage(payload, "resultado", "data");
  }

  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient {
    if (opts?.maxDocumentBytes !== undefined && opts.maxDocumentBytes <= 0) {
      throw new Error("max_document_bytes must be positive");
    }
    const settings = loadSettings();
    return buildClient(
      ComprasClient.baseUrl,
      "compras",
      settings.comprasMaxConcurrency,
      settings,
      opts,
    );
  }
}

export class PncpClient {
  static readonly baseUrl = "https://pncp.gov.br/api/pncp";

  static normalizePage(payload: unknown): NormalizedPage {
    return normalizePage(payload, "data");
  }

  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient {
    if (opts?.maxDocumentBytes !== undefined && opts.maxDocumentBytes <= 0) {
      throw new Error("max_document_bytes must be positive");
    }
    const settings = loadSettings();
    return buildClient(
      PncpClient.baseUrl,
      "pncp",
      settings.pncpMaxConcurrency,
      settings,
      opts,
    );
  }
}
