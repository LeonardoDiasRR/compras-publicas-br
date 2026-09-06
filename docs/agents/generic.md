# Generic `.agent`

Use this convention when an MCP-capable agent does not have a dedicated
adapter. The project-scoped files live in the repository; user-scoped files
live in the user's home directory:

```text
project/
  .agent/
    mcp.json
    skills/
      compras-publicas-br.md

user home/
  .agent/
    mcp.json
    skills/
      compras-publicas-br.md
```

The generic manifest is ordinary JSON. It does not replace an agent's native
configuration; an agent must explicitly support reading `.agent/mcp.json` or
be configured to use this path.

## MCP Manifest

The top-level `mcpServers` object maps a server name to its launch
configuration. The stable entry installed by this project is:

```json
{
  "mcpServers": {
    "compras-publicas-br": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-compras-publicas-br==0.1.0",
        "mcp-compras-publicas-br"
      ],
      "managedBy": {
        "package": "mcp-compras-publicas-br",
        "schemaVersion": 1
      }
    }
  }
}
```

`command` is the executable, and `args` are passed to it in order. The
version pin in `--from` is required: replace `0.1.0` only when installing or
updating to a specific published stable version. Do not remove the pin.

`managedBy` identifies entries owned by this package:

- `package` must be `mcp-compras-publicas-br`.
- `schemaVersion` must be the integer `1`.

Keep the metadata unchanged. It lets the installer update or remove its own
entry while preserving unrelated MCP servers. If the target container or the
same-named entry does not match the managed shape, the installer reports a
configuration conflict and leaves that entry untouched rather than
overwriting it.

## Skill

The managed skill is written to:

```text
.agent/skills/compras-publicas-br.md
```

It contains the MCP usage instructions for the selected agent and starts with
the management marker:

```text
<!-- managed-by: mcp-compras-publicas-br; format: 1 -->
```

The project and user scopes use the same relative path under their respective
roots. Do not manually replace a skill that does not contain this marker;
uninstall preserves skills it cannot identify as package-managed.

## Scopes

The default scope is `project`:

```text
<project root>/.agent/mcp.json
<project root>/.agent/skills/compras-publicas-br.md
```

The `user` scope uses the home directory and applies to agents launched for
that user:

```text
<user home>/.agent/mcp.json
<user home>/.agent/skills/compras-publicas-br.md
```

Project scope is appropriate for a repository-specific setup. User scope is
appropriate when the same server should be available across projects. The
installer creates missing `.agent` directories and preserves unrelated JSON
members.

## Lifecycle Commands

Install into the current project:

```bash
uvx mcp-compras-publicas-br install --agent generic
```

Install into the user scope:

```bash
uvx mcp-compras-publicas-br install --agent generic --scope user
```

Update an existing installation to the latest stable PyPI release:

```bash
uvx mcp-compras-publicas-br update --agent generic
uvx mcp-compras-publicas-br update --agent generic --scope user
```

Remove the package-managed entry and marked skill:

```bash
uvx mcp-compras-publicas-br uninstall --agent generic
uvx mcp-compras-publicas-br uninstall --agent generic --scope user
```

The lifecycle commands intentionally invoke `uvx mcp-compras-publicas-br`
without a version pin. This controls how the CLI package is resolved; the
generated manifest command remains pinned to the exact package version used by
the installer. `update` requires a recognizable installation in the requested
scope and keeps the resulting manifest command version-pinned. If PyPI cannot
be queried, it makes no file changes. `install` and `update` report a
configuration conflict instead of overwriting an unrecognized same-named
entry. `uninstall` leaves such an entry untouched and preserves any skill
whose management marker does not match this package.

## Agent Consumption

An MCP-capable generic agent can consume the manifest as follows:

1. Resolve `.agent/mcp.json` in the selected project or user scope.
2. Parse the JSON and read `mcpServers`.
3. Select `compras-publicas-br` and start its `command` with the listed `args`.
4. Connect the process using the MCP `stdio` transport.
5. Discover and call the tools exposed by the server; load the companion skill
   from `.agent/skills/compras-publicas-br.md` when the agent supports skills.

The agent should treat `managedBy` as package metadata, not as a process
argument. It may ignore unknown metadata while still using `command` and
`args`. Agents that do not implement this `.agent` convention can consume the
same server by copying the equivalent `mcpServers.compras-publicas-br` entry
into their documented MCP configuration format.
