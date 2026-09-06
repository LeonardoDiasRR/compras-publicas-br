# Pi

Integração com o [Pi](https://pi.dev/), o harness de código executado no
terminal.

## Limite de suporte MCP

O Pi não possui suporte MCP nativo. A documentação oficial declara
explicitamente **No MCP**: não há formato oficial `mcpServers`, comando
`pi mcp` ou registro nativo de servidor MCP via `stdio`.

Para expor ferramentas ao Pi, a integração oficial é uma extensão TypeScript
que registra ferramentas com `pi.registerTool()`. A extensão pode implementar
o acesso necessário, mas a documentação do Pi não define uma ponte MCP para
este servidor Python.

Neste pacote, o adaptador `pi` é uma limitação documentada e um fallback de
arquivos para o ciclo de vida do instalador. Ele não garante registro MCP
nativo, disponibilidade de ferramentas ou conexão do Pi com este servidor.

## Escopos e caminhos

O Pi usa JSON e aplica as configurações de projeto sobre as globais.

| Recurso | Usuário | Projeto |
| --- | --- | --- |
| Configurações | `~/.pi/agent/settings.json` | `.pi/settings.json` |
| Extensões | `~/.pi/agent/extensions/*.ts` | `.pi/extensions/*.ts` |
| Skills | `~/.pi/agent/skills/` | `.pi/skills/` |
| Skills compartilhadas | `~/.agents/skills/` | `.agents/skills/` em `cwd` e ancestrais |
| Pacotes npm | `~/.pi/agent/npm/` | `.pi/npm/` |

Extensões em diretórios podem usar `index.ts`. Recursos de projeto só são
carregados depois que o diretório é confiado pelo Pi.

## Extensões

Uma extensão é um módulo TypeScript que exporta uma factory default e recebe
`ExtensionAPI`:

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "compras_publicas_br",
    label: "Compras Públicas Brasil",
    description: "Consulta dados públicos de compras brasileiras.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: "resultado" }], details: {} };
    },
  });
}
```

O caminho `-e`/`--extension` é apropriado para teste temporário:

```bash
pi -e ./extensions/compras-publicas-br.ts
```

Para carregamento automático, use os diretórios de extensão listados acima.
Extensões executam com as permissões do usuário; revise o código antes de
carregá-las.

## Skills

O Pi segue o [Agent Skills standard](https://agentskills.io/specification).
Uma skill nativa é um diretório contendo `SKILL.md` com frontmatter YAML
obrigatório:

```text
compras-publicas-br/
└── SKILL.md
```

```markdown
---
name: compras-publicas-br
description: Consulta dados públicos de compras brasileiras. Use ao pesquisar compras, contratos ou fornecedores oficiais.
---

# Compras Públicas Brasil

Use somente fontes oficiais e preserve a proveniência dos resultados.
```

`name` deve ter de 1 a 64 caracteres, usando letras minúsculas, números e
hífens. `description` é obrigatória e pode ter até 1024 caracteres. O Pi
descobre `SKILL.md` recursivamente nos diretórios de skills; skills de projeto
exigem confiança do projeto.

O template gerenciado atual deste projeto contém apenas o marcador
`managed-by` e não contém o frontmatter `name`/`description` exigido pelo Pi.
Assim, ele não deve ser tratado como uma skill Pi carregável até ser adaptado.

## Pacotes Pi

Para distribuir uma extensão ou skill como pacote Pi, o formato oficial é um
`package.json` com a chave `pi`:

```json
{
  "name": "compras-publicas-br-pi",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  }
}
```

O Pi também descobre os diretórios convencionais `extensions/`, `skills/`,
`prompts/` e `themes/`. Pacotes são instalados com `pi install`; por padrão,
a alteração é global, e `pi install -l` grava em `.pi/settings.json`.

## Ciclo de vida

Comandos nativos do gerenciador de pacotes Pi:

```bash
pi install npm:<pacote>@<versão>
pi install -l npm:<pacote>@<versão>
pi list
pi update --extensions
pi remove npm:<pacote>
```

Comandos do instalador deste projeto, quando usados para manter os arquivos
gerenciados, são:

```bash
uvx mcp-compras-publicas-br install --agent pi
uvx mcp-compras-publicas-br install --agent pi --scope user
uvx mcp-compras-publicas-br update --agent pi
uvx mcp-compras-publicas-br update --agent pi --scope user
uvx mcp-compras-publicas-br uninstall --agent pi
uvx mcp-compras-publicas-br uninstall --agent pi --scope user
```

Esses comandos não transformam o servidor MCP em uma ferramenta Pi: o
adaptador é somente um fallback documentado para manter artefatos nos caminhos
dele. Não há garantia de registro MCP nativo ou de disponibilidade das
ferramentas. Eles também não substituem `pi install` para instalar um pacote
Pi.

## Comando `uvx` fixado

Para clientes que suportam MCP, o servidor deve ser executado com a versão
fixada:

```bash
uvx --from mcp-compras-publicas-br==0.1.0 mcp-compras-publicas-br
```

Esse comando não é uma configuração suportada pelo Pi e não deve ser usado
como prova de que o Pi carregou as ferramentas.

## Verificação

### 1. Verificar o fallback do adaptador

O fallback do adaptador é verificado inspecionando os arquivos que o comando
reportar como `config_path` e `skill_path`. Em escopo de projeto, os caminhos
esperados são:

```text
.pi/settings.json
.pi/skills/compras-publicas-br/SKILL.md
```

Em escopo de usuário, são:

```text
~/.pi/agent/settings.json
~/.pi/agent/skills/compras-publicas-br/SKILL.md
```

Confirme que o JSON continua válido, que a entrada gerenciada e o comando
fixado estão presentes quando escritos, e que o marcador da skill pertence ao
pacote. Essa inspeção prova somente que o instalador gravou artefatos; não
prova registro MCP, conexão com o Pi ou disponibilidade de ferramentas.

Verifique também o estado do gerenciador de pacotes Pi:

```bash
pi list
pi config
pi config -l
```

### 2. Verificar recursos suportados pelo Pi

Depois de adaptar a skill para incluir o frontmatter `name`/`description`
exigido pelo Pi, inicie uma instância confiável explicitando o arquivo:

```bash
pi --verbose --approve \
  --skill .pi/skills/compras-publicas-br/SKILL.md
```

O cabeçalho de inicialização deve mostrar a skill carregada. Em uma sessão
interativa, use `/skill:compras-publicas-br` para invocá-la. Após alterar uma
skill ou extensão descoberta automaticamente, use `/reload`; o comando
recarrega extensões, skills, prompts, temas e arquivos de contexto.

Para uma extensão, use o carregamento explícito documentado:

```bash
pi --verbose --approve --extension ./extensions/compras-publicas-br.ts
```

Use o caminho de uma extensão Pi adaptada; este repositório não fornece uma
extensão TypeScript nativa.

Uma ferramenta registrada por uma extensão é chamada pelo modelo, não por um
comando MCP. Para testar uma ferramenta cujo nome registrado seja
`compras_publicas_br`, envie uma solicitação explícita:

```bash
pi --verbose --approve --extension ./extensions/compras-publicas-br.ts \
  "Use a ferramenta compras_publicas_br para uma consulta somente leitura de teste."
```

Confirme no transcript a chamada e o resultado da ferramenta. Para restringir
o teste à ferramenta registrada, use a allowlist oficial:

```bash
pi --verbose --approve --extension ./extensions/compras-publicas-br.ts \
  --tools compras_publicas_br \
  "Use a ferramenta compras_publicas_br para uma consulta somente leitura de teste."
```

### 3. Verificação por API da extensão

Dentro da factory de uma extensão carregada, as APIs oficiais permitem
inspecionar as ferramentas da sessão:

```ts
const active = pi.getActiveTools();
const all = pi.getAllTools();
console.log({ active, all: all.map((tool) => tool.name) });
```

`getActiveTools()` mostra as ferramentas ativas na sessão e `getAllTools()`
mostra todas as ferramentas configuradas, incluindo `sourceInfo`. Não há um
comando oficial `pi mcp list`; portanto, não reporte uma conexão MCP do Pi a
partir apenas da presença de arquivos, do carregamento de uma skill ou da
execução do `uvx`.

Essas APIs verificam somente ferramentas registradas por Pi, SDK ou extensões
na sessão atual. Elas não verificam o fallback do adaptador nem transformam a
entrada gerada em registro MCP nativo.

## Docker

Esta integração não exige Docker. O Pi é executado diretamente no terminal;
o comando `uvx` abaixo também é uma execução direta para clientes que possuem
suporte MCP, não uma configuração MCP do Pi.

## Documentação oficial

- [Pi Documentation](https://pi.dev/docs/latest)
- [Settings](https://pi.dev/docs/latest/settings)
- [Extensions](https://pi.dev/docs/latest/extensions)
- [Skills](https://pi.dev/docs/latest/skills)
- [Pi Packages](https://pi.dev/docs/latest/packages)
