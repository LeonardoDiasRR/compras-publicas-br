# DeepSeek Harness

This guide covers the `deepseek-harness` target only. DeepSeek Harness is a
[developer-preview, plugin-based application](https://github.com/deepseek-ai/deepseek-harness#readme)
whose native setup uses Cordis YAML configuration.

## Lifecycle

The plugin CLI uses `project` scope by default. It walks upward from the
current directory to the Git root; if no Git root exists, it uses the current
directory and reports a warning. This behavior belongs to this repository's
[scope resolver](../../src/features/plugin/escopo.py), not to DeepSeek Harness.

The lifecycle commands below invoke this package through `uvx` and therefore
require a published package on PyPI. They do not execute this checkout.

Install for the current project:

```text
uvx mcp-compras-publicas-br install --agent deepseek-harness
```

Install in the user scope:

```text
uvx mcp-compras-publicas-br install --agent deepseek-harness --scope user
```

Update the recognized installation and managed skill:

```text
uvx mcp-compras-publicas-br update --agent deepseek-harness
uvx mcp-compras-publicas-br update --agent deepseek-harness --scope user
```

Remove only the recognized installation and managed skill:

```text
uvx mcp-compras-publicas-br uninstall --agent deepseek-harness
uvx mcp-compras-publicas-br uninstall --agent deepseek-harness --scope user
```

The generated server command is pinned to the package version. The following
is the exact stdio command for version `0.1.0`:

```text
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br
```

This command resolves the package through PyPI and requires
`mcp-compras-publicas-br==0.1.0` to have been published there; `uvx` does not
run this checkout or an unpublished local build. See the [`uvx --from` and
versioning documentation](https://docs.astral.sh/uv/guides/tools/#requesting-specific-versions).

Do not replace the exact pin with an unversioned `uvx` command in a persisted
configuration. `update` is the lifecycle operation that changes the pin.

## Official MCP Format

DeepSeek Harness officially loads the
[`@deepseek-ai/dsh-mcp-client`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md)
plugin from its Cordis YAML configuration. The MCP client accepts `stdio` and
`streamable-http`; this integration uses `stdio`.

The native entry has this shape:

```yaml
- insert:
    - id: compras-publicas-br
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: compras-publicas-br
        transport: stdio
        command: uvx
        args:
          - --from
          - mcp-compras-publicas-br==0.1.0
          - mcp-compras-publicas-br
```

`serverName` must be unique within the active registration scope and must
match `[A-Za-z0-9_-]{1,32}`. After startup, discovered tools use the native
names `mcp__compras-publicas-br__<tool-name>`.

For a normal `dsh` profile, put this entry in the profile patch. The
[profile boot source](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/profile-boot.ts)
defines this patch layer as:

```text
$DSH_HOME/profiles/<profile>/cordis.patch.yml
```

The user-wide patch layer, applied to every profile, is:

```text
$DSH_HOME/cordis.patch.yml
```

`$DSH_HOME` defaults to `~/.dsh` and can be overridden with the `DSH_HOME`
environment variable, as documented by the
[Harness-home resolver](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/src/index.ts).
A `dsh --profile ...` launch composes profile bundles and these
`cordis.patch.yml` layers.

Before the profile can load the entry, install the official MCP client plugin
in that profile. The `dsh` launcher forwards this plugin-management command to
the profile package manager, as shown in the
[official CLI source](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/args.ts):

```text
dsh plugin --profile <profile> add @deepseek-ai/dsh-mcp-client
```

The package's fixed `uvx` command starts the read-only MCP server over stdio;
DeepSeek Harness then exposes the server's tools through its MCP client. The
server command and read-only behavior are defined by this repository's
[plugin implementation](../../src/features/plugin/adaptadores.py) and
[project documentation](../../README.md).

## Official Skill Format

DeepSeek Harness's
[filesystem skill provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts)
accepts Markdown with YAML frontmatter. Both a flat file and a directory
bundle are supported:

```text
<skill-root>/<name>.md
<skill-root>/<name>/SKILL.md
```

The frontmatter must include `name` and `description`:

```markdown
---
name: compras-publicas-br
description: Consult official Brazilian public-procurement data.
---

Use the Compras Públicas Brasil MCP tools for read-only queries.
```

Official project skill roots, in precedence order, are defined by the same
[filesystem provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts):

```text
<project-root>/.dsh/skills/
<project-root>/.agents/skills/
```

Official user skill roots, in precedence order, are:

```text
$DSH_HOME/skills/
$DSH_AGENTS_HOME/skills/
```

The defaults are `~/.dsh/skills/` and `~/.agents/skills/`; the latter can be
overridden with `DSH_AGENTS_HOME`. A directory-bundle installation for this
package should therefore be either:

```text
<project-root>/.agents/skills/compras-publicas-br/SKILL.md
$DSH_AGENTS_HOME/skills/compras-publicas-br/SKILL.md
```

## Scopes And Adapter Output

The installer resolves these scopes as follows. These are this repository's
[adapter declarations](../../src/features/plugin/adaptadores.py), not native
DeepSeek Harness MCP paths:

| Scope | Installer config path | Installer skill path |
| --- | --- | --- |
| `project` | `<git-root>/.dsh/config.json` | `<git-root>/.agents/skills/mcp-compras-publicas-br/SKILL.md` |
| `user` | `~/.dsh/config.json` | `~/.agents/skills/mcp-compras-publicas-br/SKILL.md` |

The skill path is an official DeepSeek Harness discovery root. The config path
is not: it is the adapter's JSON fallback path and must not be described as a
native DeepSeek Harness MCP location.

## Fallback And Limitations

The current repository adapter has no DeepSeek Harness native CLI integration;
its adapter declaration has no native add/remove command. Its fallback writes
JSON with an `mcpServers` container to `.dsh/config.json` and writes the
managed skill file shown above. DeepSeek Harness officially expects the
Cordis YAML plugin row and does not document that JSON file as an MCP
configuration input. Installing the adapter alone therefore does not
guarantee that DeepSeek Harness loads the MCP server. See the adapter's
[native-command fields](../../src/features/plugin/adaptadores.py).

The generated skill template currently contains the package management marker
but does not provide the YAML frontmatter required by the official filesystem
skill provider. See the repository's
[skill template](../../src/features/plugin/templates/skill.md). To use the
skill natively, place equivalent content with valid frontmatter in one of the
official skill roots above. Preserve the management marker if the package
lifecycle commands must continue to recognize the file.

The fallback also does not install `@deepseek-ai/dsh-mcp-client` into a profile
or write `cordis.patch.yml`; perform those native steps explicitly. The
installer flow is implemented in the repository's
[installer service](../../src/features/plugin/instalador.py).

## Verification

1. Confirm that the profile contains the official plugin dependency. The
   `dsh plugin` forwarding behavior is defined in the
   [official CLI source](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/args.ts):

   ```text
   dsh plugin --profile <profile> why @deepseek-ai/dsh-mcp-client
   ```

2. Validate the composed native configuration without starting the profile.
   The launcher documents `--profile` and `--dump-config` in its
   [official argument source](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/args.ts):

   ```text
   dsh --profile <profile> --dump-config
   ```

    The output must contain `@deepseek-ai/dsh-mcp-client`,
   `serverName: compras-publicas-br`, `transport: stdio`, and the exact pinned
   `mcp-compras-publicas-br==0.1.0` argument.

3. Start the profile:

   ```text
   dsh --profile <profile>
   ```

    Confirm that the MCP tools are available under names beginning with
    `mcp__compras-publicas-br__`, as specified by the
    [MCP client reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md).
    A connection or discovery failure is reported by the MCP client; it is not
    evidence that the JSON fallback was loaded.

4. Verify the skill separately by checking that its file is under an official
   root and has YAML frontmatter with both `name` and `description`. The
    official skill provider can then list it in the agent's skill catalog; its
    required fields and roots are implemented in the
    [filesystem provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts).

Official references:

- [DeepSeek Harness MCP client](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md)
- [DeepSeek Harness configuration catalog](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)
- [DeepSeek Harness filesystem skill provider](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts)
