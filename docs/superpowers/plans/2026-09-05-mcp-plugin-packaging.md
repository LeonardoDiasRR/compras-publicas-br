# Cross-Platform Agent Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o MCP Compras Públicas Brasil como pacote PyPI instalável via `uvx`, capaz de registrar, atualizar e remover o servidor e uma skill em dez alvos de agentes de código nos três sistemas operacionais.

**Architecture:** Um `InstallerService` compartilhado resolve escopo, versão, arquivos e escrita atômica. Um registro de adaptadores encapsula os formatos e CLIs oficiais de cada agente, enquanto o adaptador `generic` escreve o manifesto `.agent`; o servidor MCP existente continua separado e executável via `stdio`.

**Tech Stack:** Python 3.12+, uv/uvx, FastMCP 3.2.4, httpx, Pydantic, `tomlkit`, `json5`, `packaging`, PyYAML, pytest, pytest-asyncio, respx, Ruff, Pyright, GitHub Actions e PyPI Trusted Publishing.

---

## Contexto e Mapa de Arquivos

O repositório já contém o servidor MCP, o manifesto de cobertura e os testes
existentes. O plano adiciona o instalador sem mover o código atual do servidor.

### Arquivos de código novos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/features/plugin/modelos.py` | Tipos imutáveis para agente, escopo, registro MCP, skill e resultado de operação. |
| `src/features/plugin/escopo.py` | Resolução de escopo, raiz Git, diretórios globais e aviso de fallback. |
| `src/features/plugin/armazenamento.py` | Leitura, merge, reconhecimento, escrita atômica e remoção de configurações JSON/TOML/JSON5. |
| `src/features/plugin/versoes.py` | Versão instalada e consulta da versão estável mais recente no PyPI. |
| `src/features/plugin/templates/skill.md` | Template empacotado da skill gerenciada em português. |
| `src/features/plugin/skills.py` | Renderização, reconhecimento, atualização e remoção das skills. |
| `src/features/plugin/adaptadores.py` | Registro e adaptadores dos nove agentes e do alvo `generic`. |
| `src/features/plugin/instalador.py` | Orquestração de `install`, `update` e `uninstall`. |
| `src/features/plugin/cli.py` | Entry point, parsing de argumentos, saída e códigos de erro. |

### Arquivos de teste novos

| Arquivo | Cobertura |
| --- | --- |
| `tests/test_plugin_scope.py` | Escopo padrão, raiz Git e fallback sem Git. |
| `tests/test_plugin_storage.py` | Parsers, merge, conflitos, escrita atômica e permissões. |
| `tests/test_plugin_version.py` | Versão instalada, PyPI, releases inválidas e falhas de rede. |
| `tests/test_plugin_skills.py` | Marcadores, renderização, update e remoção segura. |
| `tests/test_plugin_adapters.py` | IDs, caminhos, formatos, comandos e validação dos dez adaptadores. |
| `tests/test_plugin_installer.py` | Fluxos de instalação, atualização, remoção e idempotência. |
| `tests/test_plugin_cli.py` | CLI, argumentos, saída e códigos de retorno. |
| `tests/test_plugin_package.py` | Entry point e recursos presentes no wheel. |

### Arquivos existentes modificados ou removidos

- Modificar `pyproject.toml` para entry point e dependências de serialização.
- Atualizar `uv.lock` após a mudança de dependências.
- Atualizar `.github/workflows/ci.yml` com testes multiplataforma e package smoke test.
- Atualizar `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md` e
  `CHANGELOG.md` com o fluxo de pacote e a remoção do Docker.
- Excluir `Dockerfile` e `docker-compose.yml`.
- Criar `docs/agents/README.md` e uma instrução por alvo:
  `claude-code.md`, `codex.md`, `opencode.md`, `deepseek-harness.md`,
  `pi.md`, `antigravity.md`, `cursor.md`, `hermes-agent.md`, `openclaw.md` e
  `generic.md`.

Cada arquivo acima aparece em exatamente uma tarefa nas fases abaixo.

## Contratos Fixos

Os implementadores devem preservar estes contratos durante todas as fases:

```python
type AgentId = Literal[
    "claude-code",
    "codex",
    "opencode",
    "deepseek-harness",
    "pi",
    "antigravity",
    "cursor",
    "hermes-agent",
    "openclaw",
    "generic",
]
type ScopeName = Literal["project", "user"]
```

O registro sempre usará o nome `compras-publicas-br` e o comando:

```text
uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
```

O instalador não detectará automaticamente o agente. `--agent` é obrigatório;
`--scope` é opcional e assume `project`.

## Fases

### Phase 1: Contracts and Red Tests

**Entry criteria:** A spec aprovada está em `docs/superpowers/specs/2026-09-05-mcp-plugin-packaging-design.md`; o branch contém o servidor MCP existente e a árvore está limpa antes de iniciar.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tasks must not depend on one another or edit the same file.

**Completion gate:** `uv sync --all-groups` deve passar. Cada teste novo deve ser executado e falhar por módulo/contrato ainda não implementado; nenhum teste existente pode regredir.

#### Task 1.1: Configure Package Entry Point and Dependencies

**Files:**
- Modify exactly one file: `pyproject.toml`

- [ ] **Step 1: Add the runtime dependencies and console entry point**

Adicionar `tomlkit` e `json5` às dependências de runtime e este bloco ao
`[project]`, sem alterar as versões existentes do servidor:

```toml
"tomlkit>=0.13,<1",
"json5>=0.10,<1",
"packaging>=24,<26",
```

```toml
[project.scripts]
mcp-compras-publicas-br = "src.features.plugin.cli:main"
```

- [ ] **Step 2: Resolve the project environment**

Run: `uv sync --all-groups`

Expected: exit code `0`, com as dependências resolvidas.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add pyproject.toml
git commit -m "build: add plugin installer entry point"
```

#### Task 1.2: Specify Scope Behavior Tests

**Files:**
- Create exactly one file: `tests/test_plugin_scope.py`

- [ ] **Step 1: Write the failing tests**

Criar testes que exijam estas funções públicas:

```python
from pathlib import Path

from src.features.plugin.escopo import find_project_root, resolve_scope


def test_find_project_root_walks_up_to_git_directory(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    (root / ".git").mkdir(parents=True)
    nested = root / "src" / "feature"
    nested.mkdir(parents=True)

    assert find_project_root(nested) == root


def test_missing_git_uses_current_directory_and_warns(tmp_path: Path, caplog) -> None:
    result = resolve_scope("project", tmp_path)

    assert result.root == tmp_path
    assert result.used_git_root is False
    assert "Git" in caplog.text
    assert "diretório atual" in caplog.text


def test_user_scope_does_not_depend_on_current_directory(tmp_path: Path) -> None:
    result = resolve_scope("user", tmp_path)

    assert result.scope == "user"
    assert result.used_git_root is False
```

Os testes devem usar `caplog` para verificar o aviso, não imprimir nem
inspecionar mensagens incidentalmente.

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_scope.py -q`

Expected: FAIL porque `src.features.plugin.escopo` ainda não existe.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_scope.py
git commit -m "test: specify plugin scope resolution"
```

#### Task 1.3: Specify Storage Tests

**Files:**
- Create exactly one file: `tests/test_plugin_storage.py`

- [ ] **Step 1: Write the failing tests**

Criar uma API de armazenamento com `load_document`, `merge_mcp_entry`,
`remove_mcp_entry` e `atomic_write`. Os testes devem exigir:

```python
import json
from pathlib import Path

from src.features.plugin.armazenamento import (
    atomic_write,
    load_document,
    merge_mcp_entry,
    remove_mcp_entry,
)


def test_json_merge_preserves_unrelated_servers(tmp_path: Path) -> None:
    path = tmp_path / "mcp.json"
    path.write_text(json.dumps({"mcpServers": {"other": {"command": "other"}}}), encoding="utf-8")
    entry = {"command": "uvx", "args": ["--from", "mcp-compras-publicas-br==0.1.0"]}

    document = load_document(path, "json")
    merged, changed = merge_mcp_entry(document, ("mcpServers",), "compras-publicas-br", entry, lambda value: value == entry)

    assert changed is True
    assert merged["mcpServers"]["other"] == {"command": "other"}
    assert merged["mcpServers"]["compras-publicas-br"] == entry


def test_unrecognized_existing_entry_is_not_overwritten() -> None:
    document = {"mcpServers": {"compras-publicas-br": {"command": "custom"}}}
    entry = {"command": "uvx", "args": ["--from", "mcp-compras-publicas-br==0.1.0"]}

    merged, changed = merge_mcp_entry(document, ("mcpServers",), "compras-publicas-br", entry, lambda value: value == entry)

    assert merged == document
    assert changed is False


def test_atomic_write_replaces_file_without_leaving_temp_file(tmp_path: Path) -> None:
    path = tmp_path / "config.json"
    atomic_write(path, '{"ok": true}\n')

    assert path.read_text(encoding="utf-8") == '{"ok": true}\n'
    assert list(tmp_path.glob("*.tmp")) == []


def test_remove_mcp_entry_only_removes_matching_entry() -> None:
    document = {"mcpServers": {"compras-publicas-br": {"command": "uvx"}, "other": {}}}

    result, removed = remove_mcp_entry(document, ("mcpServers",), "compras-publicas-br", lambda value: value == {"command": "uvx"})

    assert removed is True
    assert result == {"mcpServers": {"other": {}}}
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_storage.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_storage.py
git commit -m "test: specify plugin config storage"
```

#### Task 1.4: Specify Version Resolution Tests

**Files:**
- Create exactly one file: `tests/test_plugin_version.py`

- [ ] **Step 1: Write the failing tests**

Exigir `installed_version()` e `latest_stable_version(fetcher)`:

```python
from src.features.plugin.versoes import latest_stable_version, versioned_command


def test_versioned_command_pins_exact_release() -> None:
    assert versioned_command("0.1.0") == [
        "uvx", "--from", "mcp-compras-publicas-br==0.1.0", "mcp-compras-publicas-br"
    ]


def test_latest_stable_version_ignores_prereleases() -> None:
    payload = {"releases": {"0.1.0": [{}], "0.2.0rc1": [{}], "0.0.9": [{}]}}

    assert latest_stable_version(lambda: payload) == "0.1.0"


def test_latest_stable_version_rejects_empty_or_invalid_payload() -> None:
    for payload in ({"releases": {}}, {"releases": {"not-a-version": [{}]}}):
        try:
            latest_stable_version(lambda payload=payload: payload)
        except ValueError:
            pass
        else:
            raise AssertionError("expected ValueError")
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_version.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_version.py
git commit -m "test: specify plugin version resolution"
```

#### Task 1.5: Specify Skill Tests

**Files:**
- Create exactly one file: `tests/test_plugin_skills.py`

- [ ] **Step 1: Write the failing tests**

Exigir `render_skill`, `is_managed_skill` e `remove_managed_skill`:

```python
from pathlib import Path

from src.features.plugin.skills import is_managed_skill, remove_managed_skill, render_skill


def test_rendered_skill_has_agent_and_management_marker() -> None:
    content = render_skill("codex", "Codex", "project")

    assert "managed-by: mcp-compras-publicas-br" in content
    assert "Codex" in content
    assert "somente leitura" in content


def test_unmanaged_skill_is_preserved(tmp_path: Path) -> None:
    path = tmp_path / "SKILL.md"
    path.write_text("custom", encoding="utf-8")

    assert is_managed_skill(path) is False
    assert remove_managed_skill(path) is False
    assert path.read_text(encoding="utf-8") == "custom"
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_skills.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_skills.py
git commit -m "test: specify managed plugin skills"
```

#### Task 1.6: Specify Adapter Registry Tests

**Files:**
- Create exactly one file: `tests/test_plugin_adapters.py`

- [ ] **Step 1: Write the failing tests**

Exigir `get_adapter`, `supported_agent_ids` e `McpRegistration`:

```python
from pathlib import Path

from src.features.plugin.adaptadores import get_adapter, supported_agent_ids


EXPECTED = {
    "claude-code", "codex", "opencode", "deepseek-harness", "pi",
    "antigravity", "cursor", "hermes-agent", "openclaw", "generic",
}


def test_all_declared_agents_are_registered() -> None:
    assert set(supported_agent_ids()) == EXPECTED


def test_generic_adapter_resolves_project_manifest() -> None:
    adapter = get_adapter("generic")
    target = adapter.resolve_target("project", project_root=Path("C:/repo"), home=Path("C:/home"))

    assert target.config_path.as_posix().endswith("C:/repo/.agent/mcp.json")
    assert target.skill_path.as_posix().endswith("C:/repo/.agent/skills/compras-publicas-br.md")


def test_unknown_agent_is_rejected() -> None:
    try:
        get_adapter("unknown")
    except ValueError as error:
        assert "unknown" in str(error)
    else:
        raise AssertionError("expected ValueError")
```

Os testes adicionais devem verificar que cada adaptador declara escopo global,
escopo de projeto, formato, nome da skill e comando de validação; os valores
devem ser os documentados pelas fontes oficiais consultadas no próprio task de
implementação.

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_adapters.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_adapters.py
git commit -m "test: specify agent adapter registry"
```

#### Task 1.7: Specify Installer Tests

**Files:**
- Create exactly one file: `tests/test_plugin_installer.py`

- [ ] **Step 1: Write the failing tests**

Exigir `InstallerService.install`, `.update` e `.uninstall` com um adaptador
fake e filesystem temporário:

```python
from pathlib import Path

from src.features.plugin.instalador import InstallerService


def test_install_is_idempotent_and_preserves_other_entries(tmp_path: Path) -> None:
    service = InstallerService.for_testing(tmp_path, agent="generic")

    first = service.install()
    before = first.config_path.read_text(encoding="utf-8")
    second = service.install()

    assert first.changed is True
    assert second.changed is False
    assert second.config_path.read_text(encoding="utf-8") == before


def test_update_changes_only_pinned_version(tmp_path: Path) -> None:
    service = InstallerService.for_testing(tmp_path, agent="generic", latest_version="0.2.0")
    service.install()

    result = service.update()

    assert result.changed is True
    assert "mcp-compras-publicas-br==0.2.0" in result.config_path.read_text(encoding="utf-8")


def test_uninstall_removes_managed_entry_and_skill(tmp_path: Path) -> None:
    service = InstallerService.for_testing(tmp_path, agent="generic")
    service.install()

    result = service.uninstall()

    assert result.changed is True
    assert "compras-publicas-br" not in result.config_path.read_text(encoding="utf-8")
    assert not result.skill_path.exists()
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_installer.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_installer.py
git commit -m "test: specify plugin lifecycle service"
```

#### Task 1.8: Specify CLI Tests

**Files:**
- Create exactly one file: `tests/test_plugin_cli.py`

- [ ] **Step 1: Write the failing tests**

Exigir `main(argv)` sem sair diretamente do processo durante o teste. O teste
de escopo deve mudar o diretório de trabalho com `monkeypatch.chdir`, pois a
CLI não terá um override adicional de raiz:

```python
from src.features.plugin.cli import main


def test_agent_is_required() -> None:
    assert main(["install"]) == 2


def test_default_scope_is_project(monkeypatch, tmp_path) -> None:
    calls = []
    monkeypatch.setattr("src.features.plugin.cli.run_operation", lambda **kwargs: calls.append(kwargs))
    monkeypatch.chdir(tmp_path)

    assert main(["install", "--agent", "generic"]) == 0
    assert calls[0]["scope"] == "project"


def test_user_scope_is_forwarded(monkeypatch) -> None:
    calls = []
    monkeypatch.setattr("src.features.plugin.cli.run_operation", lambda **kwargs: calls.append(kwargs))

    assert main(["uninstall", "--agent", "codex", "--scope", "user"]) == 0
    assert calls[0]["scope"] == "user"
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `uv run pytest tests/test_plugin_cli.py -q`

Expected: FAIL por módulo ausente.

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_plugin_cli.py
git commit -m "test: specify plugin installer CLI"
```

### Phase 2: Plugin Models

**Entry criteria:** Phase 1 terminou com os testes novos presentes e vermelhos; `uv sync --all-groups` passa.

**Parallel dispatch:** Dispatch the single implementer for the task below. The task has no dependency on another implementation file.

**Completion gate:** `uv run pyright src/features/plugin/modelos.py` passa e o arquivo de modelos pode ser importado por um teste isolado.

#### Task 2.1: Define Plugin Models

**Files:**
- Create exactly one file: `src/features/plugin/modelos.py`

- [ ] **Step 1: Implement the typed value objects**

Definir `AgentId`, `ScopeName`, `ScopeTarget`, `McpRegistration`,
`OperationResult` e exceções `PluginError`, `ConfigConflictError` e
`ConfigFormatError`. `McpRegistration` deve expor `as_mapping()` e conter
`command`, `args`, `version` e `managed_package`; `OperationResult` deve
conter `changed`, `config_path`, `skill_path`, `version` e `warnings`.

Usar `@dataclass(frozen=True, slots=True)` e `Literal`; não usar `Any` para
esses valores públicos.

- [ ] **Step 2: Run the focused type check**

Run: `uv run pyright src/features/plugin/modelos.py`

Expected: `0 errors, 0 warnings, 0 informations`.

- [ ] **Step 3: Run the related tests**

Run: `uv run pytest tests/test_plugin_scope.py tests/test_plugin_storage.py tests/test_plugin_version.py -q`

Expected: ainda haverá falhas nos módulos de escopo, armazenamento e versão;
essas falhas serão resolvidas pelas tarefas 2.2, 2.3 e 2.4 antes do gate.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/modelos.py
git commit -m "feat: add plugin installer models"
```

### Phase 3: Core Utilities

**Entry criteria:** Phase 2 terminou com `src/features/plugin/modelos.py` commitado e tipado.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tasks must not depend on one another or edit the same file.

**Completion gate:** Os testes de escopo, armazenamento e versão passam; `uv run ruff check src/features/plugin tests/test_plugin_scope.py tests/test_plugin_storage.py tests/test_plugin_version.py` passa.

#### Task 3.1: Implement Scope Resolution

**Files:**
- Create exactly one file: `src/features/plugin/escopo.py`

- [ ] **Step 1: Implement the exact resolution rules**

Implementar:

```python
def find_project_root(start: Path) -> Path | None: ...
def resolve_scope(scope: ScopeName, start: Path, home: Path | None = None) -> ScopeTarget: ...
```

`find_project_root` deve testar `start` e cada pai até a raiz pela existência de
`.git`. `resolve_scope("project", start)` deve retornar a raiz Git quando
encontrada; sem Git deve retornar `start.resolve()`, registrar `WARNING` com as
expressões `Git` e `diretório atual`, e marcar `used_git_root=False`. O escopo
`user` deve retornar o `Path.home()` fornecido ou real e não deve procurar Git.

- [ ] **Step 2: Run the focused tests**

Run: `uv run pytest tests/test_plugin_scope.py -q`

Expected: todos passam.

- [ ] **Step 3: Run lint and type checks**

Run: `uv run ruff check src/features/plugin/escopo.py tests/test_plugin_scope.py`

Expected: `All checks passed!`.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/escopo.py
git commit -m "feat: resolve project and user plugin scopes"
```

#### Task 3.2: Implement Configuration Storage

**Files:**
- Create exactly one file: `src/features/plugin/armazenamento.py`

- [ ] **Step 1: Implement format-aware document operations**

Implementar estas assinaturas:

```python
def load_document(path: Path, format_name: Literal["json", "json5", "toml"]) -> dict[str, object]: ...
def merge_mcp_entry(document: dict[str, object], container_path: tuple[str, ...], name: str, entry: dict[str, object], owns: Callable[[object], bool]) -> tuple[dict[str, object], bool]: ...
def remove_mcp_entry(document: dict[str, object], container_path: tuple[str, ...], name: str, owns: Callable[[object], bool]) -> tuple[dict[str, object], bool]: ...
def atomic_write(path: Path, content: str) -> None: ...
```

`load_document` deve retornar um dicionário de topo e lançar `ConfigFormatError`
para conteúdo inválido. `merge_mcp_entry` e `remove_mcp_entry` devem percorrer
o `container_path` declarado pelo adaptador, criando somente os mapas ausentes,
preservando todas as outras chaves e só substituindo uma entrada existente
quando `owns(value)` retornar verdadeiro. Em caso de conflito não reconhecido,
retornar o documento original e `False`. JSON deve usar indentação de dois
espaços e newline final; JSON5 deve ser serializado sem apagar chaves não
relacionadas; TOML deve usar `tomlkit` para preservar comentários e estrutura
tanto quanto o parser permitir. `atomic_write` deve criar o arquivo temporário
no mesmo diretório, usar `os.replace` e remover o temporário em qualquer
exceção.

- [ ] **Step 2: Run focused storage tests**

Run: `uv run pytest tests/test_plugin_storage.py -q`

Expected: todos passam.

- [ ] **Step 3: Verify invalid documents and path creation**

Run: `uv run pytest tests/test_plugin_storage.py -q -k "invalid or atomic or preserve"`

Expected: todos os testes selecionados passam, incluindo erro de parser sem
alterar o arquivo original.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/armazenamento.py
git commit -m "feat: add safe plugin config storage"
```

#### Task 3.3: Implement PyPI Version Resolution

**Files:**
- Create exactly one file: `src/features/plugin/versoes.py`

- [ ] **Step 1: Implement version helpers**

Implementar:

```python
def installed_version() -> str: ...
def versioned_command(version: str) -> list[str]: ...
def latest_stable_version(fetcher: Callable[[], Mapping[str, object]] | None = None) -> str: ...
```

`installed_version` deve usar `importlib.metadata.version("mcp-compras-publicas-br")`.
`versioned_command` deve retornar exatamente `['uvx', '--from',
'mcp-compras-publicas-br==<version>', 'mcp-compras-publicas-br']`.
`latest_stable_version` deve consultar
`https://pypi.org/pypi/mcp-compras-publicas-br/json` com o cliente existente
ou stdlib, rejeitar HTTP não-2xx, excluir versões pre-release/dev inválidas
para a política do pacote usando `packaging.version.Version`, e lançar
`PluginError` sem escrever arquivos se não houver release estável.

- [ ] **Step 2: Run focused version tests**

Run: `uv run pytest tests/test_plugin_version.py -q`

Expected: todos passam.

- [ ] **Step 3: Verify the real metadata URL is not used by unit tests**

Run: `uv run pytest tests/test_plugin_version.py -q --disable-warnings`

Expected: todos passam sem requisição de rede, usando o fetcher injetado.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/versoes.py
git commit -m "feat: resolve pinned plugin versions"
```

#### Task 3.4: Refresh the Lockfile

**Files:**
- Modify exactly one file: `uv.lock`

- [ ] **Step 1: Regenerate the lockfile from the committed project metadata**

Run: `uv lock`

Expected: `uv.lock` includes `tomlkit` and `json5`, sem alterar manualmente
o conteúdo de `pyproject.toml`.

- [ ] **Step 2: Verify reproducible sync**

Run: `uv sync --locked --all-groups`

Expected: exit code `0` sem erro de lock desatualizado.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add uv.lock
git commit -m "build: lock plugin installer dependencies"
```

### Phase 4: Skill Template

**Entry criteria:** Phase 3 completion gate passa; os modelos, escopo,
armazenamento e resolução de versão estão disponíveis.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** O template UTF-8 existe no caminho empacotado e começa com o marcador de gerenciamento.

#### Task 4.1: Add Skill Template

**Files:**
- Create exactly one file: `src/features/plugin/templates/skill.md`

- [ ] **Step 1: Create the package resource**

O arquivo deve começar com o marcador:

```markdown
<!-- managed-by: mcp-compras-publicas-br; format: 1 -->
# Compras Públicas Brasil
```

O template deve conter os tokens literais `{{AGENT_ID}}`, `{{AGENT_NAME}}`,
`{{SCOPE}}` e instruções em português cobrindo fontes oficiais, preferência por
tools semânticas, uso atômico quando necessário, modo somente leitura,
paginação, limites, erros upstream e proveniência.

- [ ] **Step 2: Verify the resource is plain UTF-8 Markdown**

Run: `uv run python -c "from pathlib import Path; p=Path('src/features/plugin/templates/skill.md'); assert p.read_text(encoding='utf-8').startswith('<!-- managed-by: mcp-compras-publicas-br; format: 1 -->')"`

Expected: exit code `0`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add src/features/plugin/templates/skill.md
git commit -m "feat: add managed agent skill template"
```

### Phase 5: Managed Skills

**Entry criteria:** Phase 4 completion gate passa e o template está disponível como recurso do pacote.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** `uv run pytest tests/test_plugin_skills.py -q`, Ruff e Pyright passam.

#### Task 5.1: Implement Skill Management

**Files:**
- Create exactly one file: `src/features/plugin/skills.py`

- [ ] **Step 1: Implement skill functions**

Implementar:

```python
MANAGED_MARKER = "managed-by: mcp-compras-publicas-br; format: 1"

def render_skill(agent_id: str, agent_name: str, scope: str) -> str: ...
def is_managed_skill(path: Path) -> bool: ...
def write_managed_skill(path: Path, agent_id: str, agent_name: str, scope: str) -> bool: ...
def remove_managed_skill(path: Path) -> bool: ...
```

Ler o template por `importlib.resources`, substituir os quatro tokens, garantir
newline final e escrever somente quando o conteúdo mudar. `is_managed_skill`
deve ler apenas o início do arquivo e exigir o marcador completo. Uma skill sem
marcador nunca pode ser substituída ou removida; nesse caso a função de escrita
deve retornar `False` e o orquestrador emitirá aviso.

- [ ] **Step 2: Run skill tests**

Run: `uv run pytest tests/test_plugin_skills.py -q`

Expected: todos passam.

- [ ] **Step 3: Run package type checks**

Run: `uv run ruff check src/features/plugin/skills.py tests/test_plugin_skills.py; uv run pyright`

Expected: Ruff `All checks passed!`; Pyright `0 errors, 0 warnings, 0 informations`.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/skills.py
git commit -m "feat: manage agent-specific skills"
```

### Phase 6: Agent Adapters

**Entry criteria:** Phase 5 completion gate passa; template e gerenciador de
skills estão disponíveis.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tasks must not depend on one another or edit the same file.

**Completion gate:** `uv run pytest tests/test_plugin_adapters.py -q` passa e o
registro contém exatamente os dez IDs declarados.

#### Task 6.1: Implement Agent Adapter Registry

**Files:**
- Create exactly one file: `src/features/plugin/adaptadores.py`

- [ ] **Step 1: Verify official formats before coding constants**

Consultar as documentações oficiais atuais de cada agente e registrar no código
os locais de projeto/global, formato, local da skill e CLI nativo quando
existente. Fontes mínimas já confirmadas para a matriz são:

- Claude Code: `claude mcp add/remove`, `.mcp.json` e `~/.claude.json`.
- Codex: `codex mcp add`, `config.toml`, `.codex/config.toml` e
  `~/.codex/config.toml`.
- OpenClaw: `openclaw mcp add`, `mcp.servers` e configuração JSON5.
- Cursor, OpenCode, DeepSeek Harness, Pi, Antigravity e Hermes Agent devem
  usar somente os caminhos documentados por seus fornecedores; se um CLI não
  existir, o adaptador deve usar o serializer nativo correspondente.

Não inferir caminhos a partir de nomes de ferramentas ou de outro agente.

- [ ] **Step 2: Implement the common adapter API**

Implementar:

```python
@dataclass(frozen=True, slots=True)
class AgentTarget:
    config_path: Path
    config_format: Literal["json", "json5", "toml"]
    container_path: tuple[str, ...]
    skill_path: Path
    native_add: tuple[str, ...] | None
    native_remove: tuple[str, ...] | None


class AgentAdapter(Protocol):
    agent_id: str
    display_name: str

    def resolve_target(self, scope: ScopeName, project_root: Path, home: Path) -> AgentTarget: ...
    def build_entry(self, version: str) -> dict[str, object]: ...
    def owns_entry(self, value: object) -> bool: ...
    def validate_target(self, target: AgentTarget) -> None: ...
```

Registrar exatamente os nove agentes e `generic`. Todos devem gerar o mesmo
comando `uvx` versionado. O `generic` deve usar `.agent/mcp.json` e
`.agent/skills/compras-publicas-br.md` no projeto, e a mesma árvore dentro do
diretório global escolhido no escopo `user`; seu manifesto deve conter
`mcpServers` e os metadados `managedBy.package` e `managedBy.schemaVersion`.
Adaptadores com configurações diferentes devem declarar o caminho nativo, por
exemplo `("mcp_servers",)` para Codex e `("mcp", "servers")` para OpenClaw,
em vez de transformar o arquivo para o formato genérico.

- [ ] **Step 3: Validate native targets without executing user commands**

`validate_target` deve rejeitar caminhos fora do diretório base, formatos
desconhecidos e comandos nativos sem executable/argumentos definidos pelo
adaptador. O código não deve executar texto lido dos arquivos de configuração.

- [ ] **Step 4: Run adapter tests**

Run: `uv run pytest tests/test_plugin_adapters.py -q`

Expected: todos passam; `set(supported_agent_ids())` contém exatamente os dez
IDs e nenhuma entrada extra.

- [ ] **Step 5: Run lint and types**

Run: `uv run ruff check src/features/plugin/adaptadores.py tests/test_plugin_adapters.py; uv run pyright`

Expected: sem erros.

- [ ] **Step 6: Commit the file-scoped task**

```bash
git add src/features/plugin/adaptadores.py
git commit -m "feat: add hybrid agent adapters"
```

### Phase 7: Installer Service

**Entry criteria:** Phase 6 completion gate passa; todos os adaptadores resolvem
targets válidos e o servidor existente continua importável.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** `uv run pytest tests/test_plugin_installer.py -q` passa e o serviço não importa FastMCP.

#### Task 7.1: Implement Installer Service

**Files:**
- Create exactly one file: `src/features/plugin/instalador.py`

- [ ] **Step 1: Implement the lifecycle service**

Implementar:

```python
class InstallerService:
    @classmethod
    def for_testing(cls, root: Path, agent: str, latest_version: str | None = None) -> "InstallerService": ...

    def install(self) -> OperationResult: ...
    def update(self) -> OperationResult: ...
    def uninstall(self) -> OperationResult: ...
```

O construtor deve receber adaptador, escopo resolvido, resolver de versão e
`home`. `install` deve obter a versão instalada, montar a entrada, fazer merge,
renderizar a skill e escrever somente quando necessário. `update` deve exigir
entrada reconhecível, obter a release estável mais recente e, em uma operação
planejada antes da escrita, atualizar config e skill; falha no PyPI deve deixar
ambos intactos. `uninstall` deve remover entrada e skill apenas quando
reconhecidas. Conflito não reconhecido deve retornar `OperationResult(changed=False)`
com warning explícito.

Todas as alterações devem ser preparadas antes da primeira escrita para evitar
configuração parcialmente instalada. O serviço não deve importar FastMCP nem
fazer requisições às APIs de Compras/PNCP.

- [ ] **Step 2: Run lifecycle tests**

Run: `uv run pytest tests/test_plugin_installer.py -q`

Expected: todos passam.

- [ ] **Step 3: Verify failure atomicity**

Run: `uv run pytest tests/test_plugin_installer.py -q -k "update or conflict"`

Expected: todos passam e os arquivos permanecem byte-a-byte iguais quando a
versão remota falha ou existe conflito.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/instalador.py
git commit -m "feat: add plugin install update uninstall service"
```

### Phase 8: Installer CLI

**Entry criteria:** Phase 7 completion gate passa; `InstallerService` está disponível.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** `uv run pytest tests/test_plugin_cli.py -q` passa e os três subcomandos aparecem no help.

#### Task 8.1: Implement Installer CLI

**Files:**
- Create exactly one file: `src/features/plugin/cli.py`

- [ ] **Step 1: Implement parser and dispatch**

Implementar `main(argv: Sequence[str] | None = None) -> int` com subcomandos
`install`, `update` e `uninstall`, opção obrigatória `--agent`, opção
`--scope {project,user}` com default `project`. `run_operation(**kwargs)` deve construir o escopo,
adaptador e `InstallerService`, executar o método pedido e imprimir agente,
escopo, caminhos, versão, mudanças e warnings.

Retornos obrigatórios:

```text
0 = operação concluída, inclusive quando idempotente
2 = argumentos inválidos ou agente desconhecido
3 = arquivo/configuração inválida ou conflito não resolvível
4 = falha externa ao consultar PyPI ou CLI nativo
```

Não usar `input()`: a ausência de `--scope` assume `project`. Erros devem ir
para stderr sem traceback por padrão; o processo só deve mostrar traceback com
uma opção interna de desenvolvimento, não exposta na documentação.

- [ ] **Step 2: Run CLI tests**

Run: `uv run pytest tests/test_plugin_cli.py -q`

Expected: todos passam.

- [ ] **Step 3: Verify the installed command surface**

Run: `uv run python -m src.features.plugin.cli --help`

Expected: mostra `install`, `update` e `uninstall`.

Run: `uv run python -m src.features.plugin.cli install --help`

Expected: mostra `--agent` e `--scope`.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add src/features/plugin/cli.py
git commit -m "feat: expose cross-platform plugin CLI"
```

### Phase 9: Package Verification and CI

**Entry criteria:** Phase 8 completion gate passa; `install`, `update` e
`uninstall` funcionam com o adaptador `generic` em um diretório temporário.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** `uv run pytest tests/test_plugin_package.py -q`, `uv build`
e a inspeção dos recursos do wheel passam.

#### Task 9.1: Specify Wheel Contents and Entry Point

**Files:**
- Create exactly one file: `tests/test_plugin_package.py`

- [ ] **Step 1: Write package assertions**

Testar a metadata do projeto e os recursos empacotados sem publicar no PyPI:

```python
from importlib.metadata import entry_points, version
from importlib.resources import files


def test_console_entry_point_is_registered() -> None:
    matches = [ep for ep in entry_points(group="console_scripts") if ep.name == "mcp-compras-publicas-br"]
    assert len(matches) == 1
    assert matches[0].value == "src.features.plugin.cli:main"


def test_skill_template_is_in_package_resources() -> None:
    resource = files("src.features.plugin").joinpath("templates", "skill.md")
    assert resource.is_file()
    assert "managed-by: mcp-compras-publicas-br" in resource.read_text(encoding="utf-8")


def test_version_is_semver_like() -> None:
    assert version("mcp-compras-publicas-br").count(".") == 2
```

- [ ] **Step 2: Run the package test**

Run: `uv run pytest tests/test_plugin_package.py -q`

Expected: PASS.

- [ ] **Step 3: Build and inspect the distributions**

Run: `uv build`

Expected: cria `.whl` e `.tar.gz` sem erro.

Run: `uv run python -c "import zipfile, glob; wheel=glob.glob('dist/*.whl')[-1]; names=zipfile.ZipFile(wheel).namelist(); assert any(name.endswith('templates/skill.md') for name in names); assert any(name.endswith('entry_points.txt') for name in names)"`

Expected: exit code `0`.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add tests/test_plugin_package.py
git commit -m "test: verify plugin package resources"
```

### Phase 10: Cross-Platform CI

**Entry criteria:** Phase 9 completion gate passa; o teste do wheel e o smoke
local da CLI estão verdes.

**Parallel dispatch:** Dispatch the single implementer for the task below.

**Completion gate:** O workflow YAML não contém Docker, inclui Windows, Linux
e macOS, e os comandos locais de CI passam.

#### Task 10.1: Update Cross-Platform CI

**Files:**
- Modify exactly one file: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the operating-system matrix**

Configurar job Python com `matrix.os: [ubuntu-latest, macos-latest,
windows-latest]`, Python `3.12`, `astral-sh/setup-uv`, `uv sync --locked
--all-groups`, testes offline, Ruff, Pyright e `uv build`. Adicionar um smoke
step que execute `uv run python -m src.features.plugin.cli --help`; não usar
Docker nem testes live no gate.

- [ ] **Step 2: Keep the read-only gate**

Manter o gate que falha se `src/shared/http_readonly.py` ou
`src/features/provedores` contiver `.post(`, `.put(`, `.patch(` ou `.delete(`.

- [ ] **Step 3: Validate workflow text locally**

Run: `rtk rg -n "docker|Docker|docker-compose" .github/workflows/ci.yml`

Expected: nenhuma saída.

Run: `uv run pytest -m "not live" -q`

Expected: todos os testes passam depois das fases anteriores.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: test plugin on supported operating systems"
```

### Phase 11: Documentation and Docker Removal

**Entry criteria:** Phase 10 completion gate passa; o entry point e o wheel
contêm a CLI e o template da skill.

**Parallel dispatch:** Dispatch one implementer per task below at the same time. These tasks must not depend on one another or edit the same file.

**Completion gate:** Todos os documentos citam `uvx`, escopos, update,
uninstall e o agente correspondente; não restam arquivos ou instruções Docker;
`git diff --check` passa.

#### Task 11.1: Remove Dockerfile

**Files:**
- Delete exactly one file: `Dockerfile`

- [ ] **Step 1: Delete the obsolete container build definition**

Remover o arquivo inteiro; não substituir por outro arquivo de container.

- [ ] **Step 2: Verify absence**

Run: `Test-Path -LiteralPath 'Dockerfile'`

Expected: `False`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add -u Dockerfile
git commit -m "remove: drop Docker image definition"
```

#### Task 11.2: Remove Docker Compose

**Files:**
- Delete exactly one file: `docker-compose.yml`

- [ ] **Step 1: Delete the obsolete compose definition**

Remover o arquivo inteiro; a execução HTTP direta pelo Python continua coberta
na documentação do projeto.

- [ ] **Step 2: Verify absence**

Run: `Test-Path -LiteralPath 'docker-compose.yml'`

Expected: `False`.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add -u docker-compose.yml
git commit -m "remove: drop Docker Compose runtime"
```

#### Task 11.3: Document Package Installation

**Files:**
- Modify exactly one file: `README.md`

- [ ] **Step 1: Replace source-only installation instructions**

Adicionar uma seção de instalação publicada:

```markdown
## Instalação como plugin

O pacote exige Python 3.12+ e `uv`. Para registrar no projeto atual:

```bash
uvx mcp-compras-publicas-br install --agent <id>
```

Para registrar globalmente:

```bash
uvx mcp-compras-publicas-br install --agent <id> --scope user
```

O escopo padrão é `project`. O instalador procura a raiz Git subindo do
diretório atual; sem Git, usa o diretório atual e avisa.

Atualize ou remova uma instalação com `update` e `uninstall`. Consulte
`docs/agents/` para os IDs e arquivos de cada agente.
```

Remover todos os comandos Docker e manter a execução direta `uv run ... --transport http` somente se útil para desenvolvimento.

- [ ] **Step 2: Verify README command references**

Run: `rtk rg -n "uvx|--scope|uninstall|Docker|docker" README.md`

Expected: há instruções `uvx`, `--scope`, `uninstall`; não há instruções Docker.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add README.md
git commit -m "docs: document published plugin installation"
```

#### Task 11.4: Update Architecture Documentation

**Files:**
- Modify exactly one file: `ARCHITECTURE.md`

- [ ] **Step 1: Document installer boundaries**

Adicionar o fluxo `plugin CLI -> InstallerService -> AgentAdapter` e explicar
que o servidor MCP permanece local via `stdio`, que a versão no registro é
fixada e que o transporte HTTP não depende de container.

- [ ] **Step 2: Remove Docker references**

Remover comandos, imagens, portas e instruções Docker, sem remover a seção que
descreve o transporte HTTP direto do FastMCP.

- [ ] **Step 3: Verify documentation**

Run: `rtk rg -n "InstallerService|AgentAdapter|uvx|Docker|docker" ARCHITECTURE.md`

Expected: arquitetura do instalador documentada e nenhuma instrução Docker.

- [ ] **Step 4: Commit the file-scoped task**

```bash
git add ARCHITECTURE.md
git commit -m "docs: describe plugin installer architecture"
```

#### Task 11.5: Update Contribution Workflow

**Files:**
- Modify exactly one file: `CONTRIBUTING.md`

- [ ] **Step 1: Add adapter and skill contribution rules**

Documentar que novo agente exige ID, adapter target para `project`/`user`,
fixture, skill em pt-BR, teste de merge, documentação e validação em três
OS. Documentar `uv sync`, `uv run pytest -m "not live" -q`, Ruff, Pyright e
`uv build`.

- [ ] **Step 2: Remove container workflow**

Eliminar instruções Docker, `docker build` e `docker compose`, mantendo os
gates de read-only e cobertura OpenAPI.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add CONTRIBUTING.md
git commit -m "docs: define plugin adapter contribution workflow"
```

#### Task 11.6: Update Security Policy

**Files:**
- Modify exactly one file: `SECURITY.md`

- [ ] **Step 1: Document installer threat controls**

Adicionar escopo limitado, rejeição de path traversal, merge sem substituição,
marcadores de ownership, ausência de execução de comandos vindos da
configuração, logs sem segredos e pin de versão no comando `uvx`.

- [ ] **Step 2: Remove Docker security instructions**

Remover referências a usuário não-root, imagem, compose, portas de container e
hardening Docker. Manter a política de allowlist HTTPS, somente `GET` upstream
e o aviso de que HTTP MCP local não implica operações de escrita upstream.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add SECURITY.md
git commit -m "docs: define plugin installer security controls"
```

#### Task 11.7: Update Changelog

**Files:**
- Modify exactly one file: `CHANGELOG.md`

- [ ] **Step 1: Add the release entry**

Registrar a entrega do pacote instalável via PyPI/`uvx`, os comandos
`install/update/uninstall`, os dez adaptadores, skills pt-BR e a remoção do
Docker, sem afirmar que os smoke tests live das APIs sempre passam.

- [ ] **Step 2: Commit the file-scoped task**

```bash
git add CHANGELOG.md
git commit -m "docs: record agent plugin packaging"
```

#### Task 11.8: Add Agent Installation Index

**Files:**
- Create exactly one file: `docs/agents/README.md`

- [ ] **Step 1: Document the common workflow**

Incluir tabela com todos os IDs, comandos:

```text
uvx mcp-compras-publicas-br install --agent <id>
uvx mcp-compras-publicas-br install --agent <id> --scope user
uvx mcp-compras-publicas-br update --agent <id>
uvx mcp-compras-publicas-br uninstall --agent <id>
```

Explicar default `project`, raiz Git/fallback atual, merge, skill gerenciada,
versão pinada e links para os dez documentos específicos.

- [ ] **Step 2: Verify every agent is linked**

Run: `rtk rg -n "claude-code|codex|opencode|deepseek-harness|pi|antigravity|cursor|hermes-agent|openclaw|generic" docs/agents/README.md`

Expected: cada ID aparece pelo menos uma vez.

- [ ] **Step 3: Commit the file-scoped task**

```bash
git add docs/agents/README.md
git commit -m "docs: add agent plugin installation index"
```

#### Tasks 11.9-11.18: Add Per-Agent Instructions

Cada tarefa abaixo cria exatamente um arquivo. O conteúdo deve conter o ID
correto, o comando `install`, o comando `update`, o comando `uninstall`, os
escopos, o caminho de skill, o formato de configuração e o comando de
verificação do agente conforme a documentação oficial atual. Não inserir
comandos Docker.

##### Task 11.9: Claude Code

**Files:** Create exactly one file: `docs/agents/claude-code.md`

- [ ] Documentar `claude mcp add`/`remove`, o transporte `stdio`, escopo local
  de projeto/global, `.mcp.json`/`~/.claude.json`, skill e verificação via
  `claude mcp list`.
- [ ] Verificar que o texto usa `claude-code` e `uvx --from ...==<versão>`.
- [ ] Commit: `git add docs/agents/claude-code.md; git commit -m "docs: add Claude Code plugin setup"`.

##### Task 11.10: Codex

**Files:** Create exactly one file: `docs/agents/codex.md`

- [ ] Documentar `config.toml`, `[mcp_servers.compras-publicas-br]`,
  `codex mcp list`, escopos `.codex/config.toml`/`~/.codex/config.toml`,
  `AGENTS.md`/skill conforme fonte oficial e verificação de conexão.
- [ ] Commit: `git add docs/agents/codex.md; git commit -m "docs: add Codex plugin setup"`.

##### Task 11.11: OpenCode

**Files:** Create exactly one file: `docs/agents/opencode.md`

- [ ] Documentar o formato MCP nativo atual do OpenCode, locais de projeto e
  usuário, skill/rules correspondente e comando de verificação.
- [ ] Se o agente não oferecer CLI oficial para MCP, declarar isso e explicar
  que o adaptador edita somente o arquivo documentado.
- [ ] Commit: `git add docs/agents/opencode.md; git commit -m "docs: add OpenCode plugin setup"`.

##### Task 11.12: DeepSeek Harness

**Files:** Create exactly one file: `docs/agents/deepseek-harness.md`

- [ ] Documentar o formato MCP e skill oficialmente suportados, caminhos por
  escopo e verificação; não inventar compatibilidade com outro agente.
- [ ] Commit: `git add docs/agents/deepseek-harness.md; git commit -m "docs: add DeepSeek Harness plugin setup"`.

##### Task 11.13: Pi

**Files:** Create exactly one file: `docs/agents/pi.md`

- [ ] Documentar o formato MCP/extension/skill oficialmente suportado por Pi,
  caminhos por escopo e verificação de tools.
- [ ] Commit: `git add docs/agents/pi.md; git commit -m "docs: add Pi plugin setup"`.

##### Task 11.14: Antigravity

**Files:** Create exactly one file: `docs/agents/antigravity.md`

- [ ] Documentar configuração MCP, skill/instructions, escopos e validação
  oficiais do Antigravity.
- [ ] Commit: `git add docs/agents/antigravity.md; git commit -m "docs: add Antigravity plugin setup"`.

##### Task 11.15: Cursor

**Files:** Create exactly one file: `docs/agents/cursor.md`

- [ ] Documentar `.cursor/mcp.json`/configuração global oficial, rules/skills,
  escopos, entrada `stdio` e verificação no painel/CLI suportado.
- [ ] Commit: `git add docs/agents/cursor.md; git commit -m "docs: add Cursor plugin setup"`.

##### Task 11.16: Hermes Agent

**Files:** Create exactly one file: `docs/agents/hermes-agent.md`

- [ ] Documentar formato MCP, skill, escopos e comando de validação oficiais;
  se não houver CLI, dizer explicitamente que o adaptador escreve o arquivo.
- [ ] Commit: `git add docs/agents/hermes-agent.md; git commit -m "docs: add Hermes Agent plugin setup"`.

##### Task 11.17: OpenClaw

**Files:** Create exactly one file: `docs/agents/openclaw.md`

- [ ] Documentar `openclaw mcp add`, `mcp.servers`, transporte `stdio`,
  `openclaw mcp doctor <name> --probe`, escopo global/projeto e skill.
- [ ] Commit: `git add docs/agents/openclaw.md; git commit -m "docs: add OpenClaw plugin setup"`.

##### Task 11.18: Generic `.agent`

**Files:** Create exactly one file: `docs/agents/generic.md`

- [ ] Documentar `.agent/mcp.json`, `.agent/skills/compras-publicas-br.md`,
  schema `mcpServers`, `managedBy`, escopos e como qualquer agente pode
  consumir o manifesto.
- [ ] Commit: `git add docs/agents/generic.md; git commit -m "docs: add generic agent plugin setup"`.

### Phase 12: Full Verification and Release Readiness

**Entry criteria:** Todas as tarefas de código, CI, documentação e remoção de
Docker foram commitadas no branch de trabalho.

**Parallel dispatch:** Dispatch the independent verification commands together; no task in this phase edits files.

**Completion gate:** Todos os comandos abaixo passam; o smoke live externo pode
falhar somente com evidência de indisponibilidade upstream, sem bloquear a
publicação do pacote.

- [ ] **Run the offline test suite**

Run: `uv run pytest -m "not live" -q`

Expected: zero failures.

- [ ] **Run static checks**

Run: `uv run ruff check .`

Expected: `All checks passed!`.

Run: `uv run pyright`

Expected: `0 errors, 0 warnings, 0 informations`.

- [ ] **Run build and resource checks**

Run: `uv build`

Expected: wheel e source distribution criados.

Run: `uv run pytest tests/test_plugin_package.py -q`

Expected: zero failures.

- [ ] **Run manifest and documentation gates**

Run: `uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml`

Expected: `overall=1.0` e `Unmapped public useful GET endpoints: 0`.

Run: `rtk git diff --check`

Expected: nenhuma saída.

Run: `rtk rg -n "Dockerfile|docker-compose|docker build|docker compose|docker run" README.md ARCHITECTURE.md CONTRIBUTING.md SECURITY.md CHANGELOG.md docs .github src tests`

Expected: nenhuma referência operacional Docker.

- [ ] **Run the live probes separately**

Run in PowerShell: `$env:RUN_LIVE_TESTS='1'; uv run pytest -m live -q`

Expected: registrar o resultado de cada fonte. HTTP `503`, timeout ou falha de
rede do upstream deve ser reportado como limitação externa; não alterar o
cliente somente para esconder a falha.

- [ ] **Verify repository state**

Run: `rtk git status --short --branch`

Expected: working tree limpa, sem arquivos não rastreados.

## Self-Review Checklist

Antes de iniciar a execução, o autor do plano deve confirmar:

- Cada requisito da spec aparece em pelo menos uma tarefa ou no gate final.
- Não existem `TBD`, `TODO`, `FIXME`, “implementar depois” ou tarefas sem
  comportamento verificável.
- `AgentId`, `ScopeName`, `AgentTarget`, `McpRegistration`, `OperationResult`
  e as assinaturas do serviço são consistentes em todas as fases.
- Tarefas de uma mesma fase não editam o mesmo arquivo e não dependem de
  implementação de outra tarefa da mesma fase.
- Cada arquivo criado, modificado ou removido aparece uma única vez no plano.
- A remoção de Docker não remove o transporte HTTP direto do Python.
- A versão do registro permanece fixada mesmo que o comando de instalação use
  `uvx` sem pin.
- Os dez agentes, os dois escopos, o fallback sem Git, merge, conflito,
  idempotência, `update`, `uninstall`, skills, segurança, PyPI, CI e wheel têm
  cobertura explícita.
