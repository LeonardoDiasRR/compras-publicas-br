from dataclasses import replace
from pathlib import Path

import pytest
from src.features.plugin.adaptadores import get_adapter, supported_agent_ids
from src.features.plugin.modelos import McpRegistration

EXPECTED = {
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
}


def test_mcp_registration_exposes_mapping_fields() -> None:
    args = ("--from", "mcp-compras-publicas-br==0.1.0", "mcp-compras-publicas-br")
    registration = McpRegistration(
        command="uvx",
        args=args,
        version="0.1.0",
        managed_package="mcp-compras-publicas-br",
    )

    assert registration.as_mapping() == {
        "command": "uvx",
        "args": args,
        "version": "0.1.0",
        "managed_package": "mcp-compras-publicas-br",
    }


def test_all_declared_agents_are_registered() -> None:
    agent_ids = list(supported_agent_ids())

    assert len(agent_ids) == len(set(agent_ids))
    assert set(agent_ids) == EXPECTED


def test_generic_adapter_resolves_project_manifest(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    home = tmp_path / "home"
    adapter = get_adapter("generic")
    target = adapter.resolve_target(
        "project", project_root=project_root, home=home
    )

    assert project_root != home
    assert target.config_path == project_root / ".agent" / "mcp.json"
    assert target.skill_path == project_root / ".agent" / "skills" / "compras-publicas-br.md"


def test_generic_adapter_resolves_user_manifest(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    home = tmp_path / "home"
    adapter = get_adapter("generic")
    target = adapter.resolve_target(
        "user", project_root=project_root, home=home
    )

    assert project_root != home
    assert target.config_path == home / ".agent" / "mcp.json"
    assert target.skill_path == home / ".agent" / "skills" / "compras-publicas-br.md"


def test_unknown_agent_is_rejected() -> None:
    with pytest.raises(ValueError, match="unknown"):
        get_adapter("unknown")


@pytest.mark.parametrize("agent_id", sorted(EXPECTED))
def test_each_adapter_declares_common_target_contract(agent_id: str, tmp_path: Path) -> None:
    adapter = get_adapter(agent_id)
    project_root = tmp_path / "project"
    home = tmp_path / "home"

    assert project_root != home

    assert adapter.agent_id == agent_id
    assert adapter.display_name

    for scope, base in (
        ("project", project_root),
        ("user", home),
    ):
        target = adapter.resolve_target(scope, project_root=project_root, home=home)

        assert target.config_path.is_relative_to(base)
        assert target.skill_path.is_relative_to(base)
        assert target.config_format in {"json", "json5", "toml"}
        assert target.skill_path.name

        assert hasattr(adapter, "validation_command")
        validation_command = adapter.validation_command
        assert validation_command is None or (
            isinstance(validation_command, (tuple, list))
            and validation_command
            and all(isinstance(part, str) and part for part in validation_command)
        )

        adapter.validate_target(target)

        unsafe_config_target = replace(
            target,
            config_path=base / ".." / "outside" / target.config_path.name,
        )
        with pytest.raises(ValueError):
            adapter.validate_target(unsafe_config_target)

        unsafe_skill_target = replace(
            target,
            skill_path=base / ".." / "outside" / target.skill_path.name,
        )
        with pytest.raises(ValueError):
            adapter.validate_target(unsafe_skill_target)

        for native_command in (target.native_add, target.native_remove):
            assert native_command is None or (
                isinstance(native_command, (tuple, list))
                and native_command
                and all(isinstance(part, str) and part for part in native_command)
            )


@pytest.mark.parametrize("agent_id", sorted(EXPECTED))
def test_each_adapter_owns_only_its_built_entry(agent_id: str) -> None:
    adapter = get_adapter(agent_id)
    entry = adapter.build_entry("0.1.0")

    assert adapter.owns_entry(entry)
    assert not adapter.owns_entry({"command": "custom"})


@pytest.mark.parametrize("agent_id", sorted(EXPECTED))
def test_each_adapter_builds_the_fixed_versioned_uvx_entry(agent_id: str) -> None:
    entry = get_adapter(agent_id).build_entry("0.1.0")

    assert entry["command"] == "uvx"
    assert entry["args"] == [
        "--from",
        "mcp-compras-publicas-br==0.1.0",
        "mcp-compras-publicas-br",
    ]
    managed_by = entry["managedBy"]
    assert isinstance(managed_by, dict)
    assert managed_by["package"] == "mcp-compras-publicas-br"
    assert managed_by["schemaVersion"] == 1


@pytest.mark.parametrize("agent_id", sorted(EXPECTED))
def test_validate_target_rejects_invalid_declarations(agent_id: str, tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    home = tmp_path / "home"
    adapter = get_adapter(agent_id)
    target = adapter.resolve_target(
        "project", project_root=project_root, home=home
    )

    with pytest.raises(ValueError):
        adapter.validate_target(replace(target, config_format="ini"))

    with pytest.raises(ValueError):
        adapter.validate_target(replace(target, native_add="malformed"))

    with pytest.raises(ValueError):
        adapter.validate_target(replace(target, native_remove="malformed"))


@pytest.mark.parametrize(
    ("agent_id", "container_path"),
    [
        ("codex", ("mcp_servers",)),
        ("openclaw", ("mcp", "servers")),
        ("generic", ("mcpServers",)),
    ],
)
def test_documented_adapter_containers_are_preserved(
    agent_id: str, container_path: tuple[str, ...], tmp_path: Path
) -> None:
    project_root = tmp_path / "project"
    home = tmp_path / "home"
    target = get_adapter(agent_id).resolve_target(
        "project", project_root=project_root, home=home
    )

    assert target.container_path == container_path
