from __future__ import annotations

import json
import logging
import math
import re
import time
from collections.abc import Iterable, Mapping
from datetime import UTC, datetime
from typing import Any, Literal, cast

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_LOG_FIELDS = (
    "request_id",
    "provider",
    "tool",
    "endpoint",
    "duration_ms",
    "status_code",
    "retry_count",
    "cache_hit",
)
_MAX_LOG_MESSAGE_LENGTH = 2048
_SENSITIVE_KEY = re.compile(
    r"(?i)(?:private[-_ ]?key|password|passwd|token|auth|api[-_ ]?key|secret|cookie)"
)
_SENSITIVE_MESSAGE = re.compile(
    r'(?i)(?P<prefix>\b(?:private[-_ ]?key|authorization|auth|api[-_ ]?key|password|'
    r'passwd|secret|token|access[-_ ]?token|refresh[-_ ]?token|'
    r'client[-_ ]?secret|cookie)\b\s*["\']?\s*[:=]\s*)'
    r'(?:(?P<double>"(?:\\.|[^"\\])*")|(?P<single>\'(?:\\.|[^\'\\])*\')|'
    r'(?P<bare>(?:bearer\s+)?[^\s,;}\]]+))'
)

logger = logging.getLogger(__name__)


def _redact_json_value(value: Any) -> Any:
    if isinstance(value, dict):
        mapping = cast(dict[str, Any], value)
        redacted: dict[str, Any] = {}
        for key, item in mapping.items():
            redacted[key] = "[REDACTED]" if _SENSITIVE_KEY.search(key) else _redact_json_value(item)
        return redacted
    if isinstance(value, list):
        items = cast(list[Any], value)
        return [_redact_json_value(item) for item in items]
    if isinstance(value, str):
        nested = _redact_json_message(value)
        return nested if nested is not None else value
    return value


def _redact_json_message(message: str) -> str | None:
    decoder = json.JSONDecoder()
    cursor = 0
    parts: list[str] = []
    found = False
    while cursor < len(message):
        object_start = message.find("{", cursor)
        array_start = message.find("[", cursor)
        starts = [start for start in (object_start, array_start) if start >= 0]
        if not starts:
            break
        start = min(starts)
        try:
            value, end = decoder.raw_decode(message, start)
        except json.JSONDecodeError:
            cursor = start + 1
            continue
        if not isinstance(value, (dict, list)):
            cursor = end
            continue
        redacted = json.dumps(
            _redact_json_value(value), ensure_ascii=True, separators=(",", ":")
        )
        parts.extend((message[cursor:start], redacted))
        cursor = end
        found = True
    if not found:
        return None
    parts.append(message[cursor:])
    return "".join(parts)


def _safe_message(message: str) -> str:
    def redact(match: re.Match[str]) -> str:
        value = match.group("double") or match.group("single")
        quote = value[0] if value is not None else ""
        return f'{match.group("prefix")}{quote}[REDACTED]{quote}'

    redacted = _redact_json_message(message) or message
    redacted = _SENSITIVE_MESSAGE.sub(redact, redacted)
    if len(redacted) <= _MAX_LOG_MESSAGE_LENGTH:
        return redacted
    return f"{redacted[: _MAX_LOG_MESSAGE_LENGTH - 3]}..."


def _sanitize_extra(value: Any, key: str | None = None) -> Any:
    if key is not None and _SENSITIVE_KEY.search(key):
        return "[REDACTED]"
    if isinstance(value, str):
        return _safe_message(value)
    if isinstance(value, Mapping):
        mapping = cast(Mapping[Any, Any], value)
        sanitized: dict[str, Any] = {}
        for raw_key, item in mapping.items():
            item_key = str(raw_key)
            sanitized[item_key] = _sanitize_extra(item, item_key)
        return sanitized
    if isinstance(value, (list, tuple, set, frozenset)):
        items = cast(Iterable[Any], value)
        return [_sanitize_extra(item) for item in items]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return _safe_message(str(value))


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(timespec="milliseconds").replace(
                "+00:00", "Z"
            ),
            "level": _sanitize_extra(record.levelname),
            "name": _sanitize_extra(record.name),
            "message": _safe_message(record.getMessage()),
        }
        for field in _LOG_FIELDS:
            if field in record.__dict__:
                payload[field] = _sanitize_extra(record.__dict__[field], field)
        return json.dumps(payload, ensure_ascii=True, default=str)


def configure_logging(settings: Settings | None = None) -> None:
    configuration = settings if settings is not None else Settings()  # pyright: ignore[reportCallIssue]
    level = logging.getLevelNamesMapping().get(configuration.log_level.upper(), logging.INFO)
    logger.setLevel(level)
    logger.propagate = False

    handler = next(
        (
            candidate
            for candidate in logger.handlers
            if getattr(candidate, "_compras_json_handler", False)
        ),
        None,
    )
    if handler is None:
        handler = logging.StreamHandler()
        handler._compras_json_handler = True  # type: ignore[attr-defined]
        logger.addHandler(handler)
    handler.setLevel(logging.NOTSET)
    handler.setFormatter(_JsonFormatter())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    compras_base_url: str = "https://dadosabertos.compras.gov.br"
    pncp_base_url: str = "https://pncp.gov.br/api/pncp"
    http_timeout: float = Field(30, gt=0)
    http_max_retries: int = Field(3, gt=0)
    http_requests_per_second: int = Field(5, gt=0)
    compras_max_concurrency: int = Field(4, gt=0)
    pncp_max_concurrency: int = Field(4, gt=0)
    cache_enabled: bool = True
    cache_domains_ttl: int = Field(86400, gt=0)
    cache_catalog_ttl: int = Field(3600, gt=0)
    cache_recent_ttl: int = Field(300, gt=0)
    cache_historical_ttl: int = Field(86400, gt=0)
    max_document_bytes: int = Field(25_000_000, gt=0)
    mcp_transport: Literal["stdio", "http"] = "stdio"
    log_level: str = "INFO"

    @field_validator(
        "http_max_retries",
        "http_requests_per_second",
        "compras_max_concurrency",
        "pncp_max_concurrency",
        "cache_domains_ttl",
        "cache_catalog_ttl",
        "cache_recent_ttl",
        "cache_historical_ttl",
        "max_document_bytes",
        mode="before",
    )
    @classmethod
    def _reject_non_integer_settings(cls, value: Any) -> Any:
        if isinstance(value, (bool, float)):
            raise ValueError("must be an integer")
        return value

    @field_validator("http_timeout", mode="before")
    @classmethod
    def _reject_boolean_timeout(cls, value: Any) -> Any:
        if isinstance(value, bool):
            raise ValueError("must be numeric seconds")
        return value

    @field_validator("http_timeout")
    @classmethod
    def _reject_non_finite_timeout(cls, value: float) -> float:
        if not math.isfinite(value):
            raise ValueError("must be finite")
        return value


class TtlCache:
    def __init__(self, max_entries: int = 4096) -> None:
        if max_entries <= 0:
            raise ValueError("max_entries must be positive")
        self._max_entries = max_entries
        self._entries: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None or entry[0] <= time.monotonic():
            self._entries.pop(key, None)
            return None
        return entry[1]

    def put(self, key: str, value: Any, ttl_seconds: int) -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        if key not in self._entries and len(self._entries) >= self._max_entries:
            self._entries.pop(next(iter(self._entries)))
        self._entries[key] = (time.monotonic() + ttl_seconds, value)
