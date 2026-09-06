import json
from copy import deepcopy
from pathlib import Path

import pytest
from src.features.plugin.instalador import InstallerService


def test_install_is_idempotent_and_preserves_other_entries(tmp_path: Path) -> None:
    config_path = tmp_path / ".agent" / "mcp.json"
    config_path.parent.mkdir()
    config_path.write_text(
        json.dumps(
            {
                "mcpServers": {"other": {"command": "other"}},
                "settings": {"keep": True},
            }
        ),
        encoding="utf-8",
    )
    service = InstallerService.for_testing(tmp_path, agent="generic")

    first = service.install()
    before = first.config_path.read_text(encoding="utf-8")
    before_skill = first.skill_path.read_bytes()
    second = service.install()

    document = json.loads(before)
    assert first.changed is True
    assert first.skill_path.exists()
    assert "managed-by: mcp-compras-publicas-br" in first.skill_path.read_text(encoding="utf-8")
    assert document["mcpServers"]["other"] == {"command": "other"}
    assert document["settings"] == {"keep": True}
    assert second.changed is False
    assert second.config_path.read_text(encoding="utf-8") == before
    assert second.skill_path.read_bytes() == before_skill


def test_update_changes_only_pinned_version(tmp_path: Path) -> None:
    service = InstallerService.for_testing(
        tmp_path,
        agent="generic",
        latest_version="0.2.0",
    )
    installed = service.install()
    before_document = json.loads(installed.config_path.read_text(encoding="utf-8"))
    before_skill = installed.skill_path.read_bytes()
    expected_document = deepcopy(before_document)
    expected_document["mcpServers"]["compras-publicas-br"]["args"][1] = (
        "mcp-compras-publicas-br==0.2.0"
    )

    result = service.update()

    after_document = json.loads(result.config_path.read_text(encoding="utf-8"))
    assert result.changed is True
    assert after_document == expected_document
    assert result.skill_path.read_bytes() == before_skill


def test_uninstall_removes_managed_entry_and_skill(tmp_path: Path) -> None:
    config_path = tmp_path / ".agent" / "mcp.json"
    config_path.parent.mkdir()
    config_path.write_text(
        json.dumps(
            {
                "mcpServers": {"other": {"command": "other"}},
                "settings": {"keep": True},
            }
        ),
        encoding="utf-8",
    )
    service = InstallerService.for_testing(tmp_path, agent="generic")
    service.install()

    result = service.uninstall()

    document = json.loads(result.config_path.read_text(encoding="utf-8"))
    after_first_uninstall = result.config_path.read_bytes()
    second = service.uninstall()
    assert result.changed is True
    assert "compras-publicas-br" not in document["mcpServers"]
    assert document["mcpServers"]["other"] == {"command": "other"}
    assert document["settings"] == {"keep": True}
    assert not result.skill_path.exists()
    assert second.changed is False
    assert second.config_path.read_bytes() == after_first_uninstall


def test_install_preserves_unmanaged_skill_and_warns(tmp_path: Path) -> None:
    skill_path = tmp_path / ".agent" / "skills" / "compras-publicas-br.md"
    skill_path.parent.mkdir(parents=True)
    skill_path.write_text("custom skill", encoding="utf-8")
    service = InstallerService.for_testing(tmp_path, agent="generic")

    result = service.install()

    assert result.changed is True
    assert result.skill_path.read_text(encoding="utf-8") == "custom skill"
    assert any("skill" in warning.lower() for warning in result.warnings)


def test_install_preserves_unrecognized_conflict_atomically(tmp_path: Path) -> None:
    config_path = tmp_path / ".agent" / "mcp.json"
    config_path.parent.mkdir()
    config_path.write_text(
        json.dumps({"mcpServers": {"compras-publicas-br": {"command": "custom"}}}),
        encoding="utf-8",
    )
    before = config_path.read_bytes()
    service = InstallerService.for_testing(tmp_path, agent="generic")

    result = service.install()

    assert result.changed is False
    assert result.config_path.read_bytes() == before
    assert not result.skill_path.exists()
    assert result.warnings


def test_update_does_not_modify_config_when_managed_entry_is_lost(tmp_path: Path) -> None:
    service = InstallerService.for_testing(
        tmp_path,
        agent="generic",
        latest_version="0.2.0",
    )
    installed = service.install()
    document = json.loads(installed.config_path.read_text(encoding="utf-8"))
    document["mcpServers"]["compras-publicas-br"] = {"command": "custom"}
    installed.config_path.write_text(json.dumps(document), encoding="utf-8")
    before_config = installed.config_path.read_bytes()
    before_skill = installed.skill_path.read_bytes()

    result = service.update()

    assert result.changed is False
    assert result.config_path.read_bytes() == before_config
    assert result.skill_path.read_bytes() == before_skill
    assert result.warnings


def test_update_failure_with_invalid_injected_version_is_atomic(tmp_path: Path) -> None:
    installed_service = InstallerService.for_testing(tmp_path, agent="generic")
    installed = installed_service.install()
    before_config = installed.config_path.read_bytes()
    before_skill = installed.skill_path.read_bytes()
    failing_service = InstallerService.for_testing(
        tmp_path,
        agent="generic",
        latest_version="not-a-valid-version",
    )

    with pytest.raises(ValueError):
        failing_service.update()

    assert installed.config_path.read_bytes() == before_config
    assert installed.skill_path.read_bytes() == before_skill
