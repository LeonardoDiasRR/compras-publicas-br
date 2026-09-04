import httpx
import pytest
import respx
from src.shared.http_readonly import ReadOnlyHttpClient, UpstreamError
from src.shared.runtime import TtlCache


@respx.mock
async def test_client_only_requests_an_allowlisted_relative_get():
    route = respx.get("https://pncp.gov.br/api/pncp/v1/modalidades").mock(
        return_value=httpx.Response(200, json=[{"codigo": 1}])
    )
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp") as client:
        assert await client.get("/v1/modalidades") == [{"codigo": 1}]
    assert route.call_count == 1


@respx.mock
async def test_client_resolves_relative_path_against_configured_pncp_origin():
    route = respx.get("https://pncp.gov.br/api/pncp/v1/modos-disputas").mock(
        return_value=httpx.Response(200, json=[{"codigo": 2}])
    )
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp") as client:
        assert await client.get("/v1/modos-disputas") == [{"codigo": 2}]
    assert route.call_count == 1
    assert route.calls[0].request.url == httpx.URL(
        "https://pncp.gov.br/api/pncp/v1/modos-disputas"
    )


@respx.mock
async def test_client_rejects_absolute_url():
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp") as client:
        with pytest.raises(ValueError, match="relative"):
            await client.get("https://example.com/private")


@respx.mock
@pytest.mark.parametrize("path", ["//example.com/private", "../private"])
async def test_client_rejects_unsafe_relative_paths(path):
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp") as client:
        with pytest.raises(ValueError, match="relative"):
            await client.get(path)


@respx.mock
async def test_client_does_not_retry_not_found():
    route = respx.get("https://pncp.gov.br/api/pncp/v1/modalidades/999").mock(
        return_value=httpx.Response(404, json={"message": "not found"})
    )
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", max_retries=3) as client:
        with pytest.raises(UpstreamError, match="NOT_FOUND"):
            await client.get("/v1/modalidades/999")
    assert route.call_count == 1


def test_client_has_no_write_methods():
    forbidden = {"post", "put", "patch", "delete"}
    assert not (forbidden & set(dir(ReadOnlyHttpClient)))


def test_ttl_cache_expires_entries(monkeypatch):
    cache = TtlCache()
    cache.put("key", "value", ttl_seconds=1)
    assert cache.get("key") == "value"
    monkeypatch.setattr("src.shared.runtime.time.monotonic", lambda: float("inf"))
    assert cache.get("key") is None
