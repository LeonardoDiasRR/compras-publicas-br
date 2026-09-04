import asyncio
import json
import random
from collections.abc import Mapping, Sequence
from typing import cast
from urllib.parse import unquote, urlsplit

import httpx

type JsonScalar = str | int | float | bool | None
type JsonValue = JsonScalar | list[JsonValue] | dict[str, JsonValue]
type QueryParams = Mapping[str, JsonScalar | Sequence[JsonScalar]]

_ALLOWED_HOSTNAMES = frozenset({"dadosabertos.compras.gov.br", "pncp.gov.br"})
_RETRYABLE_STATUSES = frozenset({429, 502, 503, 504})
_RETRY_BASE_SECONDS = 0.2
_RETRY_JITTER_RATIO = 0.1


class UpstreamError(RuntimeError):
    def __init__(self, kind: str, status: int | None, message: str) -> None:
        super().__init__(f"{kind}: {message}")
        self.kind = kind
        self.status = status


class ReadOnlyHttpClient:
    def __init__(
        self,
        base_url: str,
        max_retries: int = 3,
        timeout: float = 30,
        max_document_bytes: int = 25_000_000,
    ) -> None:
        if max_retries < 0:
            raise ValueError("max_retries must be non-negative")
        if max_document_bytes < 0:
            raise ValueError("max_document_bytes must be non-negative")

        parsed_base = urlsplit(base_url)
        try:
            port = parsed_base.port
        except ValueError as error:
            raise ValueError("base_url must use a supported HTTPS port") from error
        hostname = parsed_base.hostname.lower() if parsed_base.hostname is not None else None
        if (
            parsed_base.scheme.lower() != "https"
            or hostname not in _ALLOWED_HOSTNAMES
            or port not in {None, 443}
            or parsed_base.username is not None
            or parsed_base.password is not None
            or parsed_base.query
            or parsed_base.fragment
        ):
            raise ValueError("base_url must use an allowlisted HTTPS host and supported port")

        self._max_retries = max_retries
        self._max_document_bytes = max_document_bytes
        self._client = httpx.AsyncClient(
            base_url=f"{base_url.rstrip('/')}/",
            timeout=timeout,
        )

    async def __aenter__(self) -> "ReadOnlyHttpClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self._client.aclose()

    async def get(self, path: str, params: QueryParams | None = None) -> JsonValue | str:
        request_path = self._relative_path(path)

        for attempt in range(self._max_retries + 1):
            retry = False
            try:
                async with self._client.stream("GET", request_path, params=params) as response:
                    body = await self._read_body(response)
                    if response.status_code in _RETRYABLE_STATUSES:
                        if attempt < self._max_retries:
                            retry = True
                        else:
                            raise UpstreamError(
                                self._error_kind(response.status_code),
                                response.status_code,
                                self._body_text(response, body),
                            )
                    elif response.status_code == 404:
                        raise UpstreamError("NOT_FOUND", 404, self._body_text(response, body))
                    elif response.status_code >= 300:
                        raise UpstreamError(
                            self._error_kind(response.status_code),
                            response.status_code,
                            self._body_text(response, body),
                        )

                    if not retry:
                        if self._is_json(response):
                            try:
                                return cast(JsonValue, json.loads(body))
                            except ValueError as error:
                                raise UpstreamError(
                                    "UPSTREAM_SCHEMA_CHANGED",
                                    response.status_code,
                                    str(error),
                                ) from error
                        return self._body_text(response, body)
            except (httpx.TimeoutException, TimeoutError) as error:
                if attempt < self._max_retries:
                    await self._sleep_before_retry(attempt)
                    continue
                raise UpstreamError("UPSTREAM_TIMEOUT", None, str(error)) from error
            except (httpx.NetworkError, OSError) as error:
                if attempt < self._max_retries:
                    await self._sleep_before_retry(attempt)
                    continue
                raise UpstreamError("UPSTREAM_UNAVAILABLE", None, str(error)) from error
            if retry:
                await self._sleep_before_retry(attempt)
                continue

        raise AssertionError("unreachable")

    @staticmethod
    def _relative_path(path: str) -> str:
        decoded = path
        while (next_decoded := unquote(decoded)) != decoded:
            decoded = next_decoded
        parsed = urlsplit(decoded)
        decoded_path = parsed.path
        if (
            not path.startswith("/")
            or parsed.scheme
            or parsed.netloc
            or decoded.startswith("//")
            or parsed.query
            or parsed.fragment
            or "\\" in decoded
        ):
            raise ValueError("path must be relative to the fixed upstream origin")
        if ".." in decoded_path.replace("\\", "/").split("/"):
            raise ValueError("path must be relative to the fixed upstream origin")
        return path.lstrip("/")

    @staticmethod
    def _is_json(response: httpx.Response) -> bool:
        content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        return content_type == "application/json" or content_type.endswith("+json")

    @staticmethod
    def _error_kind(status: int) -> str:
        if status == 429:
            return "UPSTREAM_RATE_LIMIT"
        if status >= 500:
            return "UPSTREAM_UNAVAILABLE"
        return "UPSTREAM_BAD_REQUEST"

    @staticmethod
    async def _sleep_before_retry(attempt: int) -> None:
        delay = _RETRY_BASE_SECONDS * (2**attempt)
        await asyncio.sleep(delay + random.uniform(0, delay * _RETRY_JITTER_RATIO))

    async def _read_body(self, response: httpx.Response) -> bytes:
        content_length = response.headers.get("content-length")
        if content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError:
                declared_length = None
            if declared_length is not None and declared_length > self._max_document_bytes:
                raise UpstreamError(
                    "DOCUMENT_TOO_LARGE",
                    response.status_code,
                    f"response exceeds {self._max_document_bytes} bytes",
                )

        body = bytearray()
        async for chunk in response.aiter_bytes():
            if len(body) + len(chunk) > self._max_document_bytes:
                raise UpstreamError(
                    "DOCUMENT_TOO_LARGE",
                    response.status_code,
                    f"response exceeds {self._max_document_bytes} bytes",
                )
            body.extend(chunk)
        return bytes(body)

    @staticmethod
    def _body_text(response: httpx.Response, body: bytes) -> str:
        return body.decode(response.encoding or "utf-8", errors="replace")
