# OpenCode

O adaptador `opencode` usa um fallback de edição de arquivo e instala uma skill
gerenciada em português do Brasil. Ele não usa uma integração nativa do CLI do
OpenCode.

## Ciclo de vida

No diretório do projeto, o escopo padrão é `project`:

```bash
uvx mcp-compras-publicas-br install --agent opencode
uvx mcp-compras-publicas-br update --agent opencode
uvx mcp-compras-publicas-br uninstall --agent opencode
```

Para a configuração global do usuário, informe `--scope user`:

```bash
uvx mcp-compras-publicas-br install --agent opencode --scope user
uvx mcp-compras-publicas-br update --agent opencode --scope user
uvx mcp-compras-publicas-br uninstall --agent opencode --scope user
```

`update` mantém a configuração não relacionada, atualiza a skill gerenciada e
troca somente a versão fixada. `uninstall` remove apenas a entrada nativa com o
pin reconhecido e a skill com o marcador de gerenciamento. Conflitos e skills
sem esse marcador são preservados.

## Escopos e caminhos

| Escopo | Configuração MCP | Skill |
| --- | --- | --- |
| `project` | `<raiz-Git>/opencode.json` | `<raiz-Git>/.opencode/skills/mcp-compras-publicas-br/SKILL.md` |
| `user` | `~/.config/opencode/opencode.json` | `~/.config/opencode/skills/mcp-compras-publicas-br/SKILL.md` |

No escopo `project`, o instalador procura a raiz Git subindo a partir do
diretório atual. Sem Git, usa o diretório atual e emite um aviso. No escopo
`user`, `~` é o diretório inicial do usuário; no Windows, o caminho equivalente
é `%USERPROFILE%\.config\opencode\`.

O OpenCode aceita `opencode.json` e `opencode.jsonc`, mas este adaptador edita
somente o caminho documentado `opencode.json`. Se a configuração ativa estiver
em outro arquivo, inclusive por `OPENCODE_CONFIG`, ajuste-a manualmente ou
execute a instalação no caminho canônico antes de usar o agente. A variável
`OPENCODE_CONFIG_DIR` altera a descoberta de diretórios de recursos do OpenCode,
mas não muda o caminho que o adaptador escreve.

## Formato MCP nativo

O adaptador usa um fallback de edição de arquivo, mas a entrada que ele grava
segue o formato nativo documentado pelo OpenCode para um servidor local:

```json
{
  "mcp": {
    "compras-publicas-br": {
      "type": "local",
      "command": [
        "uvx",
        "--from",
        "mcp-compras-publicas-br==<versão>",
        "mcp-compras-publicas-br"
      ]
    }
  }
}
```

O instalador faz merge somente da entrada `compras-publicas-br` dentro de
`mcp`, preservando as demais configurações.

A posse da entrada é reconhecida por forma exata: ela precisa ter somente as
chaves `type` e `command`; `type` precisa ser `local`; e `command` precisa ser
exatamente `['uvx', '--from', 'mcp-compras-publicas-br==<versão>',
'mcp-compras-publicas-br']`. Campos nativos adicionais, como `enabled`, `cwd`,
`environment` ou `timeout`, podem ser aceitos pelo OpenCode, mas fazem a
entrada deixar de ser reconhecível pelo pacote. Nesse caso, `update` e
`uninstall` não a alteram nem removem.

A forma equivalente no shell é sempre:

```text
uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
```

`<versão>` é a versão exata registrada no momento da instalação ou atualização;
não use `uvx mcp-compras-publicas-br` sem o pin no arquivo MCP. O adaptador
preserva as demais chaves do JSON e reconhece sua entrada pelo tipo local e pelo
comando `uvx` com o pin do pacote durante `update` e `uninstall`.

## Skills e regras

O OpenCode procura skills em uma pasta por skill, com um arquivo `SKILL.md`:

- Projeto: `.opencode/skills/<nome>/SKILL.md`
- Usuário: `~/.config/opencode/skills/<nome>/SKILL.md`
- Compatibilidade de projeto: `.claude/skills/<nome>/SKILL.md` e `.agents/skills/<nome>/SKILL.md`
- Compatibilidade global: `~/.claude/skills/<nome>/SKILL.md` e `~/.agents/skills/<nome>/SKILL.md`

A skill instalada por este pacote é:

```text
.opencode/skills/mcp-compras-publicas-br/SKILL.md
```

Ela começa com o marcador de gerenciamento:

```text
<!-- managed-by: mcp-compras-publicas-br; format: 1 -->
```

Esse marcador serve apenas para o pacote reconhecer a skill com segurança; ele
não é um mecanismo nativo de descoberta do OpenCode. A skill gerada não inclui
o frontmatter YAML exigido pelo OpenCode, com `name` e `description`; por isso,
ela não é nativamente discoverable pelo OpenCode. A descoberta marker-first não
é suportada nem garantida, e este adaptador não promete um workaround manual.

Regras de projeto são procuradas subindo do diretório de trabalho até a raiz do
worktree Git. Em cada nível, `AGENTS.md` tem precedência sobre `CLAUDE.md`.
Depois vêm `~/.config/opencode/AGENTS.md` e, como fallback de compatibilidade,
`~/.claude/CLAUDE.md`. A primeira regra encontrada em cada categoria vence.
Arquivos adicionais podem ser combinados com caminhos e glob patterns na chave
`instructions` de `opencode.json`.

## Precedência da configuração

Os arquivos são mesclados, não substituídos. A precedência efetiva, da menor
para a maior, é:

1. Configuração remota `.well-known/opencode`.
2. Configuração global `~/.config/opencode/opencode.json`.
3. Arquivo indicado por `OPENCODE_CONFIG`.
4. Configuração do projeto `opencode.json` na raiz Git.
5. Recursos nos diretórios `.opencode/`.
6. Diretório indicado por `OPENCODE_CONFIG_DIR`.
7. `OPENCODE_CONFIG_CONTENT`.
8. Arquivos gerenciados: macOS `/Library/Application Support/opencode/`, Linux
   `/etc/opencode/` e Windows `%ProgramData%\opencode`.
9. Preferências gerenciadas do macOS via MDM, com prioridade máxima:
   `/Library/Managed Preferences/<usuário>/ai.opencode.managed.plist` e
   `/Library/Managed Preferences/ai.opencode.managed.plist`.

Em chaves conflitantes, a fonte posterior vence; chaves não conflitantes são
preservadas. Por isso, uma configuração de projeto normalmente sobrescreve a
global, mas um arquivo gerenciado pela organização pode sobrescrever ambas.
`OPENCODE_CONFIG_DIR` pode sobrescrever recursos de `.opencode/`; preferências
gerenciadas do macOS não podem ser sobrescritas pelo usuário ou pelo projeto.

## CLI nativo e adaptador

Para adicionar e listar MCPs, a documentação oficial atual oferece estes
comandos:

```bash
opencode mcp add
opencode mcp list
```

O `add` é interativo e `list` lista o estado da conexão. A documentação oficial
consultada não define um fluxo nativo `opencode mcp update` ou
`opencode mcp remove`. Portanto, os comandos `update` e `uninstall` acima são
do pacote e operam somente no fallback gerenciado por arquivo; não são aliases
de comandos nativos do OpenCode.

Para instalações determinísticas e idempotentes, o adaptador edita somente o
`opencode.json` do escopo resolvido e o diretório de skill correspondente. Ele
não edita arquivos fora desses destinos nem executa comandos lidos da
configuração.

## Verificação

Depois da instalação, no mesmo diretório e escopo configurados, liste os MCPs:

```bash
opencode mcp list
```

Use esse comando para verificar se o OpenCode aceitou a configuração nativa e
expôs o servidor. Também é possível inspecionar a configuração efetiva sem
iniciar uma sessão:

```bash
opencode debug config
```

Na TUI, reinicie o OpenCode depois de alterar a configuração e confirme que as
ferramentas do servidor aparecem na lista de ferramentas ou nos detalhes da
execução. Se o servidor não conectar, verifique primeiro o arquivo carregado,
o pin da versão e os logs do OpenCode.

## Documentação oficial

- [Configuração](https://opencode.ai/docs/config/)
- [MCP servers](https://opencode.ai/docs/mcp-servers/)
- [Agent Skills](https://opencode.ai/docs/skills/)
- [Rules](https://opencode.ai/docs/rules/)
- [CLI](https://opencode.ai/docs/cli/)
