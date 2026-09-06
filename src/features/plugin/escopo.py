import logging
from pathlib import Path

from src.features.plugin.modelos import ScopeName, ScopeTarget

logger = logging.getLogger(__name__)


def find_project_root(start: Path) -> Path | None:
    for candidate in (start.resolve(), *start.resolve().parents):
        git_path = candidate / ".git"
        if git_path.is_dir() or git_path.is_file():
            return candidate
    return None


def resolve_scope(scope: ScopeName, start: Path, home: Path | None = None) -> ScopeTarget:
    if scope == "user":
        user_root = home if home is not None else Path.home()
        return ScopeTarget(scope=scope, root=user_root, used_git_root=False)

    project_root = find_project_root(start)
    if project_root is not None:
        return ScopeTarget(scope=scope, root=project_root, used_git_root=True)

    logger.warning("Git não encontrado; usando o diretório atual.")
    return ScopeTarget(scope=scope, root=start.resolve(), used_git_root=False)
