from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol, cast

from packaging.version import InvalidVersion, Version

from src.features.plugin.modelos import AgentId, ScopeName
from src.features.plugin.versoes import PACKAGE_NAME, versioned_command

ConfigFormat = Literal["json", "json5", "toml"]
EntryStyle = Literal["generic", "opencode", "cursor", "command_args"]
McpEntry = dict[str, object]


@dataclass(frozen=True, slots=True)
class AgentTarget:
    config_path: Path
    config_format: ConfigFormat
    container_path: tuple[str, ...]
    skill_path: Path
    native_add: tuple[str, ...] | None
    native_remove: tuple[str, ...] | None
    base_path: Path


class AgentAdapter(Protocol):
    @property
    def agent_id(self) -> str: ...

    @property
    def display_name(self) -> str: ...

    @property
    def validation_command(self) -> tuple[str, ...] | None: ...

    def resolve_target(
        self, scope: ScopeName, project_root: Path, home: Path
    ) -> AgentTarget: ...

    def build_entry(self, version: str) -> McpEntry: ...

    def owns_entry(self, value: object) -> bool: ...

    def validate_target(self, target: AgentTarget) -> None: ...


@dataclass(frozen=True, slots=True)
class _Adapter:
    agent_id: str
    display_name: str
    project_config: tuple[str, ...]
    user_config: tuple[str, ...]
    config_format: ConfigFormat
    project_skill: tuple[str, ...]
    user_skill: tuple[str, ...]
    container_path: tuple[str, ...]
    native_add: tuple[str, ...] | None = None
    native_remove: tuple[str, ...] | None = None
    validation_command: tuple[str, ...] | None = None
    entry_style: EntryStyle = "command_args"

    def resolve_target(
        self, scope: ScopeName, project_root: Path, home: Path
    ) -> AgentTarget:
        if scope not in ("project", "user"):
            raise ValueError(f"unknown scope: {scope}")
        base = (project_root if scope == "project" else home).resolve()
        config_parts = self.project_config if scope == "project" else self.user_config
        skill_parts = self.project_skill if scope == "project" else self.user_skill
        return AgentTarget(
            config_path=base.joinpath(*config_parts),
            config_format=self.config_format,
            container_path=self.container_path,
            skill_path=base.joinpath(*skill_parts),
            native_add=self.native_add,
            native_remove=self.native_remove,
            base_path=base,
        )

    def build_entry(self, version: str) -> McpEntry:
        _parse_stable_version(version)
        command = versioned_command(version)
        if self.entry_style == "generic":
            return {
                "command": command[0],
                "args": command[1:],
                "managedBy": {"package": PACKAGE_NAME, "schemaVersion": 1},
            }
        if self.entry_style == "opencode":
            return {"type": "local", "command": command}
        if self.entry_style == "cursor":
            return {"type": "stdio", "command": command[0], "args": command[1:]}
        return {"command": command[0], "args": command[1:]}

    def owns_entry(self, value: object) -> bool:
        if not isinstance(value, Mapping):
            return False
        entry = cast(Mapping[str, object], value)
        if self.entry_style == "opencode":
            if not _has_exact_keys(entry, "type", "command"):
                return False
            if entry.get("type") != "local":
                return False
            raw_command = entry.get("command")
            if not isinstance(raw_command, Sequence) or isinstance(
                raw_command, (str, bytes)
            ):
                return False
            command = cast(Sequence[object], raw_command)
            return len(command) == 4 and command[0] == "uvx" and _owns_command(command, 2)

        if self.entry_style == "cursor":
            if not _has_exact_keys(entry, "type", "command", "args"):
                return False
            if entry.get("type") != "stdio" or entry.get("command") != "uvx":
                return False
            raw_args = entry.get("args")
            if not isinstance(raw_args, Sequence) or isinstance(raw_args, (str, bytes)):
                return False
            return _owns_command(cast(Sequence[object], raw_args), 1)

        expected_keys = (
            ("command", "args", "managedBy")
            if self.entry_style == "generic"
            else ("command", "args")
        )
        if not _has_exact_keys(entry, *expected_keys) or entry.get("command") != "uvx":
            return False
        raw_args = entry.get("args")
        if not isinstance(raw_args, Sequence) or isinstance(raw_args, (str, bytes)):
            return False
        if not _owns_command(cast(Sequence[object], raw_args), 1):
            return False
        if self.entry_style != "generic":
            return True
        managed_by = entry.get("managedBy")
        if not isinstance(managed_by, Mapping):
            return False
        metadata = cast(Mapping[str, object], managed_by)
        return (
            _has_exact_keys(metadata, "package", "schemaVersion")
            and metadata.get("package") == PACKAGE_NAME
            and type(metadata.get("schemaVersion")) is int
            and metadata.get("schemaVersion") == 1
        )

    def validate_target(self, target: AgentTarget) -> None:
        config_format: object = target.config_format
        if config_format not in ("json", "json5", "toml"):
            raise ValueError(f"unsupported configuration format: {config_format}")
        base_path_value = cast(object, target.base_path)
        if not isinstance(base_path_value, Path):
            raise ValueError("invalid target base path")
        base_path = base_path_value.resolve()
        for path in (target.config_path, target.skill_path):
            _validate_path(path, base_path)
        container_path = cast(object, target.container_path)
        if not _valid_parts(container_path):
            raise ValueError("invalid configuration container path")
        for command in (target.native_add, target.native_remove):
            if not _valid_parts(cast(object, command), allow_none=True):
                raise ValueError("invalid native command")


def _skill(*parts: str) -> tuple[str, ...]:
    return (*parts, "SKILL.md")


def _has_exact_keys(value: Mapping[str, object], *keys: str) -> bool:
    return len(value) == len(keys) and all(key in value for key in keys)


def _owns_command(command: Sequence[object], pin_index: int) -> bool:
    if len(command) != pin_index + 2 or command[pin_index - 1] != "--from":
        return False
    version_spec = command[pin_index]
    return (
        isinstance(version_spec, str)
        and _is_stable_pin(version_spec)
        and command[pin_index + 1] == PACKAGE_NAME
    )


def _valid_parts(value: object, allow_none: bool = False) -> bool:
    if value is None:
        return allow_none
    if not isinstance(value, (tuple, list)):
        return False
    parts = cast(Sequence[object], value)
    return bool(parts) and all(isinstance(part, str) and part for part in parts)


def _validate_path(path: object, base_path: Path) -> None:
    if not isinstance(path, Path):
        raise ValueError("invalid target path")
    if ".." in path.parts:
        raise ValueError(f"unsafe target path: {path}")
    resolved_path = path.resolve()
    if not resolved_path.is_relative_to(base_path):
        raise ValueError(f"target path is outside base path: {path}")


def _is_stable_pin(value: str) -> bool:
    prefix = f"{PACKAGE_NAME}=="
    if not value.startswith(prefix):
        return False
    version_text = value[len(prefix) :]
    try:
        _parse_stable_version(version_text)
    except ValueError:
        return False

    return True


def _parse_stable_version(value: str) -> Version:
    raw_value = cast(object, value)
    if not isinstance(raw_value, str) or not raw_value or raw_value != raw_value.strip():
        raise ValueError("package version must be a non-empty exact pin")
    try:
        parsed = Version(raw_value)
    except InvalidVersion:
        raise ValueError("invalid package version") from None
    if parsed.is_prerelease or parsed.is_devrelease:
        raise ValueError("package version must be stable")
    return parsed


_REGISTRY: dict[str, _Adapter] = {
    # https://code.claude.com/docs/en/mcp and https://code.claude.com/docs/en/skills
    "claude-code": _Adapter(
        "claude-code",
        "Claude Code",
        (".mcp.json",),
        (".claude.json",),
        "json",
        _skill(".claude", "skills", PACKAGE_NAME),
        _skill(".claude", "skills", PACKAGE_NAME),
        ("mcpServers",),
        ("claude", "mcp", "add"),
        ("claude", "mcp", "remove"),
        ("claude", "mcp", "list"),
    ),
    # https://developers.openai.com/codex/mcp and https://developers.openai.com/codex/skills
    "codex": _Adapter(
        "codex",
        "Codex",
        (".codex", "config.toml"),
        (".codex", "config.toml"),
        "toml",
        _skill(".agents", "skills", PACKAGE_NAME),
        _skill(".agents", "skills", PACKAGE_NAME),
        ("mcp_servers",),
        ("codex", "mcp", "add"),
        ("codex", "mcp", "remove"),
        ("codex", "mcp", "list"),
    ),
    # https://opencode.ai/docs/mcp-servers/ and https://opencode.ai/docs/skills/
    "opencode": _Adapter(
        "opencode",
        "OpenCode",
        ("opencode.json",),
        (".config", "opencode", "opencode.json"),
        "json",
        _skill(".opencode", "skills", PACKAGE_NAME),
        _skill(".config", "opencode", "skills", PACKAGE_NAME),
        ("mcp",),
        entry_style="opencode",
    ),
    # https://deepseek-harness.github.io/deepseek-harness/
    "deepseek-harness": _Adapter(
        "deepseek-harness",
        "DeepSeek Harness",
        (".dsh", "config.json"),
        (".dsh", "config.json"),
        "json",
        _skill(".agents", "skills", PACKAGE_NAME),
        _skill(".agents", "skills", PACKAGE_NAME),
        ("mcpServers",),
    ),
    # https://pi.dev/docs/latest/settings and https://pi.dev/docs/latest/skills
    "pi": _Adapter(
        "pi",
        "Pi",
        (".pi", "settings.json"),
        (".pi", "agent", "settings.json"),
        "json",
        _skill(".pi", "skills", PACKAGE_NAME),
        _skill(".pi", "agent", "skills", PACKAGE_NAME),
        ("mcpServers",),
    ),
    # https://antigravity.google/docs/mcp
    "antigravity": _Adapter(
        "antigravity",
        "Antigravity",
        (".agents", "mcp_config.json"),
        (".gemini", "config", "mcp_config.json"),
        "json",
        _skill(".agents", "skills", PACKAGE_NAME),
        _skill(".gemini", "config", "skills", PACKAGE_NAME),
        ("mcpServers",),
    ),
    # https://cursor.com/docs/context/mcp and https://cursor.com/docs/context/skills
    "cursor": _Adapter(
        "cursor",
        "Cursor",
        (".cursor", "mcp.json"),
        (".cursor", "mcp.json"),
        "json",
        _skill(".cursor", "skills", PACKAGE_NAME),
        _skill(".cursor", "skills", PACKAGE_NAME),
        ("mcpServers",),
        entry_style="cursor",
    ),
    # https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
    # https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
    "hermes-agent": _Adapter(
        "hermes-agent",
        "Hermes Agent",
        (".hermes", "config.json5"),
        (".hermes", "config.json5"),
        "json5",
        _skill(".hermes", "skills", PACKAGE_NAME),
        _skill(".hermes", "skills", PACKAGE_NAME),
        ("mcp_servers",),
    ),
    # https://docs.openclaw.ai/tools/mcp and https://docs.openclaw.ai/tools/skills
    "openclaw": _Adapter(
        "openclaw",
        "OpenClaw",
        (".openclaw", "openclaw.json"),
        (".openclaw", "openclaw.json"),
        "json5",
        _skill("skills", PACKAGE_NAME),
        _skill(".openclaw", "skills", PACKAGE_NAME),
        ("mcp", "servers"),
        ("openclaw", "mcp", "add"),
        ("openclaw", "mcp", "unset"),
        ("openclaw", "mcp", "list"),
    ),
    "generic": _Adapter(
        "generic",
        "Generic Agent",
        (".agent", "mcp.json"),
        (".agent", "mcp.json"),
        "json",
        (".agent", "skills", "compras-publicas-br.md"),
        (".agent", "skills", "compras-publicas-br.md"),
        ("mcpServers",),
        entry_style="generic",
    ),
}


def get_adapter(agent_id: str) -> AgentAdapter:
    try:
        return _REGISTRY[agent_id]
    except KeyError as error:
        raise ValueError(f"unknown agent: {agent_id}") from error


def supported_agent_ids() -> tuple[AgentId, ...]:
    return cast(tuple[AgentId, ...], tuple(_REGISTRY))
