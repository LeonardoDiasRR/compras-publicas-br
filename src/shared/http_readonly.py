import asyncio
import hashlib
import json
import math
import random
import time
import uuid
from collections.abc import Mapping, Sequence
from typing import cast
from urllib.parse import unquote, urlsplit
from weakref import WeakKeyDictionary

import httpx

from src.shared.runtime import logger

type JsonScalar = str | int | float | bool | None
type JsonValue = JsonScalar | list[JsonValue] | dict[str, JsonValue]
type QueryParams = Mapping[str, JsonScalar | Sequence[JsonScalar]]

_ALLOWED_HOSTNAMES = frozenset({"dadosabertos.compras.gov.br", "pncp.gov.br"})
_RETRYABLE_STATUSES = frozenset({429, 502, 503, 504})
_RETRYABLE_KINDS = frozenset({"UPSTREAM_TIMEOUT", "UPSTREAM_UNAVAILABLE"})
_RETRY_BASE_SECONDS = 0.2
_RETRY_JITTER_RATIO = 0.1
_MAX_ERROR_BODY_CHARS = 4096


class _RequestLimiter:
    def __init__(
        self,
        max_concurrency: int | None,
        requests_per_second: float | None,
    ) -> None:
        self.semaphore = (
            asyncio.Semaphore(max_concurrency) if max_concurrency is not None else None
        )
        self.rate_lock = asyncio.Lock() if requests_per_second is not None else None
        self.request_interval = (
            1 / float(requests_per_second) if requests_per_second is not None else None
        )
        self.next_request_at = 0.0


_LIMITERS: WeakKeyDictionary[
    asyncio.AbstractEventLoop, dict[str, _RequestLimiter]
] = WeakKeyDictionary()


class UpstreamError(RuntimeError):
    def __init__(
        self,
        kind: str,
        status: int | None,
        message: str,
        provider: str | None = None,
        endpoint: str | None = None,
        upstream_message: str | None = None,
    ) -> None:
        super().__init__(f"{kind}: {message}")
        self.kind = kind
        self.status = status
        self.message = message
        self.provider = provider
        self.endpoint = endpoint
        self.upstream_message = (message if upstream_message is None else upstream_message)[
            :_MAX_ERROR_BODY_CHARS
        ]
        self.retryable = status in _RETRYABLE_STATUSES or kind in _RETRYABLE_KINDS


class ReadOnlyHttpClient:
    def __init__(
        self,
        base_url: str,
        max_retries: int = 3,
        timeout: float = 30,
        max_document_bytes: object = 25_000_000,
        max_concurrency: int | None = None,
        requests_per_second: float | None = None,
        provider: str | None = None,
    ) -> None:
        if max_retries < 0:
            raise ValueError("max_retries must be non-negative")
        if isinstance(max_document_bytes, bool) or not isinstance(max_document_bytes, int):
            raise ValueError("max_document_bytes must be a positive finite integer")
        if max_document_bytes <= 0:
            raise ValueError("max_document_bytes must be a positive finite integer")
        if (
            not isinstance(max_concurrency, int)
            or isinstance(max_concurrency, bool)
            or max_concurrency <= 0
        ) and max_concurrency is not None:
            raise ValueError("max_concurrency must be positive")
        if (
            not isinstance(requests_per_second, (int, float))
            or isinstance(requests_per_second, bool)
            or not math.isfinite(float(requests_per_second))
            or requests_per_second <= 0
        ) and requests_per_second is not None:
            raise ValueError("requests_per_second must be positive")

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
        self._max_concurrency = max_concurrency
        self._requests_per_second = requests_per_second
        self._origin = f"{parsed_base.scheme.lower()}://{hostname}"
        self._provider = provider or ("pncp" if hostname == "pncp.gov.br" else "compras")
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
        endpoint = f"/{request_path}"
        request_id = uuid.uuid4().hex

        for attempt in range(self._max_retries + 1):
            retry = False
            status_code: int | None = None
            started = time.monotonic()
            limiter = self._get_limiter()
            if limiter is not None and limiter.semaphore is not None:
                await limiter.semaphore.acquire()
            try:
                await self._wait_for_rate_limit(limiter)
                started = time.monotonic()
                async with self._client.stream("GET", request_path, params=params) as response:
                    status_code = response.status_code
                    body = await self._read_body(response, endpoint)
                    if response.status_code in _RETRYABLE_STATUSES:
                        if attempt < self._max_retries:
                            retry = True
                        else:
                            raise UpstreamError(
                                self._error_kind(response.status_code),
                                response.status_code,
                                self._error_body_text(response, body),
                                provider=self._provider,
                                endpoint=endpoint,
                            )
                    elif response.status_code == 404:
                        raise UpstreamError(
                            "NOT_FOUND",
                            404,
                            self._error_body_text(response, body),
                            provider=self._provider,
                            endpoint=endpoint,
                        )
                    elif response.status_code >= 300:
                        raise UpstreamError(
                            self._error_kind(response.status_code),
                            response.status_code,
                            self._error_body_text(response, body),
                            provider=self._provider,
                            endpoint=endpoint,
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
                                    provider=self._provider,
                                    endpoint=endpoint,
                                ) from error
                        return self._body_text(response, body)
            except httpx.DecodingError as error:
                raise UpstreamError(
                    "UPSTREAM_SCHEMA_CHANGED",
                    status_code,
                    str(error),
                    provider=self._provider,
                    endpoint=endpoint,
                ) from error
            except (httpx.TimeoutException, TimeoutError) as error:
                if attempt < self._max_retries:
                    retry = True
                else:
                    raise UpstreamError(
                        "UPSTREAM_TIMEOUT",
                        None,
                        str(error),
                        provider=self._provider,
                        endpoint=endpoint,
                    ) from error
            except (httpx.NetworkError, OSError) as error:
                if attempt < self._max_retries:
                    retry = True
                else:
                    raise UpstreamError(
                        "UPSTREAM_UNAVAILABLE",
                        None,
                        str(error),
                        provider=self._provider,
                        endpoint=endpoint,
                    ) from error
            except httpx.TransportError as error:
                if attempt < self._max_retries:
                    retry = True
                else:
                    raise UpstreamError(
                        "UPSTREAM_UNAVAILABLE",
                        None,
                        str(error),
                        provider=self._provider,
                        endpoint=endpoint,
                    ) from error
            finally:
                if limiter is not None and limiter.semaphore is not None:
                    limiter.semaphore.release()
                logger.info(
                    "upstream request",
                    extra={
                        "request_id": request_id,
                        "provider": self._provider,
                        "endpoint": hashlib.sha256(endpoint.encode("utf-8")).hexdigest(),
                        "duration_ms": round((time.monotonic() - started) * 1000, 3),
                        "status_code": status_code,
                        "retry_count": attempt,
                        "cache_hit": False,
                    },
                )
            if retry:
                await self._sleep_before_retry(attempt)
                continue

        raise AssertionError("unreachable")

    def _get_limiter(self) -> _RequestLimiter | None:
        loop = asyncio.get_running_loop()
        limiters = _LIMITERS.setdefault(loop, {})
        limiter = limiters.get(self._origin)
        if limiter is None and (
            self._max_concurrency is not None or self._requests_per_second is not None
        ):
            limiter = _RequestLimiter(self._max_concurrency, self._requests_per_second)
            limiters[self._origin] = limiter
        return limiter

    async def _wait_for_rate_limit(self, limiter: _RequestLimiter | None) -> None:
        if limiter is None or limiter.rate_lock is None or limiter.request_interval is None:
            return
        async with limiter.rate_lock:
            now = time.monotonic()
            if limiter.next_request_at > now:
                await asyncio.sleep(limiter.next_request_at - now)
            limiter.next_request_at = time.monotonic() + limiter.request_interval

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

    async def _read_body(self, response: httpx.Response, endpoint: str) -> bytes:
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
                    provider=self._provider,
                    endpoint=endpoint,
                )

        body = bytearray()
        async for chunk in response.aiter_bytes():
            if len(body) + len(chunk) > self._max_document_bytes:
                raise UpstreamError(
                    "DOCUMENT_TOO_LARGE",
                    response.status_code,
                    f"response exceeds {self._max_document_bytes} bytes",
                    provider=self._provider,
                    endpoint=endpoint,
                )
            body.extend(chunk)
        return bytes(body)

    @staticmethod
    def _body_text(response: httpx.Response, body: bytes) -> str:
        return body.decode(response.encoding or "utf-8", errors="replace")

    @staticmethod
    def _error_body_text(response: httpx.Response, body: bytes) -> str:
        return ReadOnlyHttpClient._body_text(response, body)[:_MAX_ERROR_BODY_CHARS]
