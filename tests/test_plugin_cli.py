from src.features.plugin.cli import main


def test_agent_is_required() -> None:
    assert main(["install"]) == 2


def test_default_scope_is_project(monkeypatch, tmp_path) -> None:
    calls = []
    monkeypatch.setattr(
        "src.features.plugin.cli.run_operation", lambda **kwargs: calls.append(kwargs)
    )
    monkeypatch.chdir(tmp_path)

    assert main(["install", "--agent", "generic"]) == 0
    assert calls[0]["scope"] == "project"


def test_user_scope_is_forwarded(monkeypatch, tmp_path) -> None:
    calls = []
    monkeypatch.setattr(
        "src.features.plugin.cli.run_operation", lambda **kwargs: calls.append(kwargs)
    )
    monkeypatch.chdir(tmp_path)

    assert main(["uninstall", "--agent", "codex", "--scope", "user"]) == 0
    assert calls[0]["scope"] == "user"
