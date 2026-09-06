import os
import tempfile
from collections.abc import Callable, Mapping
from copy import deepcopy
from pathlib import Path
from typing import Protocol, cast

from src.features.plugin.adaptadores import AgentAdapter
from src.features.plugin.armazenamento import (
    atomic_write,
    dump_document,
    load_document,
    merge_mcp_entry,
    remove_mcp_entry,
)
from src.features.plugin.escopo import resolve_scope
from src.features.plugin.modelos import OperationResult, ScopeTarget
from src.features.plugin.skills import is_managed_skill, render_skill
from src.features.plugin.versoes import installed_version, latest_stable_version

_ENTRY_NAME = "compras-publicas-br"
_MISSING = object()
_CONFLICT = object()


def _mapping(value: object) -> Mapping[str, object] | None:
    if not isinstance(value, Mapping):
        return None
    return cast(Mapping[str, object], value)


class _VersionResolver(Protocol):
    def installed_version(self) -> str: ...

    def latest_stable_version(self) -> str: ...


VersionResolver = _VersionResolver | Callable[[], str]


class _TestingVersionResolver:
    def __init__(self, latest_version: str | None) -> None:
        self._latest_version = latest_version

    def installed_version(self) -> str:
        return installed_version()

    def latest_stable_version(self) -> str:
        return (
            self._latest_version
            if self._latest_version is not None
            else latest_stable_version()
        )


class InstallerService:
    def __init__(
        self,
        adapter: AgentAdapter,
        scope: ScopeTarget,
        version_resolver: VersionResolver,
        home: Path | None = None,
    ) -> None:
        self._adapter = adapter
        self._scope = scope
        self._version_resolver = version_resolver
        self._home = (home if home is not None else Path.home()).resolve()
        self._target = adapter.resolve_target(scope.scope, scope.root, self._home)
        adapter.validate_target(self._target)

    @classmethod
    def for_testing(
        cls, root: Path, agent: str, latest_version: str | None = None
    ) -> "InstallerService":
        from src.features.plugin.adaptadores import get_adapter

        resolved_scope = resolve_scope("project", root, home=root)
        return cls(
            get_adapter(agent),
            resolved_scope,
            _TestingVersionResolver(latest_version),
            root,
        )

    def install(self) -> OperationResult:
        version = self._installed_version()
        entry = self._adapter.build_entry(version)
        document, config_exists = self._read_config()
        existing = self._entry(document)
        if existing is _CONFLICT or (
            existing is not _MISSING and not self._adapter.owns_entry(existing)
        ):
            return self._result(
                changed=False,
                version=version,
                warnings=(self._conflict_warning(),),
            )

        merged, config_changed = merge_mcp_entry(
            document,
            self._target.container_path,
            _ENTRY_NAME,
            entry,
            self._adapter.owns_entry,
        )
        skill_content, skill_changed, skill_warning = self._planned_skill()
        if skill_warning is not None and not config_changed:
            return self._result(False, version, (skill_warning,))

        config_content = dump_document(merged, self._target.config_format)
        self._commit(
            config_content if config_changed or not config_exists else None,
            skill_content if skill_changed else None,
        )
        warnings = (skill_warning,) if skill_warning is not None else ()
        return self._result(config_changed or skill_changed, version, warnings)

    def update(self) -> OperationResult:
        document, config_exists = self._read_config()
        existing = self._entry(document)
        if existing is _CONFLICT:
            return self._result(False, "", (self._conflict_warning(),))
        if existing is _MISSING:
            return self._result(False, "", ("No managed MCP entry was found.",))
        if not self._adapter.owns_entry(existing):
            return self._result(False, "", (self._conflict_warning(),))

        version = self._latest_version()
        canonical_entry = self._adapter.build_entry(version)
        entry = self._update_pin(existing, canonical_entry)
        merged, config_changed = merge_mcp_entry(
            document,
            self._target.container_path,
            _ENTRY_NAME,
            entry,
            self._adapter.owns_entry,
        )
        skill_content, skill_changed, skill_warning = self._planned_skill()
        config_content = dump_document(merged, self._target.config_format)
        self._commit(
            config_content if config_changed or not config_exists else None,
            skill_content if skill_changed else None,
        )
        warnings = (skill_warning,) if skill_warning is not None else ()
        return self._result(config_changed or skill_changed, version, warnings)

    def uninstall(self) -> OperationResult:
        document, config_exists = self._read_config()
        existing = self._entry(document)
        managed_entry = existing is not _MISSING and existing is not _CONFLICT
        if managed_entry:
            managed_entry = self._adapter.owns_entry(existing)
        managed_skill = is_managed_skill(self._target.skill_path)
        warnings: list[str] = []
        if existing is _CONFLICT or (existing is not _MISSING and not managed_entry):
            warnings.append(self._conflict_warning())
        if self._has_unmanaged_skill():
            warnings.append(self._unmanaged_skill_warning())
        if not managed_entry and not managed_skill:
            warnings.append("No managed MCP entry or skill was found.")
        has_entry_conflict = existing is _CONFLICT or (
            existing is not _MISSING and not managed_entry
        )
        if has_entry_conflict and not managed_skill:
            return self._result(False, "", tuple(warnings))

        removed_document, config_changed = remove_mcp_entry(
            document,
            self._target.container_path,
            _ENTRY_NAME,
            self._adapter.owns_entry,
        )
        skill_changed = managed_skill
        version = self._entry_version(existing)
        config_content = dump_document(removed_document, self._target.config_format)
        self._commit(
            config_content if config_changed and config_exists else None,
            None,
            delete_skill=skill_changed,
        )
        return self._result(config_changed or skill_changed, version, tuple(warnings))

    def _read_config(self) -> tuple[dict[str, object], bool]:
        path = self._target.config_path
        if not path.exists():
            return {}, False
        return load_document(path, self._target.config_format), True

    def _entry(self, document: Mapping[str, object]) -> object:
        current: object = document
        for key in self._target.container_path:
            mapping = _mapping(current)
            if mapping is None:
                return _CONFLICT
            if key not in mapping:
                return _MISSING
            current = mapping[key]
        mapping = _mapping(current)
        if mapping is None:
            return _CONFLICT
        return mapping.get(_ENTRY_NAME, _MISSING)

    def _has_unmanaged_skill(self) -> bool:
        path = self._target.skill_path
        return (path.exists() or path.is_symlink()) and not is_managed_skill(path)

    def _planned_skill(self) -> tuple[str | None, bool, str | None]:
        path = self._target.skill_path
        if path.exists() or path.is_symlink():
            if not is_managed_skill(path):
                return None, False, f"Unmanaged skill preserved: {path}"
        content = render_skill(
            self._adapter.agent_id, self._adapter.display_name, self._scope.scope
        )
        try:
            unchanged = path.read_text(encoding="utf-8") == content
        except (FileNotFoundError, OSError, UnicodeError):
            unchanged = False
        return content, not unchanged, None

    def _commit(
        self,
        config_content: str | None,
        skill_content: str | None,
        delete_skill: bool = False,
    ) -> None:
        writes = tuple(
            (path, content)
            for path, content in (
                (self._target.config_path, config_content),
                (self._target.skill_path, skill_content),
            )
            if content is not None
        )
        snapshot_paths = tuple(path for path, _ in writes) + (
            (self._target.skill_path,) if delete_skill else ()
        )
        snapshots = {path: self._snapshot(path) for path in snapshot_paths}
        try:
            for path, _ in writes:
                path.parent.mkdir(parents=True, exist_ok=True)
            if config_content is not None:
                atomic_write(self._target.config_path, config_content)
            if skill_content is not None:
                atomic_write(self._target.skill_path, skill_content)
            elif delete_skill:
                self._target.skill_path.unlink()
        except BaseException:
            for path, snapshot in snapshots.items():
                self._restore(path, snapshot)
            raise

    def _snapshot(self, path: Path) -> tuple[bool, bytes | None]:
        exists = path.exists() or path.is_symlink()
        return exists, path.read_bytes() if exists else None

    def _restore(self, path: Path, snapshot: tuple[bool, bytes | None]) -> None:
        existed, content = snapshot
        if not existed:
            path.unlink(missing_ok=True)
        elif content is not None:
            atomic_write(path, content.decode("utf-8"))
            if path.read_bytes() != content:
                self._restore_bytes(path, content)

    def _restore_bytes(self, path: Path, content: bytes) -> None:
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                dir=path.parent,
                prefix=f".{path.name}.",
                suffix=".tmp",
                delete=False,
            ) as temporary:
                temporary_path = Path(temporary.name)
                temporary.write(content)
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_path, path)
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)

    def _installed_version(self) -> str:
        if callable(self._version_resolver):
            return self._version_resolver()
        return self._version_resolver.installed_version()

    def _latest_version(self) -> str:
        if callable(self._version_resolver):
            return self._version_resolver()
        return self._version_resolver.latest_stable_version()

    def _update_pin(self, existing: object, canonical: Mapping[str, object]) -> dict[str, object]:
        entry = deepcopy(cast(dict[str, object], existing))
        existing_args = entry.get("args")
        canonical_args = canonical.get("args")
        if not isinstance(existing_args, list) or not isinstance(canonical_args, list):
            return dict(canonical)
        existing_args = cast(list[object], existing_args)
        canonical_args = cast(list[object], canonical_args)
        if len(existing_args) < 2 or len(canonical_args) < 2:
            return dict(canonical)
        existing_args[1] = canonical_args[1]
        return entry

    def _entry_version(self, entry: object) -> str:
        mapping = _mapping(entry)
        if mapping is not None:
            args = mapping.get("args")
            if not isinstance(args, list):
                return ""
            values = cast(list[object], cast(object, args))
            if len(values) > 1 and isinstance(values[1], str):
                return values[1]
        return ""

    def _conflict_warning(self) -> str:
        return f"Conflict preserved for managed MCP entry in {self._target.config_path}."

    def _unmanaged_skill_warning(self) -> str:
        return f"Unmanaged skill preserved: {self._target.skill_path}"

    def _result(self, changed: bool, version: str, warnings: tuple[str, ...]) -> OperationResult:
        return OperationResult(
            changed=changed,
            config_path=self._target.config_path,
            skill_path=self._target.skill_path,
            version=version,
            warnings=warnings,
        )
