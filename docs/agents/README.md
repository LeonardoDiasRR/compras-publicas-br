# Instalação por agente

Este índice mostra o fluxo comum para instalar o MCP Compras Públicas Brasil
em um agente de código. O instalador não detecta o agente automaticamente:
informe sempre o ID com `--agent`.

## Agentes suportados

| ID | Instruções específicas |
| --- | --- |
| `claude-code` | [Claude Code](./claude-code.md) |
| `codex` | [Codex](./codex.md) |
| `opencode` | [OpenCode](./opencode.md) |
| `deepseek-harness` | [DeepSeek Harness](./deepseek-harness.md) |
| `pi` | [Pi](./pi.md) |
| `antigravity` | [Antigravity](./antigravity.md) |
| `cursor` | [Cursor](./cursor.md) |
| `hermes-agent` | [Hermes Agent](./hermes-agent.md) |
| `openclaw` | [OpenClaw](./openclaw.md) |
| `generic` | [Formato genérico `.agent`](./generic.md) |

## Fluxo comum

### Instalar no projeto

Por padrão, a instalação usa o escopo `project`:

```bash
npx -y mcp-compras-publicas-br@X.Y.Z plugin install --agent <id>
```

No escopo de projeto, o instalador procura a raiz Git subindo a partir do
diretório atual. Se não encontrar um repositório Git, usa o diretório atual e
emite um aviso.

### Instalar para o usuário

Para registrar o MCP na configuração global do usuário:

```bash
npx -y mcp-compras-publicas-br@X.Y.Z plugin install --agent <id> --scope user
```

O destino global segue o diretório padrão do agente e do sistema operacional.

### Atualizar

```bash
npx -y mcp-compras-publicas-br@X.Y.Z plugin update --agent <id>
npx -y mcp-compras-publicas-br@X.Y.Z plugin update --agent <id> --scope user
```

`update` exige uma instalação reconhecível no escopo informado. Busca a versão
estável mais recente no npm, atualiza o registro e a skill gerenciada e não
modifica arquivos se o npm estiver indisponível.

### Desinstalar

```bash
npx -y mcp-compras-publicas-br@X.Y.Z plugin uninstall --agent <id>
npx -y mcp-compras-publicas-br@X.Y.Z plugin uninstall --agent <id> --scope user
```

`uninstall` remove somente a entrada `compras-publicas-br` e a skill que o
pacote conseguir reconhecer como gerenciadas. Conteúdo não reconhecido é
preservado e reportado.

## Regras importantes

- `--scope` aceita `project` e `user`; quando omitido, usa `project` sem fazer
  perguntas.
- A instalação e a atualização fazem merge somente da entrada
  `compras-publicas-br`; outras configurações do arquivo são preservadas.
- A skill é criada ou atualizada como arquivo próprio em português do Brasil e
  contém um marcador de gerenciamento. Uma skill existente sem esse marcador
  não é sobrescrita.
- O registro usa `npx` com a versão exata do pacote em execução, no formato
  `npx -y mcp-compras-publicas-br@<versão>`.
- A atualização fixa o registro na versão estável selecionada, preservando o
  merge e a skill gerenciada.
- O adaptador usa a CLI oficial quando há uma interface estável; caso
  contrário, edita o arquivo nativo do agente com escrita segura.

Para detalhes de formato, caminhos e verificação de cada agente, consulte os
links na tabela acima.
