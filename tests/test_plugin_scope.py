import logging
from pathlib import Path

from src.features.plugin.escopo import find_project_root, resolve_scope


def test_find_project_root_walks_up_to_git_directory(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    (root / ".git").mkdir(parents=True)
    nested = root / "src" / "feature"
    nested.mkdir(parents=True)

    assert find_project_root(nested) == root
    result = resolve_scope("project", nested)
    assert result.root == root
    assert result.used_git_root is True


def test_find_project_root_accepts_git_file(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    root.mkdir()
    (root / ".git").write_text("gitdir: /other/repo/.git\n")
    nested = root / "src"
    nested.mkdir()

    assert find_project_root(nested) == root


def test_missing_git_uses_current_directory_and_warns(tmp_path: Path, caplog) -> None:
    caplog.set_level(logging.WARNING)
    result = resolve_scope("project", tmp_path)

    assert result.root == tmp_path
    assert result.used_git_root is False
    warning_messages = [
        record.getMessage() for record in caplog.records if record.levelno == logging.WARNING
    ]
    assert any(
        "Git" in message and "diretório atual" in message for message in warning_messages
    )


def test_user_scope_does_not_depend_on_current_directory(tmp_path: Path, monkeypatch) -> None:
    unrelated = tmp_path / "unrelated"
    unrelated.mkdir()
    monkeypatch.chdir(unrelated)

    result = resolve_scope("user", tmp_path)

    assert result.scope == "user"
    assert result.root == Path.home()
    assert result.used_git_root is False


def test_user_scope_explicit_home_skips_git_tree(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    (root / ".git").mkdir(parents=True)
    start = root / "src"
    start.mkdir()
    home = tmp_path / "home"

    result = resolve_scope("user", start, home=home)

    assert result.root == home
    assert result.used_git_root is False
