# Hermes Agent

Integração do MCP Compras Públicas Brasil com o [Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).

## Ciclo de vida

O instalador aceita dois escopos:

- `project`: grava no diretório raiz do projeto Git atual (ou no diretório atual se não houver Git).
- `user`: grava no diretório pessoal do usuário (`~`).

Use uma versão estável fixada no comando. O exemplo abaixo usa a versão publicada no projeto:

```bash
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br install --agent hermes-agent --scope project
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br update --agent hermes-agent --scope project
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br uninstall --agent hermes-agent --scope project
```

Para a configuração pessoal, use `--scope user` em todo o ciclo de vida:

```bash
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br install --agent hermes-agent --scope user
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br update --agent hermes-agent --scope user
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br uninstall --agent hermes-agent --scope user
```

`install` instala ou corrige a entrada gerenciada e a skill; `update` atualiza o pin da versão e a skill; `uninstall` remove somente a entrada e a skill gerenciadas pelo pacote.

## Formato oficial do Hermes

O Hermes documenta MCP em `~/.hermes/config.yaml`, sob `mcp_servers`. Para um servidor local via stdio, o formato oficial usa `command` e `args`:

```yaml
mcp_servers:
  compras-publicas-br:
    command: uvx
    args:
      - --from
      - mcp-compras-publicas-br==0.1.0
      - mcp-compras-publicas-br
```

As skills são diretórios que contêm um arquivo `SKILL.md`. O caminho padrão de skills instaladas pelo Hermes é `~/.hermes/skills/<nome-da-skill>/SKILL.md`. O formato documentado para `SKILL.md` começa com front matter YAML, por exemplo:

```markdown
---
name: compras-publicas-br
description: Consulta somente leitura de compras públicas brasileiras
---
# Compras Públicas Brasil
```

O Hermes também oferece comandos nativos para MCP, incluindo `hermes mcp add`, `hermes mcp remove`, `hermes mcp list` e `hermes mcp test <nome>`.

## Caminhos usados pelo adaptador

O adaptador deste projeto mantém os caminhos abaixo:

| Escopo | Configuração MCP | Skill |
| --- | --- | --- |
| `project` | `<raiz-do-projeto>/.hermes/config.json5` | `<raiz-do-projeto>/.hermes/skills/mcp-compras-publicas-br/SKILL.md` |
| `user` | `~/.hermes/config.json5` | `~/.hermes/skills/mcp-compras-publicas-br/SKILL.md` |

A entrada é `mcp_servers.compras-publicas-br` e contém o comando stdio com pin exato:

```json5
{
  mcp_servers: {
    "compras-publicas-br": {
      command: "uvx",
      args: ["--from", "mcp-compras-publicas-br==0.1.0", "mcp-compras-publicas-br"],
      managedBy: {package: "mcp-compras-publicas-br", schemaVersion: 1},
    },
  },
}
```

O adaptador não chama `hermes mcp add` nem `hermes mcp remove`: como não há comandos nativos configurados para esse adaptador, ele lê, mescla e grava diretamente o arquivo de configuração e grava o `SKILL.md`. A skill gerenciada pelo pacote contém as instruções de consulta e um marcador de gestão; ela não é instalada pelo catálogo do Hermes nem recebe automaticamente o front matter mostrado acima. Entradas ou skills não gerenciadas são preservadas.

## Limitação de compatibilidade

> **Importante:** o Hermes atual lê oficialmente `~/.hermes/config.yaml`, com `mcp_servers` em YAML. O destino fixo `.hermes/config.json5` deste adaptador é uma limitação de compatibilidade do contrato do plano e não o formato oficial atualmente documentado pelo Hermes.

Por isso, a instalação pelo adaptador pode exigir migração manual: se a versão do Hermes em uso aceitar somente `config.yaml`, copie ou converta a entrada `mcp_servers.compras-publicas-br` para `~/.hermes/config.yaml` antes de validar. Não presuma descoberta nativa do arquivo `.hermes/config.json5` nem renomeie esse caminho silenciosamente no instalador.

`update` e `uninstall` também operam somente no destino JSON5 do adaptador. Eles não atualizam, nem removem, `mcp_servers.compras-publicas-br` de `~/.hermes/config.yaml`; qualquer efeito no YAML exige migração ou edição manual posterior. O adaptador não sincroniza os dois arquivos.

## Validação

Depois da instalação, valide a entrada MCP com os comandos oficiais do Hermes:

```bash
hermes mcp list
hermes mcp test compras-publicas-br
```

Uma skill local pode exigir confiança explícita no repositório. Para o escopo `project`, autorize-o antes do teste:

```bash
hermes skills trust .
```

Uma skill gerenciada apenas pelo marcador `managed-by` não garante descoberta nativa pelo Hermes. Faça uma validação oneshot, sem assumir que o carregamento ocorreu:

```bash
hermes chat --oneshot --toolsets skills -q "Use a skill compras-publicas-br para consultar dados oficiais de compras públicas."
```

Fontes oficiais:

- [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)
- [Creating Skills](https://hermes-agent.nousresearch.com/docs/developer-guide/creating-skills)
- [CLI Commands](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)
