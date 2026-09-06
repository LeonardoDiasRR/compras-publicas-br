import re
from importlib.metadata import entry_points, version
from importlib.resources import files

from packaging.version import Version


def test_console_entry_point_is_registered() -> None:
    matches = [
        ep for ep in entry_points(group="console_scripts") if ep.name == "mcp-compras-publicas-br"
    ]
    assert len(matches) == 1
    assert matches[0].value == "src.features.plugin.cli:main"


def test_skill_template_is_in_package_resources() -> None:
    resource = files("src.features.plugin").joinpath("templates", "skill.md")
    assert resource.is_file()
    assert "managed-by: mcp-compras-publicas-br" in resource.read_text(encoding="utf-8")


def test_version_is_semver_like() -> None:
    installed_version = version("mcp-compras-publicas-br")
    parsed_version = Version(installed_version)

    assert re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", installed_version)
    assert installed_version.count(".") == 2
    assert not parsed_version.is_prerelease
    assert not parsed_version.is_devrelease
    assert len(parsed_version.release) == 3
    assert all(isinstance(component, int) for component in parsed_version.release)
