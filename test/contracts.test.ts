import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { parse, stringify } from "yaml";
import { describe, expect, it } from "vitest";

import { TOOL_NAME_RE, renderCoverage } from "../src/features/catalogo/catalogo.js";
import { OperationSchema, type Operation } from "../src/features/catalogo/modelos.js";
import { QueryService } from "../src/features/consultas/servico.js";
import { ReadOnlyHttpClient, UpstreamError } from "../src/shared/http_readonly.js";
import type { Settings } from "../src/shared/runtime.js";
import { jsonResponse, stubFetch } from "./support/stub_fetch.js";

type Rec = Record<string, unknown>;

const REPOSITORY_ROOT = fileURLToPath(new URL("../", import.meta.url));
const MANIFEST_PATH = join(REPOSITORY_ROOT, "coverage", "endpoints.yaml");
const COMPRAS_SNAPSHOT = join(REPOSITORY_ROOT, "specs", "upstream", "compras", "2026-09-04.json");
const PNCP_SNAPSHOT = join(REPOSITORY_ROOT, "specs", "upstream", "pncp", "2026-09-04.json");
const MANIFEST = parse(readFileSync(MANIFEST_PATH, "utf-8")) as { endpoints: Rec[] };
const ENDPOINTS = MANIFEST["endpoints"];
const PUBLIC_ENDPOINTS = ENDPOINTS.filter(
  (endpoint) => endpoint["classification"] === "PUBLIC_USEFUL" && endpoint["implemented"] === true,
);
const AUTHENTICATED_ENDPOINTS = ENDPOINTS.filter(
  (endpoint) => endpoint["classification"] === "AUTHENTICATED",
);

// ponytail: import dinâmico — servidor.ts está sendo portado em paralelo;
// import estático derrubaria o arquivo inteiro em vez de só estes testes.
async function connectedClient(manifestPath: string): Promise<Client> {
  const { buildServer } = await import("../src/features/mcp/servidor.js");
  const server = buildServer(manifestPath);
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

// fixture "manifest_server" de escopo de módulo do python: um servidor compartilhado
let manifestClient: Promise<Client> | null = null;
function manifestClientInstance(): Promise<Client> {
  manifestClient ??= connectedClient(MANIFEST_PATH);
  return manifestClient;
}

function toolsByName(result: { tools: Tool[] }): Map<string, Tool> {
  return new Map(result.tools.map((tool) => [tool.name, tool]));
}

function pathQueryNames(endpoint: Rec): Set<string> {
  const parameters = (endpoint["parameters"] as Rec[] | undefined) ?? [];
  return new Set(
    parameters
      .filter((parameter) => parameter["in"] === "path" || parameter["in"] === "query")
      .map((parameter) => parameter["name"] as string),
  );
}

describe("contracts", () => {
  it("test_manifest_has_complete_public_coverage_and_no_unknown_classifications", () => {
    const report = renderCoverage(ENDPOINTS);

    expect(report.ratio).toBe(1.0);
    expect(ENDPOINTS.filter((endpoint) => endpoint["classification"] === "UNKNOWN")).toEqual([]);
  });

  it("test_implemented_public_tools_are_unique_valid_provider_prefixed_and_bounded", () => {
    const implemented = PUBLIC_ENDPOINTS;
    const tools = implemented.map((endpoint) => endpoint["tool"] as string);

    expect(new Set(tools).size).toBe(tools.length);
    for (const [endpoint, tool] of implemented.map(
      (endpoint, index) => [endpoint, tools[index]!] as const,
    )) {
      expect(TOOL_NAME_RE.test(tool)).toBe(true);
      expect(tool.startsWith(`${endpoint["provider"]}_`)).toBe(true);
      expect(tool.length <= 128).toBe(true);
    }
  });

  it("test_manifest_is_get_only_and_matches_pinned_snapshots", async () => {
    expect(ENDPOINTS.every((endpoint) => endpoint["method"] === "GET")).toBe(true);
    // ponytail: _checkManifest ainda não é exportado por catalogo.ts (é o _check_manifest
    // privado do python); acesso isolado aqui para não derrubar o arquivo inteiro.
    const catalogo = (await import("../src/features/catalogo/catalogo.js")) as unknown as {
      _checkManifest?: (path: string, compras?: string, pncp?: string) => Promise<number>;
    };
    expect(catalogo._checkManifest).toBeTypeOf("function");
    expect(await catalogo._checkManifest!(MANIFEST_PATH, COMPRAS_SNAPSHOT, PNCP_SNAPSHOT)).toBe(0);
  });

  it.each(ENDPOINTS)("test_every_manifest_endpoint_is_get [$id]", (endpoint) => {
    expect(endpoint["method"]).toBe("GET");
  });

  it("test_read_only_http_client_has_no_write_methods", () => {
    const prototype = ReadOnlyHttpClient.prototype as unknown as Rec;
    const constructor = ReadOnlyHttpClient as unknown as Rec;
    for (const method of ["post", "put", "patch", "delete"]) {
      expect(prototype[method]).toBeUndefined();
      expect(constructor[method]).toBeUndefined();
    }
  });

  it("test_server_registers_every_public_manifest_tool", async () => {
    const expected = new Set(PUBLIC_ENDPOINTS.map((endpoint) => endpoint["tool"] as string));
    const client = await manifestClientInstance();
    const registered = new Set((await client.listTools()).tools.map((tool) => tool.name));

    for (const tool of expected) expect(registered.has(tool)).toBe(true);
  });

  it.each(PUBLIC_ENDPOINTS)(
    "test_public_manifest_tool_has_registry_metadata [$id]",
    async (endpoint) => {
      const client = await manifestClientInstance();
      const tools = toolsByName(await client.listTools());
      const tool = tools.get(endpoint["tool"] as string);

      expect(tool).toBeDefined();
      expect(tool!.description).toBe(endpoint["description"]);
      const parameters = (endpoint["parameters"] as Rec[] | undefined) ?? [];
      const manifestNames = pathQueryNames(endpoint);
      const requiredNames = new Set(
        parameters
          .filter(
            (parameter) =>
              parameter["required"] === true &&
              (parameter["in"] === "path" || parameter["in"] === "query"),
          )
          .map((parameter) => parameter["name"] as string),
      );
      const schema = tool!.inputSchema as unknown as Rec;
      const properties = schema["properties"] as Record<string, Rec>;

      expect(schema["type"]).toBe("object");
      for (const name of manifestNames) expect(Object.hasOwn(properties, name)).toBe(true);
      expect(new Set(schema["required"] as string[] | undefined)).toEqual(requiredNames);
      for (const name of requiredNames) expect(Object.hasOwn(properties, name)).toBe(true);
      for (const parameter of parameters) {
        if (parameter["in"] !== "path" && parameter["in"] !== "query") continue;
        const documentedSchema = (parameter["schema"] as Rec | undefined) ?? { type: "string" };
        const registeredSchema = properties[parameter["name"] as string]!;
        expect(typeof documentedSchema).toBe("object");
        for (const [key, value] of Object.entries(documentedSchema)) {
          expect(registeredSchema[key]).toEqual(value);
        }
      }
    },
  );

  it("test_public_manifest_tools_have_separate_service_controls", async () => {
    const client = await manifestClientInstance();
    const tools = toolsByName(await client.listTools());
    const pageNames = new Set(["pagina", "page"]);
    const pageSizeNames = new Set(["tamanhoPagina", "tamanho_pagina", "pageSize", "page_size"]);
    const tokenNames = new Set([
      "pageToken",
      "page_token",
      "cursor",
      "cursorToken",
      "continuationToken",
      "nextToken",
      "token",
    ]);
    const intersects = (names: Set<string>, other: Set<string>) =>
      [...names].some((name) => other.has(name));

    for (const endpoint of PUBLIC_ENDPOINTS) {
      const tool = tools.get(endpoint["tool"] as string);
      expect(tool).toBeDefined();
      const manifestNames = pathQueryNames(endpoint);
      const properties = (tool!.inputSchema as unknown as Rec)["properties"] as Record<
        string,
        Rec
      >;
      const hasPagination = intersects(
        manifestNames,
        new Set([...pageNames, ...pageSizeNames, ...tokenNames]),
      );

      expect(Object.hasOwn(properties, "formato")).toBe(true);
      expect(Object.hasOwn(properties, "limite_resultados")).toBe(hasPagination);
      expect(Object.hasOwn(properties, "auto_paginar")).toBe(
        intersects(manifestNames, new Set([...pageNames, ...tokenNames])),
      );
    }
  });

  it.each(AUTHENTICATED_ENDPOINTS)(
    "test_authenticated_manifest_endpoint_is_absent_from_registry [$id]",
    async (endpoint) => {
      const client = await manifestClientInstance();
      const descriptions = new Set((await client.listTools()).tools.map((tool) => tool.description));

      expect(endpoint["implemented"]).toBe(false);
      expect(endpoint["tool"]).toBeNull();
      expect(endpoint["exclusion"]).toEqual({ reason: "authentication_required" });
      expect(descriptions.has(endpoint["description"] as string)).toBe(false);
    },
  );

  it("test_query_service_and_mcp_tool_contract_has_envelope_provenance_and_error_shape", async () => {
    const operation = OperationSchema.parse(
      ENDPOINTS.find((endpoint) => endpoint["id"] === "pncp.GET./v1/modalidades"),
    );
    // Response é de uso único: handlers de função criam um por chamada (paridade com respx)
    const stub = stubFetch(
      [
        "https://pncp.gov.br/api/pncp/v1/modalidades-error",
        () => jsonResponse({ message: "invalid query" }, 400),
      ],
      [
        /^https:\/\/pncp\.gov\.br\/api\/pncp\/v1\/modalidades$/,
        () => jsonResponse([{ codigo: 1 }]),
      ],
    );
    const errorOperation: Operation = {
      ...operation,
      id: "pncp.GET./v1/modalidades-error",
      path: "/v1/modalidades-error",
    };
    const service = new QueryService({
      settings: { cache_enabled: false } as unknown as Settings,
      pncpFactory: () => ({
        client: (opts) =>
          new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", {
            maxRetries: 0,
            maxDocumentBytes: opts?.maxDocumentBytes ?? 25_000_000,
            provider: "pncp",
            fetchImpl: stub.fetchImpl,
          }),
        normalizePage: (payload) => ({ items: payload, pagination: {} }),
      }),
    });

    const response = await service.execute(operation, {});

    expect(response.source).toBe("pncp");
    expect(response.endpoint).toBe("/v1/modalidades");
    expect(response.query).toEqual({});
    expect(response.data).toEqual([{ codigo: 1 }]);
    expect(response.metadata["pagination"]).toEqual({});
    expect(typeof response.metadata["retrieved_at"]).toBe("string");
    expect(
      stub.calls.filter((call) => /^https:\/\/pncp\.gov\.br\/api\/pncp\/v1\/modalidades$/.test(call.url)),
    ).toHaveLength(1);

    const error: UpstreamError = await service
      .execute(errorOperation, {})
      .then(() => {
        throw new Error("UpstreamError esperado");
      })
      .catch((caught: unknown) => caught as UpstreamError);
    expect(error).toBeInstanceOf(UpstreamError);

    const expectedError = {
      provider: "pncp",
      type: "UPSTREAM_BAD_REQUEST",
      status: 400,
      message: '{"message":"invalid query"}',
      upstream_message: '{"message":"invalid query"}',
      retryable: false,
    };
    // message "cru" do python vive em upstreamMessage; Error.message carrega o prefixo
    // "KIND: " que no python é só o str(error)
    expect({
      provider: error.provider,
      type: error.kind,
      status: error.status,
      upstream_message: error.upstreamMessage,
      retryable: error.retryable,
    }).toEqual({ ...expectedError, message: undefined });
    expect(error.message).toBe(`UPSTREAM_BAD_REQUEST: ${expectedError.message}`);

    const tempDir = mkdtempSync(join(tmpdir(), "contracts-"));
    const errorManifest = join(tempDir, "error-endpoint.yaml");
    writeFileSync(errorManifest, stringify({ endpoints: [errorOperation] }), "utf-8");

    // respx.mock é global ao teste: o QueryService interno do servidor também vê o stub
    const previousFetch = globalThis.fetch;
    globalThis.fetch = stub.fetchImpl;
    let toolResult!: Awaited<ReturnType<Client["callTool"]>>;
    try {
      const client = await connectedClient(errorManifest);
      toolResult = await client.callTool({ name: errorOperation.tool as string, arguments: {} });
    } finally {
      globalThis.fetch = previousFetch;
    }

    expect((toolResult as { structuredContent?: unknown }).structuredContent).toEqual({
      error: expectedError,
    });
    expect({
      kind: error.kind,
      status: error.status,
      provider: error.provider,
      endpoint: error.endpoint,
    }).toEqual({
      kind: "UPSTREAM_BAD_REQUEST",
      status: 400,
      provider: "pncp",
      endpoint: "/v1/modalidades-error",
    });
    expect(String(error)).toContain("invalid query");
    expect(
      stub.calls.filter((call) => call.url.includes("/v1/modalidades-error")),
    ).toHaveLength(2);
  });
});
