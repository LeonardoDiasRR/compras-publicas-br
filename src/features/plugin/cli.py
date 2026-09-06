import argparse
import subprocess
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Literal, cast

from src.features.plugin.adaptadores import get_adapter, supported_agent_ids
from src.features.plugin.escopo import resolve_scope
from src.features.plugin.instalador import InstallerService
from src.features.plugin.modelos import (
    ConfigConflictError,
    ConfigFormatError,
    OperationResult,
    PluginError,
    ScopeName,
)
from src.features.plugin.versoes import installed_version, latest_stable_version

Operation = Literal["install", "update", "uninstall"]


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage the MCP plugin configuration")
    subparsers = parser.add_subparsers(dest="operation", required=True)
    for operation in ("install", "update", "uninstall"):
        command = subparsers.add_parser(operation, help=f"{operation} the plugin")
        command.add_argument(
            "--agent", required=True, choices=supported_agent_ids(), help="target agent"
        )
        command.add_argument(
            "--scope",
            choices=("project", "user"),
            default="project",
            help="configuration scope (default: project)",
        )
    return parser


def _print_result(agent: str, scope: ScopeName, result: OperationResult) -> None:
    print(f"agent: {agent}")
    print(f"scope: {scope}")
    print(f"config_path: {result.config_path}")
    print(f"skill_path: {result.skill_path}")
    print(f"version: {result.version}")
    print(f"changed: {result.changed}")
    print(f"warnings: {', '.join(result.warnings) if result.warnings else 'none'}")


def run_operation(
    *,
    operation: Operation,
    agent: str,
    scope: ScopeName,
    start: Path | None = None,
) -> OperationResult | None:
    resolved_scope = resolve_scope(scope, start if start is not None else Path.cwd())
    adapter = get_adapter(agent)
    version_resolver = latest_stable_version if operation == "update" else installed_version
    service = InstallerService(adapter, resolved_scope, version_resolver)
    result = getattr(service, operation)()
    _print_result(adapter.agent_id, scope, result)
    return result


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = _parser().parse_args(argv)
    except SystemExit as error:
        return error.code if isinstance(error.code, int) else 2

    try:
        result = run_operation(
            operation=cast(Operation, args.operation),
            agent=cast(str, args.agent),
            scope=cast(ScopeName, args.scope),
        )
        if result is not None and any(
            "Conflict preserved" in warning for warning in result.warnings
        ):
            return 3
    except (ConfigFormatError, ConfigConflictError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 3
    except (PluginError, OSError, subprocess.SubprocessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 4
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 3
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 4
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
