# MCP Compras Públicas Brasil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um servidor MCP Python estritamente somente-leitura que exponha todos os GETs públicos úteis do Compras.gov.br e PNCP, com cobertura verificável contra os contratos oficiais.

**Architecture:** O sistema usa os OpenAPI oficiais versionados como a fonte de verdade. Um catálogo normalizado classifica cada operação, produz o manifesto e registra dinamicamente uma ferramenta MCP atômica por GET público útil; todas delegam a um serviço de consulta e, então, a clientes HTTP com origem fixa. Isso evita uma implementação HTTP repetida por endpoint, enquanto mantém a relação 1:1 endpoint-ferramenta e faz endpoints novos falharem no gate de cobertura até serem classificados e nomeados.

**Tech Stack:** Python 3.12, uv, FastMCP 3.2, httpx, Pydantic v2, PyYAML, pytest, respx, Ruff, Pyright, Docker, GitHub Actions.

---

## Decisões Confirmadas

- O repositório está vazio além de `prd.md`; este plano cria a aplicação do zero e segue a arquitetura obrigatória por feature em `src/features/` e `src/shared/`.
- A consulta oficial de 2026-09-04 encontrou 73 GETs no Compras.gov.br (69 públicos) e 108 no PNCP (100 públicos). Esses números são uma linha de base, não uma constante: o snapshot versionado e a descoberta são a autoridade em cada execução.
- Os contratos são `https://dadosabertos.compras.gov.br/v3/api-docs` (OpenAPI 3.1) e `https://pncp.gov.br/pncp-api/v3/api-docs` (OpenAPI 3.0). O servidor executável do PNCP é `https://pncp.gov.br/api/pncp`, portanto o código não deriva a base HTTP da URL de descoberta.
- O catálogo usa `summary`/`description` oficial como descrição de ferramenta, nunca `operationId`; nomes estáveis são produzidos por um mapeamento versionado de path para português. Um novo GET permanece `UNKNOWN` até receber o nome e a classificação explícitos, mesmo que seja publicamente acessível.
- Ferramentas compostas e busca federada são implementadas no mesmo módulo MCP somente depois de o manifesto atômico alcançar 100%; elas são adicionais e não podem diluir ou substituir cobertura. A cobertura atômica, segurança, drift e operação são dependências comuns, portanto não são subprojetos independentes a serem separados.

## File Structure

| Path | Responsibility |
| --- | --- |
| `pyproject.toml` | Metadados do pacote, dependências, ferramentas e comandos uv. |
| `src/shared/runtime.py` | Configuração por ambiente, log JSON e cache TTL em memória. |
| `src/shared/http_readonly.py` | Cliente HTTP assíncrono com allowlist, GET exclusivo, limites, retry e erros normalizados. |
| `src/features/catalogo/models.py` | Modelos Pydantic do OpenAPI normalizado, manifest e resposta MCP. |
| `src/features/catalogo/catalogo.py` | Download/snapshot, resolução OpenAPI, classificação, diff, manifest e relatórios. |
| `src/features/provedores/clientes.py` | `ComprasClient` e `PncpClient`, cada qual com base fixa e adaptação de paginação/conteúdo. |
| `src/features/consultas/servico.py` | Validação de parâmetros, execução de operação catalogada e envelope de proveniência. |
| `src/features/mcp/servidor.py` | Registro das tools atômicas, resources, capacidades e health check FastMCP. |
| `coverage/endpoints.yaml` | Manifest revisado de todos os endpoints e seus nomes/descritivos MCP. |
| `specs/upstream/**` | Snapshots imutáveis dos OpenAPI oficiais usados pela linha de base. |
| `tests/**` | Testes unitários, de contrato, integração simulada e live opt-in. |
| `.github/workflows/**` | Gate PR e detecção agendada de drift. |
| `README.md`, `ARCHITECTURE.md`, `TOOLS.md`, `ENDPOINT_COVERAGE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` | Operação, contrato público, contribuição e segurança. |

### Phase 1: Bootstrap and Official Snapshots

**Entry criteria:** Apenas `prd.md` existe; Python 3.12+ e `uv` estão instalados.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tasks do not depend on one another or edit the same file: `pyproject.toml`, `.gitignore`, `specs/upstream/compras/2026-09-04.json`, `specs/upstream/pncp/2026-09-04.json`.

**Completion gate:** `uv sync --all-groups` exits 0; both JSON files parse with `uv run python -m json.tool <path>`; each OpenAPI contains a top-level `paths` object.

#### Task 1.1: Define the Python Project

**Files:**
- Create exactly one file: `pyproject.toml`

- [ ] **Step 1: Write the initial project configuration**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mcp-compras-publicas-br"
version = "0.1.0"
description = "MCP somente leitura para APIs públicas de compras brasileiras"
requires-python = ">=3.12"
dependencies = [
  "fastmcp==3.2.4",
  "httpx>=0.28,<1",
  "pydantic>=2.10,<3",
  "pydantic-settings>=2.7,<3",
  "PyYAML>=6,<7",
]

[dependency-groups]
dev = [
  "pytest>=8,<9",
  "pytest-asyncio>=0.25,<1",
  "respx>=0.22,<1",
  "ruff>=0.9,<1",
  "pyright>=1.1.390,<2",
]

[tool.hatch.build.targets.wheel]
packages = ["src"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
markers = [
  "live: consulta opt-in a produção; requer RUN_LIVE_TESTS=1",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]

[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
include = ["src"]
```

- [ ] **Step 2: Install and verify the toolchain**

Run: `uv sync --all-groups`

Expected: lockfile is created and dependency resolution exits 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add pyproject.toml uv.lock
git commit -m "build: initialize Python MCP project"
```

#### Task 1.2: Ignore Local Artifacts

**Files:**
- Create exactly one file: `.gitignore`

- [ ] **Step 1: Add only generated local artifacts**

```gitignore
.venv/
.pytest_cache/
.ruff_cache/
.pyright/
__pycache__/
*.py[cod]
.env
coverage-report.md
```

- [ ] **Step 2: Verify source snapshots remain trackable**

Run: `git check-ignore specs/upstream/pncp/2026-09-04.json`

Expected: exits 1 because official snapshots must be versioned.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add .gitignore
git commit -m "chore: ignore local Python artifacts"
```

#### Task 1.3: Snapshot the Compras.gov.br Contract

**Files:**
- Create exactly one file: `specs/upstream/compras/2026-09-04.json`

- [ ] **Step 1: Fetch the authoritative OpenAPI document without transforming it**

Run: `curl.exe --fail --location https://dadosabertos.compras.gov.br/v3/api-docs --output specs/upstream/compras/2026-09-04.json`

Expected: exits 0 and writes the OpenAPI 3.1 document.

- [ ] **Step 2: Verify its identity and inventory**

Run: `uv run python -c "import json; s=json.load(open('specs/upstream/compras/2026-09-04.json')); print(s['openapi'], len(s['paths']))"`

Expected: starts with `3.1` and prints a positive path count.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add specs/upstream/compras/2026-09-04.json
git commit -m "docs: snapshot Compras OpenAPI contract"
```

#### Task 1.4: Snapshot the PNCP Contract

**Files:**
- Create exactly one file: `specs/upstream/pncp/2026-09-04.json`

- [ ] **Step 1: Fetch the authoritative OpenAPI document without transforming it**

Run: `curl.exe --fail --location https://pncp.gov.br/pncp-api/v3/api-docs --output specs/upstream/pncp/2026-09-04.json`

Expected: exits 0 and writes the OpenAPI 3.0 document.

- [ ] **Step 2: Verify its identity and inventory**

Run: `uv run python -c "import json; s=json.load(open('specs/upstream/pncp/2026-09-04.json')); print(s['openapi'], len(s['paths']))"`

Expected: starts with `3.0` and prints a positive path count.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add specs/upstream/pncp/2026-09-04.json
git commit -m "docs: snapshot PNCP OpenAPI contract"
```

### Phase 2: Write the Failing Safety and Catalog Tests

**Entry criteria:** Phase 1 completion gate passed and both pinned OpenAPI snapshots are committed.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tests are intentionally written before their implementation and do not edit the same file: `tests/test_catalogo.py`, `tests/test_http_readonly.py`, `tests/test_clientes.py`, `tests/test_servico_consultas.py`, `tests/test_servidor_mcp.py`.

**Completion gate:** `uv run pytest tests -q` fails only because the five target modules do not yet exist; no syntax, import-path, or fixture error is accepted.

#### Task 2.1: Specify Catalog, Classification, Diff and Coverage

**Files:**
- Create exactly one file: `tests/test_catalogo.py`

- [ ] **Step 1: Write the failing catalog contract tests**

```python
from pathlib import Path

import pytest

from src.features.catalogo.catalogo import (
    classify_operations,
    compare_catalogs,
    load_openapi,
    render_coverage,
)


@pytest.mark.parametrize(
    ("source", "snapshot", "expected_gets", "expected_public"),
    [
        ("compras", "specs/upstream/compras/2026-09-04.json", 73, 69),
        ("pncp", "specs/upstream/pncp/2026-09-04.json", 108, 100),
    ],
)
def test_snapshot_inventory_is_classified(source, snapshot, expected_gets, expected_public):
    operations = classify_operations(load_openapi(Path(snapshot)), source)
    gets = [operation for operation in operations if operation.method == "GET"]
    public = [operation for operation in gets if operation.classification == "PUBLIC_USEFUL"]
    assert len(gets) == expected_gets
    assert len(public) == expected_public
    assert not [operation for operation in gets if operation.classification == "UNKNOWN"]


def test_bearer_security_excludes_a_get_from_public_coverage():
    spec = {"paths": {"/v1/usuarios/{id}": {"get": {"security": [{"bearerAuth": []}]}}}}
    operation = classify_operations(spec, "pncp")[0]
    assert operation.classification == "AUTHENTICATED"


def test_diff_reports_a_new_path_and_coverage_requires_every_public_tool():
    previous = []
    current = [
        {"id": "pncp.GET./v1/modalidades", "method": "GET", "path": "/v1/modalidades"},
    ]
    assert compare_catalogs(previous, current).added == current
    report = render_coverage(
        [{"classification": "PUBLIC_USEFUL", "implemented": False, "tool": None}]
    )
    assert report.ratio == 0.0
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_catalogo.py -q`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.features.catalogo.catalogo'`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_catalogo.py
git commit -m "test: specify catalog coverage behavior"
```

#### Task 2.2: Specify GET-Only HTTP Behavior

**Files:**
- Create exactly one file: `tests/test_http_readonly.py`

- [ ] **Step 1: Write the failing read-only client tests**

```python
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
    assert route.called


async def test_client_rejects_absolute_or_unknown_origins():
    async with ReadOnlyHttpClient("https://pncp.gov.br/api/pncp") as client:
        with pytest.raises(ValueError, match="relative"):
            await client.get("https://example.com/private")


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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_http_readonly.py -q`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.shared.http_readonly'`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_http_readonly.py
git commit -m "test: specify read-only HTTP boundary"
```

#### Task 2.3: Specify the Provider Clients

**Files:**
- Create exactly one file: `tests/test_clientes.py`

- [ ] **Step 1: Write the failing provider tests**

```python
from src.features.provedores.clientes import ComprasClient, PncpClient


def test_provider_clients_use_only_their_fixed_official_origins():
    assert ComprasClient.base_url == "https://dadosabertos.compras.gov.br"
    assert PncpClient.base_url == "https://pncp.gov.br/api/pncp"


def test_provider_client_normalizes_known_pagination_without_inventing_totals():
    page = PncpClient.normalize_page({"data": [{"id": 1}], "totalRegistros": 1})
    assert page["items"] == [{"id": 1}]
    assert page["pagination"]["total_items"] == 1
    assert "total_pages" not in page["pagination"]
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_clientes.py -q`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.features.provedores.clientes'`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_clientes.py
git commit -m "test: specify fixed provider clients"
```

#### Task 2.4: Specify the Generic Query Service

**Files:**
- Create exactly one file: `tests/test_servico_consultas.py`

- [ ] **Step 1: Write the failing service contract tests**

```python
import pytest

from src.features.consultas.servico import normalize_cnpj, render_path


def test_normalize_cnpj_removes_punctuation_and_requires_fourteen_digits():
    assert normalize_cnpj("00.394.460/0001-41") == "00394460000141"
    with pytest.raises(ValueError, match="14"):
        normalize_cnpj("123")


def test_render_path_encodes_only_catalogued_path_parameters():
    assert render_path(
        "/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}",
        {"cnpj": "00394460000141", "ano": 2026, "sequencial": 3},
    ) == "/v1/orgaos/00394460000141/compras/2026/3"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_servico_consultas.py -q`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.features.consultas.servico'`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_servico_consultas.py
git commit -m "test: specify query parameter normalization"
```

#### Task 2.5: Specify MCP Registry and Resources

**Files:**
- Create exactly one file: `tests/test_servidor_mcp.py`

- [ ] **Step 1: Write the failing MCP surface tests**

```python
import pytest

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
        "    description: Lista modalidades de contratação publicadas pelo PNCP.\n",
        encoding="utf-8",
    )
    server = build_server(manifest)
    tools = await server.list_tools()
    assert [tool.name for tool in tools] == ["pncp_listar_modalidades", "listar_capacidades_mcp", "verificar_saude_fontes"]


def test_server_exposes_coverage_resource():
    server = build_server(None)
    assert "mcp://coverage" in {resource.uri for resource in server.resources}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run pytest tests/test_servidor_mcp.py -q`

Expected: FAIL with `ModuleNotFoundError: No module named 'src.features.mcp.servidor'`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_servidor_mcp.py
git commit -m "test: specify MCP registry surface"
```

### Phase 3: Implement the Shared Catalog and HTTP Foundations

**Entry criteria:** All five Phase 2 tests fail for their intended missing-target reason.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These files have no implementation dependency on one another: `src/features/catalogo/models.py`, `src/shared/runtime.py`, `src/shared/http_readonly.py`.

**Completion gate:** `uv run pytest tests/test_http_readonly.py -q` passes; `uv run ruff check src tests` and `uv run pyright` exit 0.

#### Task 3.1: Model Catalog and MCP Envelopes

**Files:**
- Create exactly one file: `src/features/catalogo/models.py`

- [ ] **Step 1: Implement immutable normalized records**

```python
from typing import Any, Literal

from pydantic import BaseModel, Field


Classification = Literal[
    "PUBLIC_USEFUL", "PUBLIC_NOT_USEFUL", "AUTHENTICATED", "DEPRECATED", "BROKEN_UPSTREAM", "INTERNAL", "UNKNOWN"
]


class Operation(BaseModel):
    id: str
    provider: Literal["compras", "pncp"]
    method: Literal["GET"]
    path: str
    security: list[dict[str, list[str]]] = Field(default_factory=list)
    parameters: list[dict[str, Any]] = Field(default_factory=list)
    description: str
    classification: Classification = "UNKNOWN"
    implemented: bool = False
    tool: str | None = None


class CoverageReport(BaseModel):
    public_useful: int
    implemented: int
    ratio: float


class McpResponse(BaseModel):
    source: str
    endpoint: str
    query: dict[str, Any]
    data: Any
    metadata: dict[str, Any]
```

- [ ] **Step 2: Run static checks**

Run: `uv run ruff check src/features/catalogo/models.py && uv run pyright src/features/catalogo/models.py`

Expected: both commands exit 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add src/features/catalogo/models.py
git commit -m "feat: add normalized catalog models"
```

#### Task 3.2: Add Minimal Runtime Facilities

**Files:**
- Create exactly one file: `src/shared/runtime.py`

- [ ] **Step 1: Implement environment settings and bounded in-memory TTL cache**

```python
import time
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    compras_base_url: str = "https://dadosabertos.compras.gov.br"
    pncp_base_url: str = "https://pncp.gov.br/api/pncp"
    http_timeout: float = 30
    http_max_retries: int = 3
    http_requests_per_second: int = 5
    compras_max_concurrency: int = 4
    pncp_max_concurrency: int = 4
    cache_enabled: bool = True
    max_document_bytes: int = 25_000_000


class TtlCache:
    def __init__(self) -> None:
        self._entries: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None or entry[0] <= time.monotonic():
            self._entries.pop(key, None)
            return None
        return entry[1]

    def put(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._entries[key] = (time.monotonic() + ttl_seconds, value)
```

- [ ] **Step 2: Run static checks**

Run: `uv run ruff check src/shared/runtime.py && uv run pyright src/shared/runtime.py`

Expected: both commands exit 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add src/shared/runtime.py
git commit -m "feat: add runtime settings and cache"
```

#### Task 3.3: Implement the GET-Only HTTP Boundary

**Files:**
- Create exactly one file: `src/shared/http_readonly.py`

- [ ] **Step 1: Implement relative GET requests, retry policy and normalized errors**

```python
import asyncio
from typing import Any

import httpx


class UpstreamError(RuntimeError):
    def __init__(self, kind: str, status: int | None, message: str) -> None:
        super().__init__(f"{kind}: {message}")
        self.kind = kind
        self.status = status


class ReadOnlyHttpClient:
    def __init__(self, base_url: str, max_retries: int = 3, timeout: float = 30) -> None:
        self._base_url = base_url.rstrip("/")
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=timeout)

    async def __aenter__(self) -> "ReadOnlyHttpClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self._client.aclose()

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        if not path.startswith("/") or "://" in path:
            raise ValueError("path must be relative to the fixed upstream origin")
        for attempt in range(self._max_retries + 1):
            try:
                response = await self._client.get(path, params=params)
                if response.status_code in {429, 502, 503, 504} and attempt < self._max_retries:
                    await asyncio.sleep(0.2 * (2**attempt))
                    continue
                if response.status_code == 404:
                    raise UpstreamError("NOT_FOUND", 404, response.text)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                return response.json() if "json" in content_type else response.text
            except httpx.TimeoutException as error:
                if attempt == self._max_retries:
                    raise UpstreamError("UPSTREAM_TIMEOUT", None, str(error)) from error
                await asyncio.sleep(0.2 * (2**attempt))
            except httpx.HTTPStatusError as error:
                raise UpstreamError("UPSTREAM_BAD_REQUEST", error.response.status_code, error.response.text) from error
        raise AssertionError("unreachable")
```

- [ ] **Step 2: Run the targeted tests**

Run: `uv run pytest tests/test_http_readonly.py -q`

Expected: PASS.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add src/shared/http_readonly.py
git commit -m "feat: enforce GET-only upstream access"
```

### Phase 4: Build Catalog Discovery and Fixed Provider Adapters

**Entry criteria:** Phase 3 completion gate passed; the shared HTTP client cannot send a write method.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. Both tasks depend only on Phase 3 and edit distinct files: `src/features/catalogo/catalogo.py`, `src/features/provedores/clientes.py`.

**Completion gate:** `uv run pytest tests/test_catalogo.py tests/test_clientes.py -q` passes; `uv run python -m src.features.catalogo.catalogo --help` exits 0.

#### Task 4.1: Implement OpenAPI Discovery, Classification, Manifest and Semantic Diff

**Files:**
- Create exactly one file: `src/features/catalogo/catalogo.py`

- [ ] **Step 1: Implement deterministic catalog functions used by the tests**

```python
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from src.features.catalogo.models import CoverageReport, Operation


@dataclass(frozen=True)
class CatalogDiff:
    added: list[dict[str, Any]]
    removed: list[dict[str, Any]]
    changed: list[dict[str, Any]]


def load_openapi(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def classify_operations(spec: dict[str, Any], provider: str) -> list[Operation]:
    operations: list[Operation] = []
    for path, methods in spec.get("paths", {}).items():
        for method, raw in methods.items():
            if method.lower() != "get":
                continue
            security = raw.get("security", spec.get("security", []))
            classification = "AUTHENTICATED" if security else "PUBLIC_USEFUL"
            operations.append(Operation(
                id=f"{provider}.GET.{path}", provider=provider, method="GET", path=path,
                security=security, parameters=raw.get("parameters", []),
                description=raw.get("summary") or raw.get("description") or path,
                classification=classification,
            ))
    return operations


def compare_catalogs(previous: list[dict[str, Any]], current: list[dict[str, Any]]) -> CatalogDiff:
    old = {item["id"]: item for item in previous}
    new = {item["id"]: item for item in current}
    return CatalogDiff(
        added=[item for key, item in new.items() if key not in old],
        removed=[item for key, item in old.items() if key not in new],
        changed=[item for key, item in new.items() if key in old and item != old[key]],
    )


def render_coverage(endpoints: list[dict[str, Any]]) -> CoverageReport:
    public = [item for item in endpoints if item["classification"] == "PUBLIC_USEFUL"]
    implemented = [item for item in public if item["implemented"] and item["tool"]]
    return CoverageReport(public_useful=len(public), implemented=len(implemented), ratio=len(implemented) / len(public) if public else 1.0)
```

- [ ] **Step 2: Extend this same module with the CLI contract**

```python
# Add below the functions above.
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Descobre e compara contratos oficiais")
    parser.parse_args()
```

- [ ] **Step 3: Run catalog tests and verify the baseline**

Run: `uv run pytest tests/test_catalogo.py -q`

Expected: PASS, including 73/69 Compras and 108/100 PNCP assertions.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/catalogo/catalogo.py
git commit -m "feat: add OpenAPI catalog discovery and coverage"
```

#### Task 4.2: Implement Named Compras and PNCP Clients

**Files:**
- Create exactly one file: `src/features/provedores/clientes.py`

- [ ] **Step 1: Implement separate fixed-origin facades over the shared client**

```python
from typing import Any

from src.shared.http_readonly import ReadOnlyHttpClient


class ComprasClient:
    base_url = "https://dadosabertos.compras.gov.br"

    @staticmethod
    def normalize_page(payload: Any) -> dict[str, Any]:
        if isinstance(payload, list):
            return {"items": payload, "pagination": {}}
        return {"items": payload.get("resultado", payload.get("data", payload)), "pagination": {}}

    def client(self) -> ReadOnlyHttpClient:
        return ReadOnlyHttpClient(self.base_url)


class PncpClient:
    base_url = "https://pncp.gov.br/api/pncp"

    @staticmethod
    def normalize_page(payload: Any) -> dict[str, Any]:
        if isinstance(payload, list):
            return {"items": payload, "pagination": {}}
        pagination = {}
        if "totalRegistros" in payload:
            pagination["total_items"] = payload["totalRegistros"]
        return {"items": payload.get("data", payload), "pagination": pagination}

    def client(self) -> ReadOnlyHttpClient:
        return ReadOnlyHttpClient(self.base_url)
```

- [ ] **Step 2: Run provider tests**

Run: `uv run pytest tests/test_clientes.py -q`

Expected: PASS.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add src/features/provedores/clientes.py
git commit -m "feat: add fixed Compras and PNCP clients"
```

### Phase 5: Create the Reviewed Endpoint Manifest

**Entry criteria:** Catalog inventory tests pass against both pinned snapshots and identify no unknown GET solely due to upstream security metadata.

**Parallel dispatch:** Dispatch one implementer for the single task below: `coverage/endpoints.yaml`.

**Completion gate:** `uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml` exits 0 and reports `Compras.gov.br: 100%`, `PNCP: 100%`, `Unmapped public useful GET endpoints: 0`. A review records 69 public Compras and 100 public PNCP operations, plus the 12 authenticated GET exclusions observed in the snapshots.

#### Task 5.1: Version the Endpoint-to-Tool Contract

**Files:**
- Create exactly one file: `coverage/endpoints.yaml`

- [ ] **Step 1: Generate the candidate manifest from both pinned snapshots**

Run: `uv run python -m src.features.catalogo.catalogo discover --compras specs/upstream/compras/2026-09-04.json --pncp specs/upstream/pncp/2026-09-04.json --output coverage/endpoints.yaml`

Expected: generates one entry for each 181 GET operation, preserving `id`, provider, method, path, OpenAPI parameters, security and description.

- [ ] **Step 2: Review every generated GET entry and make classification explicit**

Use this required schema for every entry. Keep bearer-secured operations `AUTHENTICATED` with `implemented: false` and `exclusion.reason: authentication_required`. For each public operation, set `classification: PUBLIC_USEFUL`, `implemented: true`, a stable Portuguese `tool` beginning with `compras_` or `pncp_`, and a descriptive `description` based on the official summary. Do not use an `operationId` as a description.

```yaml
source_version:
  compras:
    snapshot: specs/upstream/compras/2026-09-04.json
    openapi: "3.1.0"
  pncp:
    snapshot: specs/upstream/pncp/2026-09-04.json
    openapi: "3.0.1"
endpoints:
  - id: pncp.GET./v1/modalidades
    provider: pncp
    method: GET
    path: /v1/modalidades
    classification: PUBLIC_USEFUL
    implemented: true
    tool: pncp_listar_modalidades
    description: Lista as modalidades de contratação disponíveis no Portal Nacional de Contratações Públicas.
  - id: pncp.GET./v1/usuarios/{id}
    provider: pncp
    method: GET
    path: /v1/usuarios/{id}
    classification: AUTHENTICATED
    implemented: false
    exclusion:
      reason: authentication_required
```

- [ ] **Step 3: Verify complete coverage and stable naming**

Run: `uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml`

Expected: `overall=1.0`, every `PUBLIC_USEFUL` entry has a unique `tool`, no entry is `UNKNOWN`, and no tool violates `^(compras|pncp)_[a-z0-9_]+$`.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add coverage/endpoints.yaml
git commit -m "feat: map public GET endpoints to MCP tools"
```

### Phase 6: Execute Catalogued Queries Through the Service Layer

**Entry criteria:** The reviewed manifest is complete and the provider clients plus catalog functions pass their tests.

**Parallel dispatch:** Dispatch one implementer for the single task below: `src/features/consultas/servico.py`.

**Completion gate:** `uv run pytest tests/test_servico_consultas.py tests/test_clientes.py -q` passes; the service never imports `httpx` or calls HTTP directly.

#### Task 6.1: Implement Parameter Validation, Query Dispatch and Provenance

**Files:**
- Create exactly one file: `src/features/consultas/servico.py`

- [ ] **Step 1: Implement the existing failing parameter helpers**

```python
import re
from typing import Any

from src.features.catalogo.models import McpResponse, Operation
from src.features.provedores.clientes import ComprasClient, PncpClient


def normalize_cnpj(value: str) -> str:
    normalized = re.sub(r"\D", "", value)
    if len(normalized) != 14:
        raise ValueError("cnpj must contain 14 numeric digits")
    return normalized


def render_path(template: str, values: dict[str, Any]) -> str:
    return template.format(**{key: str(value) for key, value in values.items()})


class QueryService:
    async def execute(self, operation: Operation, arguments: dict[str, Any]) -> McpResponse:
        path_parameters = {parameter["name"] for parameter in operation.parameters if parameter.get("in") == "path"}
        path_values = {key: normalize_cnpj(value) if key == "cnpj" else value for key, value in arguments.items() if key in path_parameters}
        query = {key: value for key, value in arguments.items() if key not in path_parameters}
        provider = PncpClient() if operation.provider == "pncp" else ComprasClient()
        async with provider.client() as client:
            payload = await client.get(render_path(operation.path, path_values), params=query)
        normalized = provider.normalize_page(payload)
        return McpResponse(
            source=operation.provider,
            endpoint=operation.path,
            query=query,
            data=normalized["items"],
            metadata={"pagination": normalized["pagination"]},
        )

    async def execute_many(self, operations: list[Operation], arguments: dict[str, Any]) -> dict[str, Any]:
        return {
            operation.tool or operation.id: (await self.execute(operation, arguments)).model_dump(mode="json")
            for operation in operations
        }
```

- [ ] **Step 2: Add the timestamp to the same response construction**

```python
# Add imports at the top: from datetime import UTC, datetime
# Add this key to metadata in QueryService.execute:
"retrieved_at": datetime.now(UTC).isoformat(),
```

- [ ] **Step 3: Complete list, raw-document and cache behavior in the same service**

Implement these exact rules before testing: accept `pagina`, `tamanho_pagina`, `auto_paginar` and `limite_resultados` only for operations that document the corresponding parameter; default `limite_resultados` to 100 and reject values above the configured maximum; when `auto_paginar=true`, request subsequent pages only while the normalized upstream response supplies a next-page signal and stop at the limit. Preserve only pagination fields actually returned by upstream. Cache public responses by `sha256(provider + endpoint id + rendered path + sorted query)` using the TTL cache, and bypass it when `CACHE_ENABLED=false`. Return upstream CSV/text unchanged in `data`; for an explicitly requested document body, use the GET-only client and return `download_available=true`, `content_returned=false`, `reason=file_size_limit` before reading a body larger than `MAX_DOCUMENT_BYTES`.

- [ ] **Step 4: Run focused tests and enforce the architectural boundary**

Run: `uv run pytest tests/test_servico_consultas.py -q; rg "httpx|\.get\(" src/features/mcp`

Expected: tests PASS; the ripgrep command finds no MCP tool code because this phase has not created the MCP module yet.

- [ ] **Step 5: Commit the file-scoped task**

```bash
git add src/features/consultas/servico.py
git commit -m "feat: add catalogued query service"
```

### Phase 7: Expose Atomic MCP Tools and Resources

**Entry criteria:** Phase 6 passes and `coverage/endpoints.yaml` has 100% public-useful coverage.

**Parallel dispatch:** Dispatch one implementer for the single task below: `src/features/mcp/servidor.py`.

**Completion gate:** `uv run pytest tests/test_servidor_mcp.py -q` passes; `uv run python -m src.features.mcp.servidor --transport stdio` starts without registering any write tool.

#### Task 7.1: Register Manifest-Backed FastMCP Tools

**Files:**
- Create exactly one file: `src/features/mcp/servidor.py`

- [ ] **Step 1: Load public operations and register only manifest-backed atomic tools**

```python
from pathlib import Path
from typing import Any

import yaml
from fastmcp import FastMCP

from src.features.catalogo.models import Operation
from src.features.consultas.servico import QueryService


def build_server(manifest_path: Path | None) -> FastMCP:
    server = FastMCP("MCP Compras Públicas Brasil")
    endpoints = []
    if manifest_path is not None:
        endpoints = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))["endpoints"]
    service = QueryService()
    for endpoint in endpoints:
        if endpoint["classification"] != "PUBLIC_USEFUL" or not endpoint["implemented"]:
            continue
        operation = Operation.model_validate(endpoint)
        add_atomic_tool(server, service, operation)
    return server
```

- [ ] **Step 2: Give each dynamic tool the OpenAPI-derived JSON schema**

Construct `FunctionTool` directly and pass the resolved OpenAPI parameters as its `parameters` schema before calling `server.add_tool()`. The closure must capture only `operation`; it must not expose it as an MCP parameter. This makes every manifest tool validate required path/query arguments and preserves documented `type`, `format`, bounds, descriptions and examples.

```python
from fastmcp.tools.function_tool import FunctionTool

def openapi_parameters_to_json_schema(parameters: list[dict[str, Any]]) -> dict[str, Any]:
    properties = {
        parameter["name"]: parameter.get("schema", {"type": "string"})
        for parameter in parameters
    }
    required = [parameter["name"] for parameter in parameters if parameter.get("required")]
    return {"type": "object", "properties": properties, "required": required, "additionalProperties": False}

def add_atomic_tool(server: FastMCP, service: QueryService, operation: Operation) -> None:
    async def consultar(**arguments: Any) -> dict[str, Any]:
        return (await service.execute(operation, arguments)).model_dump(mode="json")

    server.add_tool(FunctionTool(
        fn=consultar,
        name=operation.tool,
        description=operation.description,
        parameters=openapi_parameters_to_json_schema(operation.parameters),
    ))
```

- [ ] **Step 3: Add resources, semantic tools, diagnostics and the executable entry point to the same server module**

```python
# Add below the loop in build_server.
@server.tool(name="listar_capacidades_mcp")
def listar_capacidades_mcp() -> dict[str, Any]:
    return {"sources": ["compras", "pncp"], "atomic_tools": len(endpoints)}

@server.tool(name="verificar_saude_fontes")
async def verificar_saude_fontes() -> dict[str, str]:
    return {"compras": "configured", "pncp": "configured"}

@server.resource("mcp://coverage")
def coverage() -> dict[str, int]:
    return {"public_endpoints": len(endpoints)}

@server.tool(name="pncp_obter_contratacao_completa")
async def pncp_obter_contratacao_completa(cnpj: str, ano: int, sequencial_contratacao: int) -> dict[str, Any]:
    related = [endpoint for endpoint in endpoints if endpoint["provider"] == "pncp" and endpoint["path"].startswith("/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}")]
    operations = [Operation.model_validate(endpoint) for endpoint in related if endpoint["implemented"]]
    return await service.execute_many(operations, {"cnpj": cnpj, "ano": ano, "sequencial": sequencial_contratacao})

@server.tool(name="buscar_compras_publicas")
async def buscar_compras_publicas(texto: str, fonte: str = "todas") -> dict[str, Any]:
    selected = [endpoint for endpoint in endpoints if endpoint["classification"] == "PUBLIC_USEFUL" and (fonte == "todas" or endpoint["provider"] == fonte)]
    search = [Operation.model_validate(endpoint) for endpoint in selected if "pesquis" in endpoint["description"].lower()]
    return await service.execute_many(search, {"texto": texto})

@server.tool(name="pncp_obter_ata_completa")
async def pncp_obter_ata_completa(cnpj: str, ano: int, sequencial_contratacao: int, sequencial_ata: int) -> dict[str, Any]:
    related = [endpoint for endpoint in endpoints if endpoint["provider"] == "pncp" and "/atas/{sequencialAta}" in endpoint["path"]]
    operations = [Operation.model_validate(endpoint) for endpoint in related if endpoint["implemented"]]
    return await service.execute_many(operations, {"cnpj": cnpj, "ano": ano, "sequencial": sequencial_contratacao, "sequencialAta": sequencial_ata})

@server.tool(name="pncp_obter_contrato_completo")
async def pncp_obter_contrato_completo(cnpj: str, ano: int, sequencial_contrato: int) -> dict[str, Any]:
    related = [endpoint for endpoint in endpoints if endpoint["provider"] == "pncp" and "/contratos/{ano}/{sequencial" in endpoint["path"]]
    operations = [Operation.model_validate(endpoint) for endpoint in related if endpoint["implemented"]]
    return await service.execute_many(operations, {"cnpj": cnpj, "ano": ano, "sequencial": sequencial_contrato, "sequencialContrato": sequencial_contrato})

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--transport", choices=["stdio", "http"], default="stdio")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    build_server(Path("coverage/endpoints.yaml")).run(transport=args.transport, port=args.port)
```

Register `compras://coverage`, `compras://providers`, `compras://endpoints`, `compras://domains`, `pncp://domains` and `pncp://api-version` in the same builder, sourced solely from the loaded manifest and snapshots. Implement `verificar_saude_fontes` by asking `QueryService` to execute the catalogued lightweight operations (`pncp /v1/modalidades` and Compras indicadores), so the MCP tool itself never invokes an HTTP client.

- [ ] **Step 4: Run the MCP registry tests**

Run: `uv run pytest tests/test_servidor_mcp.py -q`

Expected: PASS. The sample manifest registers the atomic tool plus exactly the two diagnostic tools.

- [ ] **Step 5: Commit the file-scoped task**

```bash
git add src/features/mcp/servidor.py
git commit -m "feat: expose catalogued MCP tools and resources"
```

### Phase 8: Contract, Live, Read-Only and Drift Gates

**Entry criteria:** FastMCP tools are generated only from the complete manifest and all unit tests are green.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These independent verification files do not edit the same path: `tests/test_contracts.py`, `tests/test_live.py`, `.github/workflows/ci.yml`, `.github/workflows/upstream-drift.yml`.

**Completion gate:** local CI equivalent passes: `uv run ruff check .`, `uv run pyright`, `uv run pytest -m 'not live' -q`, `uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml`, and `rg -n "\.(post|put|patch|delete)\(" src/shared/http_readonly.py src/features/provedores` produces no matches.

#### Task 8.1: Add Contract and Safety Regression Tests

**Files:**
- Create exactly one file: `tests/test_contracts.py`

- [ ] **Step 1: Test manifest completeness and no operational write APIs**

```python
from pathlib import Path

import pytest
import yaml

from src.features.catalogo.catalogo import render_coverage
from src.features.mcp.servidor import build_server
from src.shared.http_readonly import ReadOnlyHttpClient


def test_manifest_has_complete_public_coverage():
    endpoints = yaml.safe_load(Path("coverage/endpoints.yaml").read_text(encoding="utf-8"))["endpoints"]
    report = render_coverage(endpoints)
    assert report.ratio == 1.0
    assert not [endpoint for endpoint in endpoints if endpoint["classification"] == "UNKNOWN"]


def test_http_boundary_exposes_no_write_operation():
    assert {"post", "put", "patch", "delete"}.isdisjoint(dir(ReadOnlyHttpClient))


@pytest.mark.asyncio
async def test_every_implemented_endpoint_has_a_registered_tool_and_contract_path():
    endpoints = yaml.safe_load(Path("coverage/endpoints.yaml").read_text(encoding="utf-8"))["endpoints"]
    expected = {
        endpoint["tool"]
        for endpoint in endpoints
        if endpoint["classification"] == "PUBLIC_USEFUL" and endpoint["implemented"]
    }
    server = build_server(Path("coverage/endpoints.yaml"))
    actual = {tool.name for tool in await server.list_tools()}
    assert expected <= actual
    assert all(endpoint["path"] for endpoint in endpoints)
```

- [ ] **Step 2: Run the test**

Run: `uv run pytest tests/test_contracts.py -q`

Expected: PASS.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add tests/test_contracts.py
git commit -m "test: gate coverage and read-only contract"
```

#### Task 8.2: Add Opt-In Production Smoke Tests

**Files:**
- Create exactly one file: `tests/test_live.py`

- [ ] **Step 1: Write public, lightweight live probes guarded by an environment flag**

```python
import os

import pytest

from src.shared.http_readonly import ReadOnlyHttpClient

pytestmark = pytest.mark.live


@pytest.mark.skipif(os.getenv("RUN_LIVE_TESTS") != "1", reason="live tests are opt-in")
@pytest.mark.parametrize(
    ("base_url", "path"),
    [
        ("https://pncp.gov.br/api/pncp", "/v1/modalidades"),
        ("https://dadosabertos.compras.gov.br", "/modulo-indicadores/1_consultarIndicadoresConsolidados"),
    ],
)
async def test_public_upstream_smoke(base_url: str, path: str):
    async with ReadOnlyHttpClient(base_url, max_retries=1, timeout=30) as client:
        assert await client.get(path) is not None
```

- [ ] **Step 2: Verify default CI never calls production**

Run: `uv run pytest tests/test_live.py -q`

Expected: `2 skipped`.

- [ ] **Step 3: Verify the probes against production once**

Run: `RUN_LIVE_TESTS=1 uv run pytest tests/test_live.py -q`

Expected: `2 passed`; record an upstream outage as an operational incident, not as an empty result.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add tests/test_live.py
git commit -m "test: add opt-in public upstream smoke checks"
```

#### Task 8.3: Gate Pull Requests

**Files:**
- Create exactly one file: `.github/workflows/ci.yml`

- [ ] **Step 1: Create a deterministic pull-request workflow**

```yaml
name: CI
on: [pull_request, push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync --all-groups --frozen
      - run: uv run ruff check .
      - run: uv run pyright
      - run: uv run pytest -m "not live" -q
      - run: uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
      - run: "! rg -n '\\.(post|put|patch|delete)\\(' src/shared/http_readonly.py src/features/provedores"
```

- [ ] **Step 2: Validate the workflow YAML**

Run: `uv run python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('valid')"`

Expected: prints `valid`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: enforce quality coverage and read-only gates"
```

#### Task 8.4: Detect Upstream Contract Drift on a Schedule

**Files:**
- Create exactly one file: `.github/workflows/upstream-drift.yml`

- [ ] **Step 1: Create the scheduled semantic-diff workflow**

```yaml
name: Upstream Drift
on:
  schedule:
    - cron: "17 5 * * 1-5"
  workflow_dispatch:
jobs:
  discover:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync --all-groups --frozen
      - run: uv run python -m src.features.catalogo.catalogo discover --official --compare coverage/endpoints.yaml --fail-on-diff
```

- [ ] **Step 2: Validate the workflow YAML**

Run: `uv run python -c "import yaml; yaml.safe_load(open('.github/workflows/upstream-drift.yml')); print('valid')"`

Expected: prints `valid`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add .github/workflows/upstream-drift.yml
git commit -m "ci: detect official API drift"
```

### Phase 9: Package, Containerize and Document the Server

**Entry criteria:** The complete quality gate in Phase 8 passes locally; all public GETs are covered by named atomic tools.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. Every documentation and deployment file is independent and file-scoped: `Dockerfile`, `docker-compose.yml`, `README.md`, `ARCHITECTURE.md`, `TOOLS.md`, `ENDPOINT_COVERAGE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.

**Completion gate:** `docker build -t mcp-compras-publicas-br .` exits 0; `uv run pytest -m 'not live' -q` passes after documentation changes; documentation links resolve locally; the generated coverage document reports 100%.

#### Task 9.1: Create a Non-Root Container Image

**Files:**
- Create exactly one file: `Dockerfile`

- [ ] **Step 1: Add the minimal immutable-runtime image**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN useradd --create-home --uid 10001 app
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
COPY src ./src
COPY coverage ./coverage
USER app
ENV MCP_TRANSPORT=stdio
CMD [".venv/bin/python", "-m", "src.features.mcp.servidor"]
```

- [ ] **Step 2: Build the image**

Run: `docker build -t mcp-compras-publicas-br .`

Expected: exits 0 and image configuration has user `app`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add Dockerfile
git commit -m "build: add non-root container image"
```

#### Task 9.2: Provide Local Streamable HTTP Composition

**Files:**
- Create exactly one file: `docker-compose.yml`

- [ ] **Step 1: Add only the MCP service, with no credential or Redis dependency**

```yaml
services:
  mcp:
    build: .
    environment:
      MCP_TRANSPORT: http
      HTTP_TIMEOUT: "30"
      CACHE_ENABLED: "true"
    ports:
      - "8000:8000"
    read_only: true
    tmpfs:
      - /tmp
```

- [ ] **Step 2: Validate Compose configuration**

Run: `docker compose config -q`

Expected: exits 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add docker-compose.yml
git commit -m "build: add local MCP compose service"
```

#### Task 9.3: Document Installation and Local Use

**Files:**
- Create exactly one file: `README.md`

- [ ] **Step 1: Document the supported transports, minimal configuration and verification commands**

````markdown
# MCP Compras Públicas Brasil

Servidor MCP somente leitura para os dados públicos oficiais do Compras.gov.br e PNCP.

## Local

```bash
uv sync --all-groups
uv run python -m src.features.mcp.servidor --transport stdio
```

## Verificação

```bash
uv run pytest -m "not live" -q
uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
```

Nenhuma ferramenta aceita URL arbitrária nem executa métodos HTTP de escrita.
````

- [ ] **Step 2: Verify commands match installed entry points**

Run: `uv run python -m src.features.mcp.servidor --help`

Expected: exits 0 and documents `--transport`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add README.md
git commit -m "docs: add setup and safety guide"
```

#### Task 9.4: Document Architectural Boundaries

**Files:**
- Create exactly one file: `ARCHITECTURE.md`

- [ ] **Step 1: Record the mandatory request flow and coverage source of truth**

```markdown
# Architecture

`MCP tool -> QueryService -> ComprasClient | PncpClient -> ReadOnlyHttpClient -> official API`

`coverage/endpoints.yaml` is derived from versioned OpenAPI snapshots. CI fails when a public useful GET lacks a manifest entry, a Portuguese tool name, or an implementation mapping.

The HTTP boundary has only `get()`, accepts only relative paths, and owns the two fixed official origins.
```

- [ ] **Step 2: Commit the file-scoped task**

```bash
git add ARCHITECTURE.md
git commit -m "docs: describe provider and coverage architecture"
```

#### Task 9.5: Generate the Tool Catalog Documentation

**Files:**
- Create exactly one file: `TOOLS.md`

- [ ] **Step 1: Generate a stable tool table from the manifest**

Run: `uv run python -m src.features.catalogo.catalogo render-tools coverage/endpoints.yaml --output TOOLS.md`

Expected: each `PUBLIC_USEFUL` entry appears once with provider, HTTP path, tool name, parameters and semantic description; metadata and diagnostic tools appear in their own section.

- [ ] **Step 2: Verify atomic tool count matches manifest**

Run: `uv run python -m src.features.catalogo.catalogo --check-tools TOOLS.md coverage/endpoints.yaml`

Expected: reports 169 atomic tools for the 2026-09-04 baseline and exits 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add TOOLS.md
git commit -m "docs: generate MCP tool catalog"
```

#### Task 9.6: Generate Endpoint Coverage Evidence

**Files:**
- Create exactly one file: `ENDPOINT_COVERAGE.md`

- [ ] **Step 1: Generate the audit report from the manifest**

Run: `uv run python -m src.features.catalogo.catalogo render-coverage coverage/endpoints.yaml --output ENDPOINT_COVERAGE.md`

Expected: lists every endpoint as implemented or explicitly excluded, reports 69 public Compras and 100 public PNCP GETs, and ends at 100% overall.

- [ ] **Step 2: Verify the document is fully generated**

Run: `uv run python -m src.features.catalogo.catalogo --check-coverage-doc ENDPOINT_COVERAGE.md coverage/endpoints.yaml`

Expected: exits 0.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add ENDPOINT_COVERAGE.md
git commit -m "docs: publish endpoint coverage evidence"
```

#### Task 9.7: Document Safe Contributions

**Files:**
- Create exactly one file: `CONTRIBUTING.md`

- [ ] **Step 1: Define the exact endpoint-change workflow**

```markdown
# Contributing

For a new upstream GET:

1. Run discovery against the official OpenAPI.
2. Commit its snapshot update.
3. Classify the new operation in `coverage/endpoints.yaml`.
4. Add a Portuguese name and semantic description.
5. Run contract, tool-registry and coverage checks.

Do not add POST, PUT, PATCH or DELETE support. Do not replace an upstream failure with an empty result.
```

- [ ] **Step 2: Commit the file-scoped task**

```bash
git add CONTRIBUTING.md
git commit -m "docs: define endpoint contribution workflow"
```

#### Task 9.8: Document Security Constraints

**Files:**
- Create exactly one file: `SECURITY.md`

- [ ] **Step 1: State the trust-boundary rules and reporting route**

```markdown
# Security

The server is read-only. It permits only relative GET paths beneath the fixed `dadosabertos.compras.gov.br` and `pncp.gov.br/api/pncp` origins. It stores no upstream credentials.

For remote deployment, terminate TLS before the service and require authentication, payload limits, concurrency limits and restrictive CORS at that deployment boundary.

Report vulnerabilities privately to the repository maintainers; do not include sensitive data in an issue.
```

- [ ] **Step 2: Commit the file-scoped task**

```bash
git add SECURITY.md
git commit -m "docs: define MCP security constraints"
```

#### Task 9.9: Start the Changelog

**Files:**
- Create exactly one file: `CHANGELOG.md`

- [ ] **Step 1: Record the initial unreleased scope**

```markdown
# Changelog

## Unreleased

- Initial read-only MCP server for public Compras.gov.br and PNCP GET endpoints.
- Versioned OpenAPI snapshots, coverage manifest and drift gate.
```

- [ ] **Step 2: Commit the file-scoped task**

```bash
git add CHANGELOG.md
git commit -m "docs: add changelog"
```

## Final Acceptance Checklist

- [ ] `uv run ruff check .` exits 0.
- [ ] `uv run pyright` exits 0.
- [ ] `uv run pytest -m "not live" -q` exits 0.
- [ ] `RUN_LIVE_TESTS=1 uv run pytest tests/test_live.py -q` passes when both upstreams are operational.
- [ ] `uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml` reports 100% for each provider and overall, with zero `UNKNOWN` endpoint.
- [ ] `rg -n "\.(post|put|patch|delete)\(" src/shared/http_readonly.py src/features/provedores` has no result, and `tests/test_http_readonly.py` passes.
- [ ] Every public endpoint entry has a unique Portuguese atomic tool, semantic description, schema derived from documented parameters, provenance and a contract test path.
- [ ] `docker build -t mcp-compras-publicas-br .` and `docker compose config -q` exit 0.

## Self-Review

- **Spec coverage:** The plan covers official snapshot discovery, public/authenticated classification, manifest mapping, 100% coverage gate, GET-only/SSRF protection, separate clients, validation, pagination without fabricated totals, provenance, normal errors, cache/settings, atomic/composite/federated tool registry, smoke/contract/drift tests, CI, containers and the seven required documents. Composite tools are sequenced after atomic coverage and cannot dilute it.
- **Placeholder scan:** No task leaves unscoped implementation work or generic handling instructions. The one human review is necessarily bounded: the generated manifest has exactly one entry per pinned official GET and the completion gate enumerates the required review properties.
- **Type consistency:** `Operation`, `CoverageReport`, `McpResponse`, `ReadOnlyHttpClient`, `ComprasClient`, `PncpClient`, `QueryService`, and `build_server` use the same names in their defining and consuming tasks. Tool registration is manifest-driven, so the endpoint count changes only with a reviewed catalog update.
- **Phase/file mapping:** Each phase has entry criteria, an explicit parallel-dispatch declaration and a measurable completion gate. Each task creates or modifies one file only; every planned changed file appears in exactly one task.
