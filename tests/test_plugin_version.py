import importlib.metadata

import pytest
from src.features.plugin.modelos import PluginError
from src.features.plugin.versoes import (
    installed_version,
    latest_stable_version,
    versioned_command,
)


def test_installed_version_reads_package_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    requested: list[str] = []

    def fake_version(distribution: str) -> str:
        requested.append(distribution)
        return "0.1.0"

    monkeypatch.setattr(importlib.metadata, "version", fake_version)

    assert installed_version() == "0.1.0"
    assert requested == ["mcp-compras-publicas-br"]


def test_versioned_command_pins_exact_release() -> None:
    assert versioned_command("0.1.0") == [
        "uvx",
        "--from",
        "mcp-compras-publicas-br==0.1.0",
        "mcp-compras-publicas-br",
    ]


def test_latest_stable_version_ignores_prereleases() -> None:
    payload = {
        "releases": {
            "0.1.0": [{}],
            "0.2.0rc1": [{}],
            "0.2.0.dev1": [{}],
            "0.0.9": [{}],
        }
    }

    assert latest_stable_version(lambda: payload) == "0.1.0"


@pytest.mark.parametrize(
    "payload",
    [
        {"releases": {}},
        {"releases": {"not-a-version": [{}]}},
        {"releases": {"0.2.0rc1": [{}], "0.2.0.dev1": [{}]}},
        {"releases": []},
        {"releases": None},
    ],
)
def test_latest_stable_version_rejects_empty_invalid_or_unstable_payload(payload) -> None:
    with pytest.raises(PluginError):
        latest_stable_version(lambda: payload)
