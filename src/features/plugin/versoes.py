import importlib.metadata
from collections.abc import Callable, Mapping, Sequence
from typing import cast

import httpx
from packaging.version import InvalidVersion, Version

from src.features.plugin.modelos import PluginError

PACKAGE_NAME = "mcp-compras-publicas-br"
PYPI_URL = f"https://pypi.org/pypi/{PACKAGE_NAME}/json"
type ReleasesFetcher = Callable[[], Mapping[str, object]]


def installed_version() -> str:
    return importlib.metadata.version(PACKAGE_NAME)


def versioned_command(version: str) -> list[str]:
    return ["uvx", "--from", f"{PACKAGE_NAME}=={version}", PACKAGE_NAME]


def _fetch_releases() -> Mapping[str, object]:
    try:
        response = httpx.get(PYPI_URL, timeout=10.0)
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, OSError, ValueError) as error:
        raise PluginError("Could not fetch package releases from PyPI") from error

    if not isinstance(payload, Mapping):
        raise PluginError("PyPI response is not a mapping")
    return cast(Mapping[str, object], payload)


def latest_stable_version(fetcher: ReleasesFetcher | None = None) -> str:
    source = fetcher if fetcher is not None else _fetch_releases
    try:
        raw_payload = cast(object, source())
    except PluginError:
        raise
    except (httpx.HTTPError, OSError, ValueError) as error:
        raise PluginError("Could not fetch package releases") from error

    if not isinstance(raw_payload, Mapping):
        raise PluginError("PyPI response is not a mapping")
    payload = cast(Mapping[str, object], raw_payload)

    raw_releases = payload.get("releases")
    if not isinstance(raw_releases, Mapping):
        raise PluginError("PyPI response has no valid releases mapping")
    releases = cast(Mapping[object, object], raw_releases)

    stable_versions: list[Version] = []
    for raw_version in releases:
        if not isinstance(raw_version, str):
            continue
        release_files = releases[raw_version]
        if not isinstance(release_files, Sequence) or not release_files:
            continue
        release_files = cast(Sequence[object], release_files)
        if not any(
            isinstance(file, Mapping)
            and (
                "yanked" not in (file_metadata := cast(Mapping[str, object], file))
                or file_metadata["yanked"] is False
            )
            for file in release_files
        ):
            continue
        try:
            parsed = Version(raw_version)
        except InvalidVersion:
            continue
        if not parsed.is_prerelease and not parsed.is_devrelease:
            stable_versions.append(parsed)

    if not stable_versions:
        raise PluginError("No stable package release was found")
    return str(max(stable_versions))
