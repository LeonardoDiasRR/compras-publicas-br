from pathlib import Path
from typing import Any, cast

import pytest
import yaml
from fastmcp import Client

from src.features.catalogo.catalogo import TOOL_NAME_RE, _check_manifest, render_coverage
from src.features.mcp.servidor import build_server
from src.shared.http_readonly import ReadOnlyHttpClient

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPOSITORY_ROOT / "coverage" / "endpoints.yaml"
COMPRAS_SNAPSHOT = REPOSITORY_ROOT / "specs" / "upstream" / "compras" / "2026-09-04.json"
PNCP_SNAPSHOT = REPOSITORY_ROOT / "specs" / "upstream" / "pncp" / "2026-09-04.json"
MANIFEST = cast(dict[str, Any], yaml.safe_load(MANIFEST_PATH.read_text(encoding="utf-8")))
ENDPOINTS = cast(list[dict[str, Any]], MANIFEST["endpoints"])


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
