from pathlib import Path
from types import SimpleNamespace
from typing import Any, cast

import httpx
import pytest
import respx
import yaml
from fastmcp import Client

from src.features.catalogo.catalogo import (
    TOOL_NAME_RE,
    _check_manifest,
    render_coverage,
)
from src.features.catalogo.models import Operation
from src.features.consultas.servico import QueryService
from src.features.mcp.servidor import build_server
from src.shared.http_readonly import ReadOnlyHttpClient, UpstreamError

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPOSITORY_ROOT / "coverage" / "endpoints.yaml"
COMPRAS_SNAPSHOT = REPOSITORY_ROOT / "specs" / "upstream" / "compras" / "2026-09-04.json"
PNCP_SNAPSHOT = REPOSITORY_ROOT / "specs" / "upstream" / "pncp" / "2026-09-04.json"
MANIFEST = cast(dict[str, Any], yaml.safe_load(MANIFEST_PATH.read_text(encoding="utf-8")))
ENDPOINTS = cast(list[dict[str, Any]], MANIFEST["endpoints"])
PUBLIC_ENDPOINTS = [
    endpoint
    for endpoint in ENDPOINTS
    if endpoint.get("classification") == "PUBLIC_USEFUL"
    and endpoint.get("implemented") is True
]
AUTHENTICATED_ENDPOINTS = [
    endpoint for endpoint in ENDPOINTS if endpoint.get("classification") == "AUTHENTICATED"
]


@pytest.fixture(scope="module")
def manifest_server():
    return build_server(MANIFEST_PATH)


class FakeProvider:
    @staticmethod
    def normalize_page(payload: Any) -> dict[str, Any]:
        return {"items": payload, "pagination": {}}

    def client(self, *, max_document_bytes: int | None = None) -> ReadOnlyHttpClient:
        return ReadOnlyHttpClient(
            "https://pncp.gov.br/api/pncp",
            max_retries=0,
            max_document_bytes=(
                25_000_000 if max_document_bytes is None else max_document_bytes
            ),
            provider="pncp",
        )


def test_manifest_has_complete_public_coverage_and_no_unknown_classifications():
    report = render_coverage(ENDPOINTS)

    assert report.ratio == 1.0
    assert not [endpoint for endpoint in ENDPOINTS if endpoint.get("classification") == "UNKNOWN"]


def test_implemented_public_tools_are_unique_valid_provider_prefixed_and_bounded():
    implemented = [
        endpoint
        for endpoint in ENDPOINTS
        if endpoint.get("classification") == "PUBLIC_USEFUL"
        and endpoint.get("implemented") is True
    ]
    tools = [cast(str, endpoint["tool"]) for endpoint in implemented]

    assert len(tools) == len(set(tools))
    for endpoint, tool in zip(implemented, tools, strict=True):
        assert TOOL_NAME_RE.fullmatch(tool)
        assert tool.startswith(f"{endpoint['provider']}_")
        assert len(tool) <= 128


def test_manifest_is_get_only_and_matches_pinned_snapshots():
    assert all(endpoint.get("method") == "GET" for endpoint in ENDPOINTS)
    assert _check_manifest(MANIFEST_PATH, COMPRAS_SNAPSHOT, PNCP_SNAPSHOT) == 0


@pytest.mark.parametrize("endpoint", ENDPOINTS, ids=lambda endpoint: endpoint["id"])
def test_every_manifest_endpoint_is_get(endpoint):
    assert endpoint["method"] == "GET"


def test_read_only_http_client_has_no_write_methods():
    assert not ({"post", "put", "patch", "delete"} & set(dir(ReadOnlyHttpClient)))


@pytest.mark.asyncio
async def test_server_registers_every_public_manifest_tool():
    expected = {
        cast(str, endpoint["tool"])
        for endpoint in ENDPOINTS
        if endpoint.get("classification") == "PUBLIC_USEFUL"
        and endpoint.get("implemented") is True
    }
    server = build_server(MANIFEST_PATH)

    async with Client(server) as client:
        registered = {tool.name for tool in await client.list_tools()}

    assert expected <= registered


@pytest.mark.asyncio
@pytest.mark.parametrize("endpoint", PUBLIC_ENDPOINTS, ids=lambda endpoint: endpoint["id"])
async def test_public_manifest_tool_has_registry_metadata(endpoint, manifest_server):
    tools = {tool.name: tool for tool in await manifest_server.list_tools()}
    tool_name = cast(str, endpoint["tool"])
    tool = tools.get(tool_name)

    assert tool is not None
    assert tool.description == endpoint["description"]
    parameters = cast(list[dict[str, Any]], endpoint.get("parameters", []))
    manifest_names = {
        cast(str, parameter["name"])
        for parameter in parameters
        if parameter.get("in") in {"path", "query"}
    }
    required_names = {
        cast(str, parameter["name"])
        for parameter in parameters
        if parameter.get("required") is True and parameter.get("in") in {"path", "query"}
    }
    schema = tool.parameters
    properties = cast(dict[str, Any], schema["properties"])

    assert schema["type"] == "object"
    assert manifest_names <= set(properties)
    assert set(schema["required"]) == required_names
    assert required_names <= set(properties)
    for parameter in parameters:
        if parameter.get("in") not in {"path", "query"}:
            continue
        name = cast(str, parameter["name"])
        documented_schema = parameter.get("schema", {"type": "string"})
        registered_schema = cast(dict[str, Any], properties[name])
        assert isinstance(documented_schema, dict)
        for key, value in documented_schema.items():
            assert registered_schema[key] == value


@pytest.mark.asyncio
async def test_public_manifest_tools_have_separate_service_controls(manifest_server):
    tools = {tool.name: tool for tool in await manifest_server.list_tools()}
    page_names = {"pagina", "page"}
    page_size_names = {"tamanhoPagina", "tamanho_pagina", "pageSize", "page_size"}
    token_names = {
        "pageToken",
        "page_token",
        "cursor",
        "cursorToken",
        "continuationToken",
        "nextToken",
        "token",
    }

    for endpoint in PUBLIC_ENDPOINTS:
        tool = tools[cast(str, endpoint["tool"])]
        parameters = cast(list[dict[str, Any]], endpoint.get("parameters", []))
        manifest_names = {
            cast(str, parameter["name"])
            for parameter in parameters
            if parameter.get("in") in {"path", "query"}
        }
        properties = cast(dict[str, Any], tool.parameters["properties"])
        has_pagination = bool(manifest_names & (page_names | page_size_names | token_names))

        assert "formato" in properties
        assert ("limite_resultados" in properties) is has_pagination
        assert ("auto_paginar" in properties) is bool(manifest_names & (page_names | token_names))


@pytest.mark.asyncio
@pytest.mark.parametrize("endpoint", AUTHENTICATED_ENDPOINTS, ids=lambda endpoint: endpoint["id"])
async def test_authenticated_manifest_endpoint_is_absent_from_registry(endpoint, manifest_server):
    tools = await manifest_server.list_tools()
    descriptions = {tool.description for tool in tools}

    assert endpoint["implemented"] is False
    assert endpoint["tool"] is None
    assert endpoint["exclusion"] == {"reason": "authentication_required"}
    assert endpoint["description"] not in descriptions


@respx.mock
@pytest.mark.asyncio
async def test_query_service_and_mcp_tool_contract_has_envelope_provenance_and_error_shape(
    tmp_path,
):
    operation = Operation.model_validate(
        next(endpoint for endpoint in ENDPOINTS if endpoint["id"] == "pncp.GET./v1/modalidades")
    )
    success_route = respx.get("https://pncp.gov.br/api/pncp/v1/modalidades").mock(
        return_value=httpx.Response(200, json=[{"codigo": 1}])
    )
    error_operation = operation.model_copy(
        update={"id": "pncp.GET./v1/modalidades-error", "path": "/v1/modalidades-error"}
    )
    error_route = respx.get("https://pncp.gov.br/api/pncp/v1/modalidades-error").mock(
        return_value=httpx.Response(400, json={"message": "invalid query"})
    )
    service = QueryService(
        settings=SimpleNamespace(cache_enabled=False),
        pncp_factory=FakeProvider,
    )

    response = await service.execute(operation, {})

    assert response.source == "pncp"
    assert response.endpoint == "/v1/modalidades"
    assert response.query == {}
    assert response.data == [{"codigo": 1}]
    assert response.metadata["pagination"] == {}
    assert isinstance(response.metadata["retrieved_at"], str)
    assert success_route.call_count == 1

    with pytest.raises(UpstreamError) as raised:
        await service.execute(error_operation, {})

    error = raised.value
    expected_error = {
        "provider": "pncp",
        "type": "UPSTREAM_BAD_REQUEST",
        "status": 400,
        "message": '{"message":"invalid query"}',
        "upstream_message": '{"message":"invalid query"}',
        "retryable": False,
    }
    assert {
        "provider": error.provider,
        "type": error.kind,
        "status": error.status,
        "message": error.message,
        "upstream_message": error.upstream_message,
        "retryable": error.retryable,
    } == expected_error
    error_manifest = tmp_path / "error-endpoint.yaml"
    error_manifest.write_text(
        yaml.safe_dump({"endpoints": [error_operation.model_dump(mode="json")]}, sort_keys=False),
        encoding="utf-8",
    )
    async with Client(build_server(error_manifest)) as client:
        tool_result = await client.call_tool(cast(str, error_operation.tool), {})

    assert tool_result.data == {"error": expected_error}
    assert {
        "kind": error.kind,
        "status": error.status,
        "provider": error.provider,
        "endpoint": error.endpoint,
    } == {
        "kind": "UPSTREAM_BAD_REQUEST",
        "status": 400,
        "provider": "pncp",
        "endpoint": "/v1/modalidades-error",
    }
    assert "invalid query" in str(error)
    assert error_route.call_count == 2
