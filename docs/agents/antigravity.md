# Antigravity

This project integrates with Google Antigravity through its official MCP
configuration paths and the adapter-defined managed package skill paths. The
installer writes JSON directly.

## Lifecycle

Run these commands from the project root. The default scope is `project`.

```bash
# Project scope: <project>/.agents/...
npx -y mcp-compras-publicas-br@V plugin install --agent antigravity
npx -y mcp-compras-publicas-br@V plugin update --agent antigravity
npx -y mcp-compras-publicas-br@V plugin uninstall --agent antigravity

# User scope: ~/.gemini/config/...
npx -y mcp-compras-publicas-br@V plugin install --agent antigravity --scope user
npx -y mcp-compras-publicas-br@V plugin update --agent antigravity --scope user
npx -y mcp-compras-publicas-br@V plugin uninstall --agent antigravity --scope user
```

`install` and `update` register the server with a stable, exact package
version. `update` requires an existing managed MCP entry; it resolves the
newest stable npm release before writing the new pin and does not install a
missing entry. Use `install` first. `uninstall` removes only the entry and
skill managed by this package; unrelated servers and custom skills are
preserved.

## Official Locations

| Scope | MCP configuration | Managed skill |
| --- | --- | --- |
| Project | `.agents/mcp_config.json` | `.agents/skills/mcp-compras-publicas-br/SKILL.md` |
| User | `~/.gemini/config/mcp_config.json` | `~/.gemini/config/skills/mcp-compras-publicas-br/SKILL.md` |

Antigravity instructions are separate from MCP and skills:

- Global instructions: `~/.gemini/GEMINI.md`.
- Workspace instructions/rules: `.agents/rules/`.
- `.agent/rules/` remains supported by Antigravity as a legacy workspace
  location, but this integration uses the current `.agents` location.

The `SKILL.md` at each path above is the managed package skill consumed by this
adapter according to the selected scope and path. It contains the project MCP
usage instructions; it is not an Antigravity rules/instructions file. The
package template is marker-first and has no description frontmatter, so native
Antigravity skill discovery is not guaranteed. Use the adapter path and MCP
entry as the integration contract.

## MCP Entry

Antigravity expects a JSON document with an `mcpServers` object. The managed
entry has this shape, with `<version>` replaced by the exact stable version
installed or updated:

```json
{
  "mcpServers": {
    "compras-publicas-br": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-compras-publicas-br@<version>"
      ]
    }
  }
}
```

This is a local `stdio` server: `command` starts `npx`, and `args` runs the
version-pinned `mcp-compras-publicas-br` package. Do not replace it with a
`serverUrl`; that is the remote-server form and is not used here. The
Antigravity adapter emits no `managedBy` field. It recognizes ownership only
when the entry has the exact pinned `command` and `args` shape shown above;
extra, missing, or mismatched fields may not be recognized as managed.

The equivalent pinned command is:

```bash
npx -y mcp-compras-publicas-br@<version>
```

## Validation

1. Confirm that the selected file exists and parses as JSON:

   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.agents/mcp_config.json', 'utf8'))"
   ```

   For user scope, validate `~/.gemini/config/mcp_config.json` instead.

2. Confirm that `mcpServers["compras-publicas-br"]` has `command: "npx"` and
   exactly two arguments `-y` and `mcp-compras-publicas-br@<version>`, with no
   extra entry fields. Extra, missing, or mismatched fields may prevent the
   adapter from recognizing the entry.

3. In Antigravity IDE, open `...` in the agent side panel, select **MCP
   Servers**, then **Manage MCP Servers** and **View raw config**. In
   Antigravity CLI, enter `/mcp` to open the MCP Manager and inspect the
   server status and connection logs.

4. Confirm that the corresponding `SKILL.md` exists at the scope-specific
   path above and starts with the package management marker. Native skill-list
   discovery is not guaranteed for this marker-first package template, so do
   not treat its absence from that list as an MCP configuration failure.

Official documentation:

- [Antigravity MCP](https://antigravity.google/docs/mcp)
- [Antigravity Skills](https://antigravity.google/docs/skills/)
- [Antigravity Rules and instructions](https://antigravity.google/docs/rules-workflows/)
