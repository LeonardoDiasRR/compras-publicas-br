import json

import pytest
from fastmcp import Client
from src.features.mcp.servidor import build_server


@pytest.mark.asyncio
async def test_server_registers_one_atomic_tool_per_implemented_public_operation(tmp_path):
    manifest = tmp_path / "endpoints.yaml"
    manifest.write_text(
        "endpoints:\n"
        "  - id: pncp.GET./v1/modalidades\n"
        "    provider: pncp\n"
        "    method: GET\n"
        "    path: /v1/modalidades\n"
        "    classification: PUBLIC_USEFUL\n"
        "    implemented: true\n"
        "    tool: pncp_listar_modalidades\n"
        "    description: Lista modalidades de contratação publicadas pelo PNCP.\n"
        "  - id: pncp.GET./v1/usuarios/{id}\n"
        "    provider: pncp\n"
        "    method: GET\n"
        "    path: /v1/usuarios/{id}\n"
        "    classification: AUTHENTICATED\n"
        "    implemented: false\n"
        "    tool: pncp_obter_usuario\n"
        "    description: Consulta um usuario autenticado.\n",
        encoding="utf-8",
    )
    server = build_server(manifest)
    server.remove_tool("verificar_saude_fontes")

    @server.tool(name="verificar_saude_fontes")
    async def fake_verificar_saude_fontes() -> dict[str, str]:
        return {"compras": "operational", "pncp": "configured"}

    async with Client(server) as client:
        tools = await client.list_tools()
        tool_names = {tool.name for tool in tools}
        assert tool_names == {
            "pncp_listar_modalidades",
            "listar_capacidades_mcp",
            "verificar_saude_fontes",
        }
        assert len(tools) == 3
        assert "pncp_obter_usuario" not in tool_names

        capabilities = await client.call_tool("listar_capacidades_mcp")
        assert capabilities.data["sources"] == ["compras", "pncp"]
        assert capabilities.data["atomic_tools"] == 1

        health = await client.call_tool("verificar_saude_fontes")
        assert health.data == {"compras": "operational", "pncp": "configured"}


@pytest.mark.asyncio
async def test_server_exposes_coverage_resource():
    server = build_server(None)
    async with Client(server) as client:
        resources = await client.list_resources()
        assert "mcp://coverage" in {str(resource.uri) for resource in resources}

        coverage = await client.read_resource("mcp://coverage")
        assert json.loads(coverage[0].text)["public_endpoints"] == 0
