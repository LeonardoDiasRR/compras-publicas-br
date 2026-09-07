import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadOnlyHttpClient, UpstreamError } from "../src/shared/http_readonly.js";
import { TtlCache } from "../src/shared/runtime.js";
import { jsonResponse, stubFetch } from "./support/stub_fetch.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("http_readonly", () => {
  it("client_only_requests_an_allowlisted_relative_get", async () => {
    const { fetchImpl, calls } = stubFetch([
      "https://pncp.gov.br/api/pncp/v1/modalidades",
      jsonResponse([{ codigo: 1 }]),
    ]);
    const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", { fetchImpl });
    expect(await client.get("/v1/modalidades")).toEqual([{ codigo: 1 }]);
    expect(calls.length).toBe(1);
  });

  it("client_resolves_relative_path_against_configured_pncp_origin", async () => {
    const { fetchImpl, calls } = stubFetch([
      "https://pncp.gov.br/api/pncp/v1/modos-disputas",
      jsonResponse([{ codigo: 2 }]),
    ]);
    const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", { fetchImpl });
    expect(await client.get("/v1/modos-disputas")).toEqual([{ codigo: 2 }]);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe("https://pncp.gov.br/api/pncp/v1/modos-disputas");
  });

  it("client_rejects_absolute_url", async () => {
    const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", {
      fetchImpl: stubFetch().fetchImpl,
    });
    await expect(client.get("https://example.com/private")).rejects.toThrow(/relative/);
  });

  it("client_rejects_unsafe_relative_paths", async () => {
    const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", {
      fetchImpl: stubFetch().fetchImpl,
    });
    for (const path of ["//example.com/private", "../private"]) {
      await expect(client.get(path)).rejects.toThrow(/relative/);
    }
  });

  it("client_does_not_retry_not_found", async () => {
    const { fetchImpl, calls } = stubFetch([
      "https://pncp.gov.br/api/pncp/v1/modalidades/999",
      jsonResponse({ message: "not found" }, 404),
    ]);
    const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", {
      maxRetries: 3,
      fetchImpl,
    });
    const err = await client.get("/v1/modalidades/999").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect((err as UpstreamError).kind).toBe("NOT_FOUND");
    expect(String((err as UpstreamError).message)).toMatch(/NOT_FOUND/);
    expect(calls.length).toBe(1);
  });

  it("client_retries_retryable_status_then_succeeds", async () => {
    let attempts = 0;
    const { fetchImpl, calls } = stubFetch([
      "https://dadosabertos.compras.gov.br/api/contratos",
      () => {
        attempts += 1;
        return attempts === 1
          ? new Response("busy", { status: 503 })
          : jsonResponse({ ok: true });
      },
    ]);
    const client = new ReadOnlyHttpClient("https://dadosabertos.compras.gov.br/api/contratos", {
      maxRetries: 3,
      fetchImpl,
    });
    expect(await client.get("/lista")).toEqual({ ok: true });
    expect(calls.length).toBe(2);
  });

  it("client_gives_up_after_max_retries", async () => {
    const { fetchImpl, calls } = stubFetch([
      "https://dadosabertos.compras.gov.br/api/contratos",
      () => new Response("down", { status: 503 }),
    ]);
    const client = new ReadOnlyHttpClient("https://dadosabertos.compras.gov.br/api/contratos", {
      maxRetries: 1,
      fetchImpl,
    });
    const err = await client.get("/lista").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect((err as UpstreamError).kind).toBe("UPSTREAM_UNAVAILABLE");
    expect((err as UpstreamError).status).toBe(503);
    expect(calls.length).toBe(2);
  });

  it("client_has_no_write_methods", () => {
    for (const method of ["post", "put", "patch", "delete"]) {
      expect(ReadOnlyHttpClient).not.toHaveProperty(method);
      expect(ReadOnlyHttpClient.prototype).not.toHaveProperty(method);
    }
  });

  it("ttl_cache_expires_entries", () => {
    // espelho do monkeypatch de time.monotonic: adianta o relógio (Date.now e
    // performance.now) para cobrir a fonte de tempo que a implementação usar.
    const cache = new TtlCache();
    cache.put("key", "value", 1);
    expect(cache.get("key")).toBe("value");
    const dateNow = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(dateNow + 2_000);
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 2_000_000);
    expect(cache.get("key")).toBeUndefined();
  });
});
