import time
from typing import Any, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
