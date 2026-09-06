# Claude Code

- **Agent ID:** `claude-code`
- **Transporte:** `stdio`
- **Servidor:** `compras-publicas-br`

O instalador registra o servidor MCP local do Compras Públicas Brasil no
Claude Code. O processo do servidor é iniciado localmente pelo Claude Code;
isso não publica uma API.

## Instalar

No diretório do projeto, o escopo padrão é `project`:

```bash
uvx mcp-compras-publicas-br install --agent claude-code
```

Para instalar na configuração do usuário, disponível em todos os projetos:

```bash
uvx mcp-compras-publicas-br install --agent claude-code --scope user
```

O instalador preserva os demais servidores e arquivos não relacionados. No
escopo `project`, ele procura a raiz Git a partir do diretório atual; sem Git,
usa o diretório atual e emite um aviso.

## Atualizar e remover

```bash
uvx mcp-compras-publicas-br update --agent claude-code
uvx mcp-compras-publicas-br update --agent claude-code --scope user

uvx mcp-compras-publicas-br uninstall --agent claude-code
uvx mcp-compras-publicas-br uninstall --agent claude-code --scope user
```

`update` fixa a versão estável mais recente publicada no PyPI. `uninstall`
remove somente a entrada e a skill reconhecidas como gerenciadas pelo pacote.
As chamadas de ciclo de vida acima são conveniências executadas via `uvx`; a
entrada MCP gerada sempre grava o comando com a versão exata fixada.

## Escopos e arquivos

| Escopo do instalador | Claude Code | Configuração MCP | Skill gerenciada |
| --- | --- | --- | --- |
| `project` | Projeto atual, compartilhável | `.mcp.json` na raiz do projeto | `.claude/skills/compras-publicas-br/SKILL.md` |
| `user` | Todos os projetos do usuário | `~/.claude.json` | `~/.claude/skills/compras-publicas-br/SKILL.md` |

O Claude Code também possui o escopo nativo `local`, privado para um único
projeto e armazenado em `~/.claude.json`. O instalador deste projeto usa apenas
`project` e `user`; não confunda `project` com o escopo nativo `local`.

## Registro manual e reconhecimento

O instalador usa a mesma entrada `stdio` e fixa a versão no comando `uvx`:

```text
uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
```

Para registrar diretamente com a CLI oficial no projeto:

```bash
claude mcp add --transport stdio --scope project compras-publicas-br -- uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
```

Para registrar globalmente para o usuário:

```bash
claude mcp add --transport stdio --scope user compras-publicas-br -- uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
```

O separador `--` é obrigatório: tudo depois dele é o comando do servidor e
seus argumentos, não opções da CLI do Claude Code.

Esses comandos nativos não adicionam `managedBy`, e isso é esperado para o
adaptador Claude Code. Uma entrada manual com exatamente `command: "uvx"` e os
três argumentos `--from`, `mcp-compras-publicas-br==<versão>` e
`mcp-compras-publicas-br` pode ser reconhecida pelo `update` e `uninstall` do
pacote. Campos extras, inclusive `managedBy`, ou valores divergentes não são
reconhecidos. Para garantir o ciclo de vida gerenciado, prefira
`uvx mcp-compras-publicas-br install --agent claude-code`; esse caminho grava a
forma exata com a versão fixada.

Para remover uma entrada criada manualmente:

```bash
claude mcp remove compras-publicas-br --scope project
claude mcp remove compras-publicas-br --scope user
```

## Configuração MCP

No escopo de projeto, a entrada fica em `.mcp.json` sob `mcpServers`:

```json
{
  "mcpServers": {
    "compras-publicas-br": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-compras-publicas-br==<versão>",
        "mcp-compras-publicas-br"
      ]
    }
  }
}
```

No escopo `user`, o Claude Code mantém a configuração em `~/.claude.json`.
Para a instalação gerenciada, prefira o instalador para atualizar ou remover o
arquivo, pois o formato global também pode conter configurações específicas por
projeto.

## Skill gerenciada

A skill é instalada como:

- Projeto: `.claude/skills/compras-publicas-br/SKILL.md`
- Usuário: `~/.claude/skills/compras-publicas-br/SKILL.md`

Ela contém instruções em português do Brasil para usar o servidor somente para
leitura. O instalador atualiza ou remove a skill apenas quando ela contém o
marcador de gerenciamento do pacote; uma skill existente sem esse marcador é
preservada.

## Verificar

> **Atenção:** `claude mcp list` e `claude mcp get` inspecionam
> configuração/status, mas versões atuais podem iniciar servidores locais
> `stdio` configurados para health checks. Execute-os somente em diretórios e
> configurações confiáveis.

Liste os servidores configurados e o estado de conexão:

```bash
claude mcp list
```

Para consultar apenas esta entrada:

```bash
claude mcp get compras-publicas-br
```

Uma entrada de projeto pode aparecer como pendente até ser aprovada em uma
sessão confiável do projeto. Dentro do Claude Code, `/mcp` também mostra o
estado e as ferramentas disponíveis.

## Documentação oficial

- [MCP no Claude Code](https://code.claude.com/docs/en/mcp)
- [Skills no Claude Code](https://code.claude.com/docs/en/skills)
- [Referência da CLI](https://code.claude.com/docs/en/cli-reference)
