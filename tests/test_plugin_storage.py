import json
import os
import stat
import sys
from pathlib import Path

import pytest

from src.features.plugin.armazenamento import (
    atomic_write,
    load_document,
    merge_mcp_entry,
    remove_mcp_entry,
)
from src.features.plugin.modelos import ConfigFormatError


def test_json_merge_preserves_unrelated_servers(tmp_path: Path) -> None:
    path = tmp_path / "mcp.json"
    path.write_text(json.dumps({"mcpServers": {"other": {"command": "other"}}}), encoding="utf-8")
    entry = {"command": "uvx", "args": ["--from", "mcp-compras-publicas-br==0.1.0"]}

    document = load_document(path, "json")
    merged, changed = merge_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        entry,
        lambda value: value == entry,
    )

    assert changed is True
    assert merged["mcpServers"]["other"] == {"command": "other"}
    assert merged["mcpServers"]["compras-publicas-br"] == entry


def test_json5_document_loads_comments_and_trailing_commas(tmp_path: Path) -> None:
    path = tmp_path / "mcp.json5"
    path.write_text(
        "{\n"
        "  // Keep JSON5 syntax in the fixture.\n"
        "  mcpServers: {\n"
        '    example: { command: "uvx", args: ["--from", "pkg",], },\n'
        "  },\n"
        "}\n",
        encoding="utf-8",
    )

    assert load_document(path, "json5") == {
        "mcpServers": {"example": {"command": "uvx", "args": ["--from", "pkg"]}}
    }


def test_toml_document_loads_nested_tables(tmp_path: Path) -> None:
    path = tmp_path / "mcp.toml"
    path.write_text(
        '[mcpServers.example]\ncommand = "uvx"\nargs = ["--from", "pkg"]\n',
        encoding="utf-8",
    )

    assert load_document(path, "toml") == {
        "mcpServers": {"example": {"command": "uvx", "args": ["--from", "pkg"]}}
    }


@pytest.mark.parametrize(
    ("format_name", "content"),
    [("json5", "{ mcpServers: }"), ("toml", '[mcpServers.example\ncommand = "uvx"')],
)
def test_invalid_json5_and_toml_raise_without_changing_file(
    tmp_path: Path, format_name: str, content: str
) -> None:
    path = tmp_path / f"invalid.{format_name}"
    path.write_text(content, encoding="utf-8")

    with pytest.raises(ConfigFormatError):
        load_document(path, format_name)

    assert path.read_text(encoding="utf-8") == content


def test_unrecognized_existing_entry_is_not_overwritten() -> None:
    document = {"mcpServers": {"compras-publicas-br": {"command": "custom"}}}
    entry = {"command": "uvx", "args": ["--from", "mcp-compras-publicas-br==0.1.0"]}

    merged, changed = merge_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        entry,
        lambda value: value == entry,
    )

    assert merged == document
    assert changed is False


def test_recognized_existing_entry_is_replaced() -> None:
    current = {"command": "old"}
    entry = {"command": "new", "args": ["--from", "pkg"]}
    document = {"mcpServers": {"compras-publicas-br": current, "other": {}}}

    merged, changed = merge_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        entry,
        lambda value: value == current,
    )

    assert changed is True
    assert merged["mcpServers"]["compras-publicas-br"] == entry
    assert merged["mcpServers"]["other"] == {}


def test_merging_same_recognized_entry_is_idempotent() -> None:
    entry = {"command": "uvx", "args": ["--from", "pkg"]}
    document = {"mcpServers": {"compras-publicas-br": entry, "other": {}}}

    merged, changed = merge_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        entry,
        lambda value: value == entry,
    )

    assert changed is False
    assert merged == document


def test_merge_creates_missing_container_path() -> None:
    document = {"other": {"keep": True}}
    entry = {"command": "uvx"}

    merged, changed = merge_mcp_entry(
        document,
        ("settings", "mcpServers"),
        "compras-publicas-br",
        entry,
        lambda value: value == entry,
    )

    assert changed is True
    assert merged["other"] == {"keep": True}
    assert merged["settings"]["mcpServers"]["compras-publicas-br"] == entry


def test_invalid_json_raises_without_changing_file(tmp_path: Path) -> None:
    path = tmp_path / "mcp.json"
    original = "{invalid json"
    path.write_text(original, encoding="utf-8")

    with pytest.raises(ConfigFormatError):
        load_document(path, "json")

    assert path.read_text(encoding="utf-8") == original


def test_atomic_write_replaces_file_without_leaving_temp_file(tmp_path: Path) -> None:
    path = tmp_path / "config.json"
    atomic_write(path, '{"ok": true}\n')

    assert path.read_text(encoding="utf-8") == '{"ok": true}\n'
    assert {entry.name for entry in tmp_path.iterdir()} == {"config.json"}


def test_atomic_write_removes_temp_file_when_replacement_fails(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "config.json"
    before = set(tmp_path.iterdir())
    replace_calls: list[tuple[object, object]] = []

    def fail_replace(source: object, destination: object) -> None:
        replace_calls.append((source, destination))
        raise OSError("injected replace failure")

    monkeypatch.setattr(os, "replace", fail_replace)

    with pytest.raises(OSError, match="injected replace failure"):
        atomic_write(path, '{"ok": true}\n')

    assert len(replace_calls) == 1
    assert set(tmp_path.iterdir()) == before


@pytest.mark.skipif(sys.platform == "win32", reason="mode bits are not portable on Windows")
def test_atomic_write_preserves_existing_file_permissions(tmp_path: Path) -> None:
    path = tmp_path / "config.json"
    path.write_text('{"old": true}\n', encoding="utf-8")
    path.chmod(0o600)

    atomic_write(path, '{"ok": true}\n')

    assert stat.S_IMODE(path.stat().st_mode) == 0o600


def test_remove_mcp_entry_only_removes_matching_entry() -> None:
    document = {"mcpServers": {"compras-publicas-br": {"command": "uvx"}, "other": {}}}

    result, removed = remove_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        lambda value: value == {"command": "uvx"},
    )

    assert removed is True
    assert result == {"mcpServers": {"other": {}}}


def test_unrecognized_entry_is_preserved_when_removing() -> None:
    document = {"mcpServers": {"compras-publicas-br": {"command": "custom"}, "other": {}}}

    result, removed = remove_mcp_entry(
        document,
        ("mcpServers",),
        "compras-publicas-br",
        lambda value: value == {"command": "uvx"},
    )

    assert removed is False
    assert result == document
