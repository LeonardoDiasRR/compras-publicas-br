from importlib.resources import files
from pathlib import Path

from src.features.plugin.armazenamento import atomic_write
from src.features.plugin.modelos import ScopeName

MANAGED_MARKER = "managed-by: mcp-compras-publicas-br; format: 1"
_COMMENTED_MARKER = f"<!-- {MANAGED_MARKER} -->"
_TEMPLATE = files("src.features.plugin").joinpath("templates", "skill.md")


def render_skill(agent_id: str, agent_name: str, scope: ScopeName) -> str:
    content = _TEMPLATE.read_text(encoding="utf-8")
    rendered = (
        content.replace("{{AGENT_ID}}", agent_id)
        .replace("{{AGENT_NAME}}", agent_name)
        .replace("{{SCOPE}}", scope)
    )
    return rendered if rendered.endswith("\n") else f"{rendered}\n"


def is_managed_skill(path: Path) -> bool:
    if path.is_symlink() or not path.is_file():
        return False

    prefix_length = max(len(MANAGED_MARKER), len(_COMMENTED_MARKER))
    try:
        with path.open(encoding="utf-8") as skill_file:
            prefix = skill_file.read(prefix_length + 1)
    except (OSError, UnicodeError):
        return False

    for marker in (MANAGED_MARKER, _COMMENTED_MARKER):
        if prefix == marker or prefix.startswith((f"{marker}\n", f"{marker}\r")):
            return True
    return False


def write_managed_skill(path: Path, agent_id: str, agent_name: str, scope: ScopeName) -> bool:
    if path.is_symlink():
        return False

    content = render_skill(agent_id, agent_name, scope)
    if path.exists():
        if not is_managed_skill(path) or path.read_text(encoding="utf-8") == content:
            return False
    else:
        path.parent.mkdir(parents=True, exist_ok=True)

    atomic_write(path, content)
    return True


def remove_managed_skill(path: Path) -> bool:
    if not is_managed_skill(path):
        return False
    path.unlink()
    return True
