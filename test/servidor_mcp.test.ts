import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildServer } from "../src/features/mcp/servidor.js";
import { jsonResponse, stubFetch } from "./support/stub_fetch.js";

let client: Client | null = null;
let server: { close(): Promise<void> } | null = null;

afterEach(async () => {
  if (client) await client.close();
  if (server) await server.close();
  client = null;
  server = null;
  vi.unstubAllGlobals();
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

const BUSCAR_TOOL = "pncp_buscar_contratacao_por_numero_ano_uasg";
const LOOKUP_PATH = "/modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id";
const SCAN_PATH = "/modulo-contratacoes/1_consultarContratacoes_PNCP_14133";

function buscaManifest(): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "buscar-")), "endpoints.yaml");
  writeFileSync(
    file,
    "endpoints:\n" +
      "  - id: compras.GET." + LOOKUP_PATH + "\n" +
      "    provider: compras\n" +
      "    method: GET\n" +
      "    path: " + LOOKUP_PATH + "\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: compras_lookup_contratacoes\n" +
      "    description: Consulta contratação por numeroControlePNCP.\n" +
      "    parameters:\n" +
      "      - name: tipo\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: codigo\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "  - id: compras.GET." + SCAN_PATH + "\n" +
      "    provider: compras\n" +
      "    method: GET\n" +
      "    path: " + SCAN_PATH + "\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: compras_listar_contratacoes\n" +
      "    description: Consulta contratações por período e unidade.\n" +
      "    parameters:\n" +
      "      - name: pagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: tamanhoPagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: unidadeOrgaoCodigoUnidade\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: codigoModalidade\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: dataPublicacaoPncpInicial\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: dataPublicacaoPncpFinal\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n",
    "utf-8",
  );
  return file;
}

const MATCH_RECORD = {
  numeroControlePNCP: "200350_90010_2025",
  orgaoEntidadeCnpj: "00394460000141",
  anoCompraPncp: 2025,
  sequencialCompraPncp: 123,
  numeroCompra: "90010",
  unidadeOrgaoCodigoUnidade: "200350",
  objetoCompra: "Registro de preços de TI",
};

describe("pncp_buscar_contratacao_por_numero_ano_uasg", () => {
  it("resolve_código_pncp_pelo_numero_controle_sem_varredura", async () => {
    const { fetchImpl, calls } = stubFetch([
      /1\.1_consultarContratacoes_PNCP_14133_Id/,
      jsonResponse({ resultado: [MATCH_RECORD], totalRegistros: 1 }),
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(buscaManifest());

    const data = toolData(
      await c.callTool({
        name: BUSCAR_TOOL,
        arguments: { numero: "90010/2025", ano: 2025, uasg: "200350" },
      }),
    ) as {
      found: boolean;
      lookup: string;
      codigo_consultado: string;
      contratacoes: { sequencial_contratacao: number; cnpj: string }[];
      proximo_passo: { ferramenta: string; argumentos: Record<string, unknown> };
    };
    expect(data.found).toBe(true);
    expect(data.lookup).toBe("numeroControlePNCPCompra");
    expect(data.codigo_consultado).toBe("200350_90010_2025");
    expect(data.contratacoes[0].sequencial_contratacao).toBe(123);
    expect(data.proximo_passo.argumentos).toEqual({
      cnpj: "00394460000141",
      ano: 2025,
      sequencial_contratacao: 123,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("tipo=numeroControlePNCPCompra");
    expect(calls[0].url).toContain("codigo=200350_90010_2025");
  });

  it("recusa_numero_com_ano_conflitante", async () => {
    const c = await connectServer(buscaManifest());
    const result = await c.callTool({
      name: BUSCAR_TOOL,
      arguments: { numero: "90010/2024", ano: 2025, uasg: "200350" },
    });
    expect(result.isError).toBe(true);
    const text = JSON.stringify(result);
    expect(text).toContain("conflicts");
  });

  it("varre_por_uasg_com_modalidade_quando_numero_controle_nao_existe", async () => {
    const scanPage = (url: URL): Response =>
      url.searchParams.get("pagina") === "2"
        ? jsonResponse({
            resultado: [MATCH_RECORD],
            totalRegistros: 2,
            totalPaginas: 2,
            numeroPagina: 2,
            tamanhoPagina: 1,
          })
        : jsonResponse({
            resultado: [{ ...MATCH_RECORD, numeroCompra: "90011" }],
            totalRegistros: 2,
            totalPaginas: 2,
            numeroPagina: 1,
            tamanhoPagina: 1,
          });
    const { fetchImpl, calls } = stubFetch(
      [/1\.1_consultarContratacoes_PNCP_14133_Id/, jsonResponse({ resultado: [], totalRegistros: 0 })],
      [/modulo-contratacoes\/1_consultarContratacoes_PNCP_14133/, scanPage],
    );
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(buscaManifest());

    const data = toolData(
      await c.callTool({
        name: BUSCAR_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350", modalidade: 650 },
      }),
    ) as { found: boolean; lookup: string; contratacoes: { numero_compra: string }[] };
    expect(data.found).toBe(true);
    expect(data.lookup).toBe("varredura_uasg");
    expect(data.contratacoes).toHaveLength(1);
    expect(data.contratacoes[0].numero_compra).toBe("90010");
    const scanCalls = calls.filter((call) => !call.url.includes("1.1_consultar"));
    expect(scanCalls).toHaveLength(2);
    expect(scanCalls[0].url).toContain("dataPublicacaoPncpInicial=2025-01-01");
    expect(scanCalls[0].url).toContain("unidadeOrgaoCodigoUnidade=200350");
  });

  it("sem_modalidade_devolve_found_false_sem_varrer", async () => {
    const { fetchImpl, calls } = stubFetch([
      /1\.1_consultarContratacoes_PNCP_14133_Id/,
      jsonResponse({ resultado: [], totalRegistros: 0 }),
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(buscaManifest());

    const data = toolData(
      await c.callTool({
        name: BUSCAR_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350" },
      }),
    ) as { found: boolean; mensagem: string };
    expect(data.found).toBe(false);
    expect(data.mensagem).toContain("modalidade");
    expect(calls).toHaveLength(1);
  });

  it("erro_de_upstream_vira_envelope_e_nao_lista_vazia", async () => {
    const { fetchImpl } = stubFetch([
      /1\.1_consultarContratacoes_PNCP_14133_Id/,
      jsonResponse({ erro: "boom" }, 500),
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(buscaManifest());

    const data = toolData(
      await c.callTool({
        name: BUSCAR_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350" },
      }),
    ) as { error?: { type: string; status: number } };
    expect(data.error).toBeDefined();
    expect(data.error?.status).toBe(500);
  });
});

const DOCUMENTOS_TOOL = "pncp_listar_documentos_contratacao_por_numero_ano_uasg";
const ARPS_TOOL = "pncp_listar_arps_contratacao_por_numero_ano_uasg";

function recursosManifest(): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "recursos-")), "endpoints.yaml");
  writeFileSync(
    file,
    "endpoints:\n" +
      "  - id: compras.GET." + LOOKUP_PATH + "\n" +
      "    provider: compras\n" +
      "    method: GET\n" +
      "    path: " + LOOKUP_PATH + "\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: compras_lookup_contratacoes\n" +
      "    description: Consulta contratação por numeroControlePNCP.\n" +
      "    parameters:\n" +
      "      - name: tipo\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: codigo\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "  - id: compras.GET." + SCAN_PATH + "\n" +
      "    provider: compras\n" +
      "    method: GET\n" +
      "    path: " + SCAN_PATH + "\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: compras_listar_contratacoes\n" +
      "    description: Consulta contratações por período e unidade.\n" +
      "    parameters:\n" +
      "      - name: pagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: tamanhoPagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: unidadeOrgaoCodigoUnidade\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: codigoModalidade\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: dataPublicacaoPncpInicial\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: dataPublicacaoPncpFinal\n" +
      "        in: query\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "  - id: pncp.GET./v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos\n" +
      "    provider: pncp\n" +
      "    method: GET\n" +
      "    path: /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: pncp_arquivos_fixture\n" +
      "    description: Lista os documentos da contratação.\n" +
      "    parameters:\n" +
      "      - name: cnpj\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: ano\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: sequencial\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: pagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: tamanhoPagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "  - id: pncp.GET./v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas\n" +
      "    provider: pncp\n" +
      "    method: GET\n" +
      "    path: /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas\n" +
      "    classification: PUBLIC_USEFUL\n" +
      "    implemented: true\n" +
      "    tool: pncp_atas_fixture\n" +
      "    description: Lista as atas da contratação.\n" +
      "    parameters:\n" +
      "      - name: cnpj\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: string\n" +
      "      - name: anoCompra\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: sequencialCompra\n" +
      "        in: path\n" +
      "        required: true\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: pagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n" +
      "      - name: tamanhoPagina\n" +
      "        in: query\n" +
      "        required: false\n" +
      "        schema:\n" +
      "          type: integer\n",
    "utf-8",
  );
  return file;
}

const DOCUMENTOS_FIXTURE = [
  {
    sequencialDocumento: 1,
    tipoDocumentoId: 4,
    tipoDocumentoNome: "Edital",
    titulo: "edital.pdf",
    url: "https://pncp/edital.pdf",
    uri: "https://pncp/doc/1",
    statusAtivo: true,
    dataPublicacaoPncp: "2025-01-10T08:00:00",
  },
  {
    sequencialDocumento: 2,
    tipoDocumentoId: 3,
    tipoDocumentoNome: "Termo de Referência",
    titulo: "tr.pdf",
    url: "https://pncp/tr.pdf",
    uri: "https://pncp/doc/2",
    statusAtivo: true,
    dataPublicacaoPncp: "2025-01-10T08:00:00",
  },
  {
    sequencialDocumento: 3,
    tipoDocumentoId: 4,
    tipoDocumentoNome: "1º Termo de Apostilamento do Edital",
    titulo: "apostilamento.pdf",
    url: "https://pncp/apost.pdf",
    uri: "https://pncp/doc/3",
    statusAtivo: true,
    dataPublicacaoPncp: "2025-02-01T08:00:00",
  },
];

const ARP_FIXTURE = {
  numeroAtaRegistroPreco: "00123/2025",
  anoAta: 2025,
  sequencialAta: 7,
  numeroControlePNCP: "200350_123_2025",
  dataAssinatura: "2025-03-01",
  dataVigenciaFim: "2026-03-01",
  cancelado: false,
  objetoCompra: "Ata de registro de preços de TI",
  possibilidadeAdesao: true,
};

function stubResolveRapido(documentosOuAtas: [RegExp | string, Response | ((url: URL, init: RequestInit) => Response)][]) {
  return stubFetch(
    [/1\.1_consultarContratacoes_PNCP_14133_Id/, () => jsonResponse({ resultado: [MATCH_RECORD], totalRegistros: 1 })],
    ...documentosOuAtas,
  );
}

describe("pncp_listar_documentos_contratacao_por_numero_ano_uasg", () => {
  it("resolve_identificadores_e_lista_todos_os_documentos", async () => {
    const { fetchImpl, calls } = stubResolveRapido([
      [/compras\/\d+\/\d+\/arquivos/, () => jsonResponse(DOCUMENTOS_FIXTURE)],
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const data = toolData(
      await c.callTool({
        name: DOCUMENTOS_TOOL,
        arguments: { numero: "90010/2025", ano: 2025, uasg: "200350" },
      }),
    ) as {
      found: boolean;
      source: string;
      contratacoes: { documentos: { sequencial_documento: number }[]; proximo_passo: { ferramenta: string } };
    };
    expect(data.found).toBe(true);
    expect(data.contratacoes[0].documentos).toHaveLength(3);
    expect(data.contratacoes[0].documentos[0].sequencial_documento).toBe(1);
    expect(data.contratacoes[0].proximo_passo.ferramenta).toBe(
      "pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial_sequencialdocumento",
    );
    expect(calls.some((call) => call.url.includes("/compras/2025/123/arquivos"))).toBe(true);
  });

  it("filtra_por_tipo_com_igualdade_normalizada_preferida", async () => {
    const { fetchImpl } = stubResolveRapido([
      [/compras\/\d+\/\d+\/arquivos/, () => jsonResponse(DOCUMENTOS_FIXTURE)],
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const data = toolData(
      await c.callTool({
        name: DOCUMENTOS_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350", tipo_documento: "edital " },
      }),
    ) as {
      contratacoes: { documentos: { titulo: string }[]; tipos_disponiveis: string[] };
    };
    expect(data.contratacoes[0].documentos).toHaveLength(1);
    expect(data.contratacoes[0].documentos[0].titulo).toBe("edital.pdf");
    expect(data.contratacoes[0].tipos_disponiveis).toContain("Termo de Referência");
  });

  it("substring_unico_match_e_ambiguidade_devolve_lista_vazia_com_tipos", async () => {
    const { fetchImpl } = stubResolveRapido([
      [/compras\/\d+\/\d+\/arquivos/, () => jsonResponse(DOCUMENTOS_FIXTURE)],
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const unico = toolData(
      await c.callTool({
        name: DOCUMENTOS_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350", tipo_documento: "referencia" },
      }),
    ) as { contratacoes: { documentos: { titulo: string }[] } };
    expect(unico.contratacoes[0].documentos).toHaveLength(1);
    expect(unico.contratacoes[0].documentos[0].titulo).toBe("tr.pdf");

    const ambiguo = toolData(
      await c.callTool({
        name: DOCUMENTOS_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350", tipo_documento: "termo" },
      }),
    ) as { contratacoes: { documentos: unknown[]; tipos_disponiveis: string[] } };
    expect(ambiguo.contratacoes[0].documentos).toHaveLength(0);
    expect(ambiguo.contratacoes[0].tipos_disponiveis).toHaveLength(3);
  });
});

describe("pncp_listar_arps_contratacao_por_numero_ano_uasg", () => {
  it("lista_arps_da_contratacao", async () => {
    const { fetchImpl, calls } = stubResolveRapido([
      [/compras\/\d+\/\d+\/atas/, jsonResponse({ data: [ARP_FIXTURE], totalRegistros: 1 })],
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const data = toolData(
      await c.callTool({
        name: ARPS_TOOL,
        arguments: { numero: "90010/2025", ano: 2025, uasg: "200350" },
      }),
    ) as {
      found: boolean;
      contratacoes: { arps: { numero_ata: string; sequencial_ata: number }[] };
      proximo_passo?: never;
    };
    expect(data.found).toBe(true);
    expect(data.contratacoes[0].arps[0].numero_ata).toBe("00123/2025");
    expect(calls.some((call) => call.url.includes("/compras/2025/123/atas"))).toBe(true);
  });

  it("contratacao_sem_atas_devolve_found_false_com_mensagem_propria", async () => {
    const { fetchImpl } = stubResolveRapido([
      [/compras\/\d+\/\d+\/atas/, jsonResponse({ data: [], totalRegistros: 0 })],
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const data = toolData(
      await c.callTool({
        name: ARPS_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350" },
      }),
    ) as { found: boolean; mensagem: string; contratacoes: { arps: unknown[] }[] };
    expect(data.found).toBe(false);
    expect(data.mensagem).toContain("sem atas");
    expect(data.contratacoes[0].arps).toHaveLength(0);
  });

  it("contratacao_nao_localizada_propaga_mensagem_do_resolver", async () => {
    const { fetchImpl, calls } = stubFetch([
      /1\.1_consultarContratacoes_PNCP_14133_Id/,
      jsonResponse({ resultado: [], totalRegistros: 0 }),
    ]);
    vi.stubGlobal("fetch", fetchImpl);
    const c = await connectServer(recursosManifest());

    const data = toolData(
      await c.callTool({
        name: DOCUMENTOS_TOOL,
        arguments: { numero: "90010", ano: 2025, uasg: "200350" },
      }),
    ) as { found: boolean; mensagem: string };
    expect(data.found).toBe(false);
    expect(data.mensagem).toContain("modalidade");
    expect(calls).toHaveLength(1);
  });
});
