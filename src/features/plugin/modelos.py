from dataclasses import dataclass
from pathlib import Path
from typing import Literal

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


@dataclass(frozen=True, slots=True)
class ScopeTarget:
    scope: ScopeName
    root: Path
    used_git_root: bool


@dataclass(frozen=True, slots=True)
class McpRegistration:
    command: str
    args: tuple[str, ...]
    version: str
    managed_package: str

    def as_mapping(self) -> dict[str, str | tuple[str, ...]]:
        return {
            "command": self.command,
            "args": self.args,
            "version": self.version,
            "managed_package": self.managed_package,
        }


@dataclass(frozen=True, slots=True)
class OperationResult:
    changed: bool
    config_path: Path
    skill_path: Path
    version: str
    warnings: tuple[str, ...] = ()


class PluginError(ValueError):
    """Base error for plugin installation operations."""


class ConfigConflictError(PluginError):
    """Raised when an existing configuration entry is not managed by the plugin."""


class ConfigFormatError(PluginError):
    """Raised when a plugin configuration cannot be parsed."""
