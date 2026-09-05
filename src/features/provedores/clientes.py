from collections.abc import Mapping
from typing import Any, cast

from src.shared.http_readonly import ReadOnlyHttpClient
from src.shared.runtime import Settings

_PAGINATION_KEYS = {
    "totalRegistros": "total_items",
    "totalPaginas": "total_pages",
    "numeroPagina": "page",
    "tamanhoPagina": "page_size",
}


def _normalize_page(payload: Any, *item_keys: str) -> dict[str, Any]:
    if isinstance(payload, list):
        return {"items": payload, "pagination": {}}

    if isinstance(payload, Mapping):
        page = cast(Mapping[str, Any], payload)
        items: Any = page
        for item_key in item_keys:
            if item_key in page:
                items = page[item_key]
                break
        pagination = {
            normalized_key: page[upstream_key]
            for upstream_key, normalized_key in _PAGINATION_KEYS.items()
            if upstream_key in page
        }
        return {"items": items, "pagination": pagination}

    return {"items": payload, "pagination": {}}


class ComprasClient:
    base_url = "https://dadosabertos.compras.gov.br"

    @staticmethod
    def normalize_page(payload: Any) -> dict[str, Any]:
        return _normalize_page(payload, "resultado", "data")

    def client(self, *, max_document_bytes: int | None = None) -> ReadOnlyHttpClient:
        if max_document_bytes is not None and max_document_bytes <= 0:
            raise ValueError("max_document_bytes must be positive")
        settings = Settings()  # pyright: ignore[reportCallIssue]
        return ReadOnlyHttpClient(
            self.base_url,
            requests_per_second=settings.http_requests_per_second,
            max_concurrency=settings.compras_max_concurrency,
            provider="compras",
            max_retries=settings.http_max_retries,
            timeout=settings.http_timeout,
            max_document_bytes=(
                settings.max_document_bytes
                if max_document_bytes is None
                else max_document_bytes
            ),
        )


class PncpClient:
    base_url = "https://pncp.gov.br/api/pncp"

    @staticmethod
    def normalize_page(payload: Any) -> dict[str, Any]:
        return _normalize_page(payload, "data")

    def client(self, *, max_document_bytes: int | None = None) -> ReadOnlyHttpClient:
        if max_document_bytes is not None and max_document_bytes <= 0:
            raise ValueError("max_document_bytes must be positive")
        settings = Settings()  # pyright: ignore[reportCallIssue]
        return ReadOnlyHttpClient(
            self.base_url,
            requests_per_second=settings.http_requests_per_second,
            max_concurrency=settings.pncp_max_concurrency,
            provider="pncp",
            max_retries=settings.http_max_retries,
            timeout=settings.http_timeout,
            max_document_bytes=(
                settings.max_document_bytes
                if max_document_bytes is None
                else max_document_bytes
            ),
        )
