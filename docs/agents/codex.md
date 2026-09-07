# Codex

Configure the MCP Compras Públicas Brasil server for Codex CLI. The local
integration uses the `stdio` transport and starts the server through `npx`.

## Requirements

- Install Node.js, which provides `npm` and `npx`.
- Have the `codex` command available.

## Install, Update, and Remove

The project scope is the default and writes to the repository's Codex
configuration. Use `--scope user` to write the user-level configuration.

```bash
# Project scope: .codex/config.toml
npx -y mcp-compras-publicas-br@0.1.0 plugin install --agent codex --scope project

# User scope: ~/.codex/config.toml
npx -y mcp-compras-publicas-br@0.1.0 plugin install --agent codex --scope user
```

The same scopes apply to lifecycle operations:

```bash
npx -y mcp-compras-publicas-br@0.1.0 plugin update --agent codex --scope project
npx -y mcp-compras-publicas-br@0.1.0 plugin update --agent codex --scope user

npx -y mcp-compras-publicas-br@0.1.0 plugin uninstall --agent codex --scope project
npx -y mcp-compras-publicas-br@0.1.0 plugin uninstall --agent codex --scope user
```

`update` replaces the managed entry with the latest stable package version.
`uninstall` removes only the entry and skill managed by this package. Existing
unrelated Codex configuration is preserved.

## Configuration

Codex reads project configuration from `.codex/config.toml` in a trusted
repository. Codex itself reads user configuration from `~/.codex/config.toml`,
or from `$CODEX_HOME/config.toml` when `CODEX_HOME` is set. The package adapter
uses the documented default paths based on `Path.home()`; it does not honor
`CODEX_HOME` automatically. If `CODEX_HOME` is set, manually align the Codex
configuration with that custom home. `CODEX_HOME` also changes where Codex
resolves global `AGENTS.md` and `AGENTS.override.md`; user skill discovery
remains under `$HOME/.agents/skills`, not `$CODEX_HOME/.agents/skills`.

The corresponding exact TOML entry is:

```toml
[mcp_servers.compras-publicas-br]
command = "npx"
args = ["-y", "mcp-compras-publicas-br@0.1.0"]
```

For Codex, the adapter recognizes the exact `command` and pinned `args` shape
above; it does not require `managedBy`. Extra fields, including `managedBy`, or
a different command or package pin may prevent the installer from recognizing
the entry.

The package version is intentionally pinned. Replace `0.1.0` only when
installing or updating to a specific published stable version. Do not put
credentials in this entry.

Codex also supports adding a user-scoped server with its native CLI:

```bash
codex mcp add compras-publicas-br -- npx -y mcp-compras-publicas-br@0.1.0
```

This native entry does not include package ownership metadata. It can be
recognized only while it retains the exact command and pinned `args` shape;
extra or mismatched fields may make it unrecognized by installer `update` or
`uninstall`. Use the installer commands above for the managed lifecycle.

For project scope, edit the trusted repository's `.codex/config.toml` instead.

## Instructions and Skills

Codex loads `AGENTS.md` instructions in layers:

- Global guidance: Codex uses `~/.codex/AGENTS.override.md` when present;
  otherwise it uses `~/.codex/AGENTS.md` (or the corresponding files under
  `$CODEX_HOME` when Codex uses a custom home).
- Project guidance: `AGENTS.md` files from the repository root down to the
  current directory.
- `AGENTS.override.md` takes precedence over `AGENTS.md` at the same level.

The managed skill follows the open agent skills convention, but this package's
skill is marker-first rather than YAML-frontmatter-first. It starts with:

```markdown
<!-- managed-by: mcp-compras-publicas-br; format: 1 -->
```

The Codex adapter writes:

- Project scope: `.agents/skills/mcp-compras-publicas-br/SKILL.md`.
- User scope: `~/.agents/skills/mcp-compras-publicas-br/SKILL.md`.

Codex scans `.agents/skills` from the current directory up to the repository
root, and also scans `$HOME/.agents/skills` for user skills. Each skill is a
directory containing a `SKILL.md`. Native Codex skill discovery is unsupported
for this package-managed template: the generated skill has no required
`name`/`description` YAML frontmatter. The marker identifies the file for the
package adapter, but does not make it a natively discoverable Codex skill.
`CODEX_HOME` changes Codex's config and global instruction resolution only; the
adapter still writes its user skill under `~/.agents/skills`, where Codex user
skill discovery remains.

## Verify the Connection

First confirm that Codex sees the configured server:

```bash
codex mcp list
```

The output should contain `compras-publicas-br`, with the pinned `npx`
command. In the Codex TUI, run `/mcp` to inspect active MCP servers. For an
end-to-end check, ask Codex to make a small read-only query through the
`compras-publicas-br` server and report the official source and returned ID.

If the server is missing, check the selected scope and the path reported by
the install command. If the server is listed but unavailable, verify that
`npx` is on `PATH`, then restart Codex after changing configuration or skills.

## Official Documentation

- [Codex MCP](https://developers.openai.com/codex/extend/mcp)
- [Codex skills](https://developers.openai.com/codex/build-skills)
- [Codex AGENTS.md instructions](https://developers.openai.com/codex/agent-configuration/agents-md)
