# Cursor

ID do instalador: `cursor`.

O plugin registra o servidor MCP somente leitura localmente, usando `stdio`, e
instala uma skill gerenciada em português do Brasil. A instalação não cria uma
API pública e não usa Docker.

## Ciclo de vida

O escopo padrão é `project`. A partir da raiz do repositório:

```bash
npx -y mcp-compras-publicas-br@0.1.0 plugin install --agent cursor
npx -y mcp-compras-publicas-br@0.1.0 plugin update --agent cursor
npx -y mcp-compras-publicas-br@0.1.0 plugin uninstall --agent cursor
```

Para a configuração global do usuário, acrescente `--scope user`:

```bash
npx -y mcp-compras-publicas-br@0.1.0 plugin install --agent cursor --scope user
npx -y mcp-compras-publicas-br@0.1.0 plugin update --agent cursor --scope user
npx -y mcp-compras-publicas-br@0.1.0 plugin uninstall --agent cursor --scope user
```

`install` faz merge apenas da entrada `compras-publicas-br`, preservando outros
servidores e campos. `update` busca a versão estável mais recente e atualiza a
entrada e a skill gerenciada. `uninstall` remove somente o que o pacote
reconhece como gerenciado; uma entrada ou skill personalizada é preservada.

## Escopos e arquivos

| Escopo | Configuração MCP | Skill gerenciada |
| --- | --- | --- |
| `project` | `.cursor/mcp.json` | `.cursor/skills/compras-publicas-br/SKILL.md` |
| `user` | `~/.cursor/mcp.json` | `~/.cursor/skills/compras-publicas-br/SKILL.md` |

No Windows, `~` é o diretório do usuário, normalmente `%USERPROFILE%`. No
macOS e Linux, use o diretório inicial indicado por `~`. A configuração global
fica disponível em todos os projetos; a de projeto é específica ao repositório.

## Entrada `stdio`

O registro usa `command` e `args` para que o Cursor inicie o processo local.
O pacote fixa a versão registrada, em vez de usar `latest`:

```json
{
  "mcpServers": {
    "compras-publicas-br": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mcp-compras-publicas-br@0.1.0"
      ]
    }
  }
}
```

O adaptador atual gera exatamente `type: "stdio"`, `command: "npx"` e os
`args` com a versão fixada. A entrada não inclui metadados `managedBy`.
Substitua `0.1.0` pela versão efetivamente instalada quando editar o arquivo
manualmente. O comando equivalente é:

```text
npx -y mcp-compras-publicas-br@<versão>
```

Não coloque credenciais nesse registro. Este servidor consulta somente as
fontes públicas oficiais e mantém as operações upstream em modo somente
leitura.

## Rules e skills

As regras são instruções do agente, separadas do registro MCP:

- Projeto: `.cursor/rules/*.mdc`, com frontmatter. Use `globs` para aplicar uma
  regra a padrões de arquivos; `description` e `alwaysApply` controlam outros
  modos de aplicação.
- Projeto simples: `AGENTS.md` na raiz ou em subdiretórios.
- Usuário: **Customize > Rules** no Cursor.

O Cursor também descobre skills no padrão `SKILL.md`. O instalador usa o
diretório nativo do Cursor:

- Projeto: `.cursor/skills/<nome>/SKILL.md`.
- Usuário: `~/.cursor/skills/<nome>/SKILL.md`.

Na convenção nativa de skills, use o campo `paths` do frontmatter YAML para
limitar a skill a padrões de arquivos. A skill gerenciada por este pacote é
uma exceção deliberada: começa pelo marcador HTML de gerenciamento e não
contém frontmatter YAML com os campos obrigatórios `name` e `description`.
Portanto, a descoberta nativa do Cursor não é garantida: o arquivo pode não
aparecer em **Customize > Skills** nem ser invocado automaticamente. Ela deve
ser tratada como o arquivo gerenciado pelo adaptador, não como exemplo de uma
skill nativa com `paths`.

A skill deste plugin é criada em
`.cursor/skills/compras-publicas-br/SKILL.md` ou
`~/.cursor/skills/compras-publicas-br/SKILL.md`, conforme o escopo. Ela contém
um marcador de gerenciamento; somente arquivos com esse marcador podem ser
atualizados ou removidos pelo instalador.

## Verificação do MCP

No aplicativo Cursor, abra **Customize** na barra lateral e confira
`compras-publicas-br` na seção de MCP. O servidor deve aparecer como local
`stdio`; use o toggle para habilitá-lo ou desabilitá-lo. Para diagnosticar uma
falha, abra **Output** (`Cmd+Shift+U`, ou o equivalente no Windows/Linux) e
selecione **MCP Logs**.

Se o Cursor CLI estiver instalado, verifique a mesma configuração pelo
terminal:

```bash
agent --version
agent mcp list
agent mcp list-tools compras-publicas-br
```

`agent mcp list` mostra status, origem (`project` ou global) e transporte.
`agent mcp list-tools` confirma que as ferramentas do servidor foram
descobertas. Para uma sessão que ainda não aprovou o servidor, use:

```bash
agent mcp enable compras-publicas-br
```

O CLI usa a mesma configuração `mcp.json` do editor.

## Verificação da skill

Confira separadamente **Customize > Skills** e procure
`compras-publicas-br`. Essa tela verifica a descoberta nativa da skill; os
comandos `agent mcp list` e `agent mcp list-tools` verificam somente o servidor
MCP e suas ferramentas, não a skill. Não há um comando equivalente de listagem
de skills documentado para o Cursor CLI. Se a skill não aparecer, o arquivo
continua disponível no caminho documentado e pode ser lido como instrução
gerenciada, mas não deve ser considerado uma skill nativa ativa.

## Documentação oficial

- [MCP no Cursor](https://cursor.com/docs/mcp)
- [MCP no Cursor CLI](https://cursor.com/docs/cli/mcp)
- [Rules](https://cursor.com/docs/context/rules)
- [Agent Skills](https://cursor.com/docs/context/skills)
