import json
import os
import stat
import tempfile
from collections.abc import Callable, MutableMapping
from pathlib import Path
from typing import Literal, cast

import json5
import tomlkit

from src.features.plugin.modelos import ConfigFormatError

FormatName = Literal["json", "json5", "toml"]
MappingValue = MutableMapping[str, object]


def load_document(path: Path, format_name: FormatName) -> dict[str, object]:
    try:
        content = path.read_text(encoding="utf-8")
        if format_name == "json":
            document = json.loads(content)
        elif format_name == "json5":
            document = json5.loads(content)
        elif format_name == "toml":
            document = tomlkit.parse(content)
        else:
            raise ConfigFormatError(f"unsupported configuration format: {format_name}")
    except ConfigFormatError:
        raise
    except (OSError, ValueError, TypeError) as error:
        raise ConfigFormatError(f"invalid {format_name} configuration: {path}") from error

    if not isinstance(document, dict):
        raise ConfigFormatError(f"configuration root must be a mapping: {path}")
    return cast(dict[str, object], document)


def _find_container(
    document: dict[str, object], container_path: tuple[str, ...], create_missing: bool
) -> MappingValue | None:
    current = cast(MappingValue, document)
    for key in container_path:
        if key not in current:
            if not create_missing:
                return None
            current[key] = {}
        value = current[key]
        if isinstance(value, MutableMapping):
            current = cast(MappingValue, value)
        else:
            return None
    return current


def merge_mcp_entry(
    document: dict[str, object],
    container_path: tuple[str, ...],
    name: str,
    entry: dict[str, object],
    owns: Callable[[object], bool],
) -> tuple[dict[str, object], bool]:
    container = _find_container(document, container_path, create_missing=True)
    if container is None:
        return document, False

    current = container.get(name)
    if name not in container:
        container[name] = entry
        return document, True
    if owns(current):
        if current == entry:
            return document, False
        container[name] = entry
        return document, True
    return document, False


def remove_mcp_entry(
    document: dict[str, object],
    container_path: tuple[str, ...],
    name: str,
    owns: Callable[[object], bool],
) -> tuple[dict[str, object], bool]:
    container = _find_container(document, container_path, create_missing=False)
    if container is None or name not in container:
        return document, False
    if not owns(container[name]):
        return document, False
    del container[name]
    return document, True


def dump_document(document: dict[str, object], format_name: FormatName) -> str:
    if format_name == "json":
        return f"{json.dumps(document, indent=2)}\n"
    if format_name == "json5":
        return f"{json5.dumps(document, indent=2)}\n"
    if format_name == "toml":
        return tomlkit.dumps(document)
    raise ConfigFormatError(f"unsupported configuration format: {format_name}")


def atomic_write(path: Path, content: str) -> None:
    temporary_path: Path | None = None
    existing_mode: int | None = None
    try:
        try:
            existing_mode = stat.S_IMODE(path.stat().st_mode)
        except FileNotFoundError:
            pass

        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            if existing_mode is not None:
                os.chmod(temporary_path, existing_mode)
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())

        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
