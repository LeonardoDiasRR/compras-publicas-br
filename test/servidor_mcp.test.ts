import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { buildServer } from "../src/features/mcp/servidor.js";

let client: Client | null = null;
let server: { close(): Promise<void> } | null = null;

afterEach(async () => {
  if (client) await client.close();
  if (server) await server.close();
  client = null;
  server = null;
});

async function connectServer(manifestPath?: string | null): Promise<Client> {
  const srv = buildServer(manifestPath ?? undefined) as unknown as {
    connect(transport: InMemoryTransport): Promise<void>;
    close(): Promise<void>;
  };
  server = srv;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await srv.connect(serverTransport);
  const c = new Client({ name: "test-client", version: "0.0.0" });
  await c.connect(clientTransport);
  client = c;
  return c;
}

function toolData(result: unknown): unknown {
  const r = result as {
    structuredContent?: unknown;
    content?: { type: string; text?: string }[];
  };
  if (r.structuredContent !== undefined) return r.structuredContent;
  return JSON.parse(r.content[0].text as string);
}

describe("servidor_mcp", () => {
  it("server_registers_one_atomic_tool_per_implemented_public_operation", async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "servidor-")), "endpoints.yaml");
    writeFileSync(
      file,
      "endpoints:\n" +
        "  - id: pncp.GET./v1/modalidades\n" +
        "    provider: pncp\n" +
        "    method: GET\n" +
        "    path: /v1/modalidades\n" +
        "    classification: PUBLIC_USEFUL\n" +
        "    implemented: true\n" +
        "    tool: pncp_listar_modalidades\n" +
        "    description: Lista modalidades de contratação publicadas pelo PNCP.\n" +
        "  - id: pncp.GET./v1/usuarios/{id}\n" +
        "    provider: pncp\n" +
        "    method: GET\n" +
        "    path: /v1/usuarios/{id}\n" +
        "    classification: AUTHENTICATED\n" +
        "    implemented: false\n" +
        "    tool: pncp_obter_usuario\n" +
        "    description: Consulta um usuario autenticado.\n",
      "utf-8",
    );

    const srv = buildServer(file) as unknown as {
      removeTool(name: string): void;
      registerTool(
        name: string,
        spec: { description: string; inputSchema: Record<string, unknown> },
        handler: () => Promise<Record<string, string>>,
      ): void;
      connect(transport: InMemoryTransport): Promise<void>;
      close(): Promise<void>;
    };
    srv.removeTool("verificar_saude_fontes");
    srv.registerTool(
      "verificar_saude_fontes",
      { description: "fake health probe", inputSchema: { type: "object", properties: {} } },
      async () => ({ compras: "operational", pncp: "configured" }),
    );
    server = srv;

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await srv.connect(serverTransport);
    const c = new Client({ name: "test-client", version: "0.0.0" });
    await c.connect(clientTransport);
    client = c;

    const tools = await c.listTools();
    const toolNames = new Set(tools.tools.map((tool) => tool.name));
    expect(toolNames).toEqual(
      new Set(["pncp_listar_modalidades", "listar_capacidades_mcp", "verificar_saude_fontes"]),
    );
    expect(tools.tools).toHaveLength(3);
    expect(toolNames.has("pncp_obter_usuario")).toBe(false);

    const capabilities = toolData(await c.callTool({ name: "listar_capacidades_mcp", arguments: {} }));
    expect((capabilities as { sources: string[] }).sources).toEqual(["compras", "pncp"]);
    expect((capabilities as { atomic_tools: number }).atomic_tools).toBe(1);

    const health = toolData(await c.callTool({ name: "verificar_saude_fontes", arguments: {} }));
    expect(health).toEqual({ compras: "operational", pncp: "configured" });
  });

  it("server_exposes_coverage_resource", async () => {
    const c = await connectServer(null);

    const resources = await c.listResources();
    const uris = new Set(resources.resources.map((resource) => String(resource.uri)));
    expect(uris.has("mcp://coverage")).toBe(true);

    const coverage = await c.readResource({ uri: "mcp://coverage" });
    const contents = coverage.contents as { text?: string }[];
    expect((JSON.parse(contents[0].text as string) as { public_endpoints: number }).public_endpoints).toBe(0);
  });
});
