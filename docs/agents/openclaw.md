# OpenClaw

- **Agent ID:** `openclaw`
- **Transporte:** `stdio`
- **Servidor:** `compras-publicas-br`

O OpenClaw atua como cliente MCP: inicia o processo local e expõe as tools aos
agentes elegíveis. As definições ficam em `mcp.servers` na configuração JSON5.
O servidor roda localmente via `stdio`; não requer nem usa Docker.

## Ciclo de vida do projeto

Use o escopo explicitamente e execute o instalador no projeto desejado:

```bash
npx -y mcp-compras-publicas-br@<versão> plugin install --agent openclaw --scope project
npx -y mcp-compras-publicas-br@<versão> plugin update --agent openclaw --scope project
npx -y mcp-compras-publicas-br@<versão> plugin uninstall --agent openclaw --scope project
```

Os exemplos que usam `$PWD` pressupõem que o shell está na raiz do projeto
resolvida pelo instalador. Se o comando for executado a partir de um
subdiretório, mude para essa raiz ou use o caminho absoluto para
`.openclaw/openclaw.json`.

Depois, o Gateway precisa usar o arquivo do projeto e o workspace do projeto;
caso contrário, o OpenClaw continuará usando a configuração global padrão e
não verá esse registro:

```bash
OPENCLAW_CONFIG_PATH="$PWD/.openclaw/openclaw.json" openclaw mcp list
```

No Windows PowerShell:

```powershell
$env:OPENCLAW_CONFIG_PATH = "$PWD/.openclaw/openclaw.json"
openclaw mcp list
```

O serviço Gateway também deve ter esse mesmo `OPENCLAW_CONFIG_PATH` e um
workspace configurado para a raiz do projeto. Reiniciar um Gateway que foi
iniciado com a configuração global não ativa o escopo do projeto.

O instalador preserva os demais servidores e adiciona somente a entrada
gerenciada `compras-publicas-br`. O registro sempre usa uma versão exata:

```text
npx -y mcp-compras-publicas-br@<versão>
```

## Ciclo de vida do usuário

O escopo de usuário é global para os projetos desse usuário. Use `--scope user`
em todas as operações do instalador:

```bash
npx -y mcp-compras-publicas-br@<versão> plugin install --agent openclaw --scope user
npx -y mcp-compras-publicas-br@<versão> plugin update --agent openclaw --scope user
npx -y mcp-compras-publicas-br@<versão> plugin uninstall --agent openclaw --scope user
```

## Escopos e arquivos

| Escopo do instalador | Configuração | Skill gerenciada |
| --- | --- | --- |
| `project` | `<raiz-do-projeto>/.openclaw/openclaw.json` | `<raiz-do-projeto>/skills/mcp-compras-publicas-br/SKILL.md` |
| `user` | `~/.openclaw/openclaw.json` | `~/.openclaw/skills/mcp-compras-publicas-br/SKILL.md` |

O escopo nativo documentado pelo OpenClaw é a configuração ativa do Gateway,
normalmente `~/.openclaw/openclaw.json`. O CLI `openclaw mcp` não possui uma
opção nativa `--scope project`. Portanto, o escopo `project` deste pacote é um
arquivo local separado e precisa ser selecionado explicitamente pelo
`OPENCLAW_CONFIG_PATH` e pelo Gateway.

```bash
OPENCLAW_CONFIG_PATH="$PWD/.openclaw/openclaw.json" openclaw mcp list
```

Para uma configuração de agente único, configure `agents.defaults.workspace`
para a raiz do projeto. Em uma configuração multiagente,
`agents.entries.<id>.workspace` específico do agente tem precedência; o agente
que executará este MCP precisa apontar para a raiz do projeto. A skill global
fica em `<state-dir>/skills`; no perfil padrão, isso corresponde a
`~/.openclaw/skills`.

## Registro manual

O adaptador atual sempre usa o fallback de edição segura do arquivo de
configuração documentado para o escopo escolhido. Ele não invoca
`openclaw mcp add`, `openclaw mcp unset` nem outra CLI nativa para instalar,
atualizar ou remover a entrada, e não delega metadados de registro à CLI nativa.

Para um projeto concreto, a configuração e a verificação podem ser feitas no
arquivo `<raiz-do-projeto>/.openclaw/openclaw.json` assim:

```bash
export OPENCLAW_CONFIG_PATH="$PWD/.openclaw/openclaw.json"
openclaw mcp add compras-publicas-br --command npx --arg=-y --arg=mcp-compras-publicas-br@0.1.0
openclaw mcp doctor compras-publicas-br --probe
```

Esse é um fluxo manual da CLI oficial. Para uma instalação gerenciada, use o
instalador, que escreve o mesmo formato no arquivo por edição direta.

O equivalente direto em JSON5 é:

```json5
{
  agents: {
    defaults: {
      // Obrigatório para descobrir a skill em <raiz-do-projeto>/skills.
      workspace: "/absolute/path/to/project",
    },
  },
  mcp: {
    servers: {
      "compras-publicas-br": {
        command: "npx",
        args: ["-y", "mcp-compras-publicas-br@<versão>"],
      },
    },
  },
}
```

Em `stdio`, `command` é o executável, `args` são seus argumentos e a
comunicação MCP usa stdin/stdout. Não redirecione logs para stdout do servidor.

`update` fixa a versão estável mais recente publicada no npm
(`dist-tags.latest` do registro). `uninstall`
remove somente a entrada e a skill reconhecidas como gerenciadas pelo pacote.
Para remover manualmente uma entrada criada pela CLI oficial, o comando atual é
`unset`, não `remove`:

```bash
openclaw mcp unset compras-publicas-br
```

Esse comando é o equivalente manual/nativo; não é uma ação automática do
instalador. O instalador continua usando sempre a edição segura do arquivo
ativo e remove somente a entrada correspondente em `mcp.servers`, preservando
as demais.

## Verificar e operar

Para um projeto, mantenha `OPENCLAW_CONFIG_PATH` apontando para
`.openclaw/openclaw.json` e use um Gateway iniciado com esse mesmo ambiente
durante toda a verificação. Sem essa variável, os comandos usam a configuração
ativa padrão, normalmente global. Verifique a configuração e depois faça uma
conexão real com o processo:

```bash
openclaw mcp list
openclaw mcp show compras-publicas-br --json
openclaw mcp status --verbose
openclaw mcp doctor compras-publicas-br --probe
openclaw mcp probe compras-publicas-br --json
```

`doctor` sem `--probe` faz apenas verificações estáticas. `--probe` inicia o
servidor e confirma tools e capacidades MCP. `status` não conecta ao servidor.

Depois de alterar a configuração, `mcp.*` normalmente é aplicado pelo Gateway
sem reinício. `openclaw mcp reload` atualiza runtimes pertencentes ao processo
CLI atual; se o Gateway estiver em outro processo, publique a configuração ou
reinicie-o:

```bash
openclaw mcp reload
openclaw gateway restart
```

Comandos de ciclo de vida do serviço Gateway:

```bash
openclaw gateway status
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
```

## Skill

O OpenClaw descobre skills por arquivos `SKILL.md`. A precedência oficial
coloca `workspace/skills` acima de skills gerenciadas. As alterações de uma
skill passam a valer em uma nova sessão; skills baseadas em arquivo também
podem ser atualizadas pelo watcher.

A skill gerenciada é marker-first: sua primeira linha é
`<!-- managed-by: mcp-compras-publicas-br; format: 1 -->`. Esse marcador é
metadado de propriedade do instalador, não frontmatter. O adaptador apenas
escreve o arquivo; não invoca `openclaw skills install` nem outro mecanismo
nativo de descoberta. O arquivo gerado não contém o frontmatter obrigatório
`name` e `description`; portanto, não é nativamente válido nem
descobrível pelo OpenClaw. `openclaw skills list`, `info` e `check` não são
validações bem-sucedidas dessa skill. A única verificação em nível de pacote é
inspecionar o arquivo e confirmar seu caminho e sua primeira linha; isso
confirma que o arquivo existe, mas não cria validade ou descoberta nativa. Sem
`agents.defaults.workspace` ou `agents.entries.<id>.workspace` apontando para a
raiz do projeto, o arquivo em `skills/` permanece fora do workspace e não é
descoberto.

O instalador cria:

```text
project: <raiz-do-projeto>/skills/mcp-compras-publicas-br/SKILL.md
user:    ~/.openclaw/skills/mcp-compras-publicas-br/SKILL.md
```

Para consultar o diagnóstico nativo, sem tratar o resultado como validação da
skill marker-only:

```bash
openclaw skills list
openclaw skills info mcp-compras-publicas-br
openclaw skills check
```

Para inspecionar o arquivo gerenciado sem confundir isso com validação nativa:

```bash
head -n 2 skills/mcp-compras-publicas-br/SKILL.md
```

No Windows PowerShell:

```powershell
Get-Content .\skills\mcp-compras-publicas-br\SKILL.md -TotalCount 2
```

## Documentação oficial

- [Conectar servidores MCP](https://docs.openclaw.ai/tools/mcp)
- [Referência da CLI MCP](https://docs.openclaw.ai/cli/mcp)
- [Skills](https://docs.openclaw.ai/tools/skills)
- [Configuração do Gateway](https://docs.openclaw.ai/gateway/configuration)
- [Referência de configuração](https://docs.openclaw.ai/gateway/configuration-reference)
