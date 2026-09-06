from pathlib import Path

from src.features.plugin.skills import is_managed_skill, remove_managed_skill, render_skill


def test_rendered_skill_has_agent_and_management_marker(tmp_path: Path) -> None:
    content = render_skill("codex", "Codex", "project")
    path = tmp_path / "SKILL.md"
    path.write_text(content, encoding="utf-8")

    assert "managed-by: mcp-compras-publicas-br; format: 1" in content
    assert "Codex" in content
    assert "somente leitura" in content
    assert is_managed_skill(path) is True


def test_managed_skill_is_detected(tmp_path: Path) -> None:
    path = tmp_path / "SKILL.md"
    path.write_text("managed-by: mcp-compras-publicas-br; format: 1\n", encoding="utf-8")

    assert is_managed_skill(path) is True


def test_managed_skill_is_removed(tmp_path: Path) -> None:
    path = tmp_path / "SKILL.md"
    path.write_text("managed-by: mcp-compras-publicas-br; format: 1\n", encoding="utf-8")

    assert remove_managed_skill(path) is True
    assert not path.exists()


def test_unmanaged_skill_is_preserved(tmp_path: Path) -> None:
    path = tmp_path / "SKILL.md"
    path.write_text("custom", encoding="utf-8")

    assert is_managed_skill(path) is False
    assert remove_managed_skill(path) is False
    assert path.read_text(encoding="utf-8") == "custom"
