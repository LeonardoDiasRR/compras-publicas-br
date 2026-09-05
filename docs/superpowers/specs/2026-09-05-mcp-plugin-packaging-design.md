# Design: Plugin Multiplataforma para Agentes de Código

**Status:** aprovado para planejamento de implementação
**Data:** 2026-09-05

## Objetivo

Transformar o servidor MCP somente leitura de Compras Públicas Brasil em um
pacote instalável por agentes de código. O pacote será publicado no PyPI e
registrará automaticamente o servidor MCP e uma skill em português do Brasil
no agente escolhido pelo usuário.

O servidor existente continuará sendo executado localmente via `stdio`. A
instalação não criará uma API pública nem exigirá que o agente hospede o
servidor HTTP. O transporte HTTP existente poderá permanecer disponível para
execução direta pelo Python, mas não haverá imagem Docker nem configuração de
container.

## Decisões Confirmadas

- O pacote Python `mcp-compras-publicas-br` será a distribuição oficial.
- `uvx` será o caminho principal de instalação e execução; `pipx` e
  `python -m` serão alternativas documentadas.
- O pacote terá os comandos `install`, `update` e `uninstall`.
- `--agent` será obrigatório.
- Os agentes suportados serão:
  - Claude Code
  - Codex
  - OpenCode
  - DeepSeek Harness
  - Pi
  - Antigravity
  - Cursor
  - Hermes Agent
  - OpenClaw
  - `generic`, representado pelo formato `.agent`
- `--scope` aceitará `project` e `user`.
- Sem `--scope`, o padrão será `project`; nenhuma pergunta será feita para
  escolher o escopo.
- No escopo `project`, o instalador buscará a raiz Git subindo a partir do
  diretório atual. Se não encontrar Git, usará o diretório atual e emitirá um
  aviso.
- No escopo `user`, o instalador usará a configuração global do usuário,
  respeitando os diretórios padrão de cada agente e sistema operacional.
- A entrada MCP registrada usará a versão exata do pacote em execução.
- O comando registrado será equivalente a:

  ```text
  uvx --from mcp-compras-publicas-br==<versão> mcp-compras-publicas-br
  ```

- `update` buscará a versão estável mais recente no PyPI, atualizará o
  registro e a skill, e preservará todas as configurações não relacionadas.
- `uninstall` removerá somente entradas e arquivos reconhecidos como
  gerenciados pelo pacote.
- A atualização será feita por merge da entrada deste projeto, nunca por
  substituição do arquivo inteiro.
- Skills serão escritas em português do Brasil.
- Cada skill será um arquivo próprio com marcador de gerenciamento. Arquivos
  existentes sem esse marcador serão preservados e gerarão um aviso.
- A abordagem de integração será híbrida: CLI nativo quando houver uma
  interface oficial estável; edição direta do arquivo nativo como fallback.
- A conteinerização existente será removida do projeto. `Dockerfile`,
  `docker-compose.yml` e instruções ou workflows dependentes de Docker não
  farão parte do resultado.

## Arquitetura

O servidor MCP atual permanecerá separado do instalador. Um novo núcleo de
plugin será responsável por orquestrar escopo, resolução de versão, leitura e
escrita segura, enquanto cada agente terá um adaptador isolado.

```text
CLI plugin
  -> InstallerService
      -> ScopeResolver
      -> VersionResolver
      -> AgentAdapter
          -> Native CLI ou ConfigFileAdapter
          -> SkillManager
      -> AtomicWriter
```

### Núcleo de instalação

O núcleo deverá:

- validar o identificador do agente antes de qualquer escrita;
- resolver `project` ou `user`;
- resolver a raiz do projeto conforme as regras de Git e fallback;
- obter a versão do pacote em execução;
- localizar a configuração do adaptador;
- executar merge idempotente;
- criar, atualizar ou remover a skill gerenciada;
- escrever atomicamente e validar o resultado;
- produzir mensagens humanas e códigos de saída apropriados.

O núcleo não conhecerá nomes de campos específicos de agentes. Ele trabalhará
com um contrato comum de adaptador.

### Contrato do adaptador

Cada adaptador deverá fornecer:

- identificador estável e nome exibido;
- resolução dos locais `project` e `user` por sistema operacional;
- formato de configuração e serializer correspondente;
- método de registro nativo opcional;
- método de remoção nativo opcional;
- localização da skill no escopo escolhido;
- validação pós-escrita;
- assinatura capaz de reconhecer uma entrada criada pelo pacote.

O adaptador não deverá depender de detecção automática do agente, porque o
usuário sempre informará `--agent`.

## Integração por Agente

Todos os adaptadores registrarão o mesmo servidor local `stdio` e a mesma
versão fixada. As diferenças serão limitadas à configuração e à localização
da skill.

| ID | Agente | Método preferencial | Fallback |
| --- | --- | --- | --- |
| `claude-code` | Claude Code | CLI oficial ou configuração MCP oficial | arquivo nativo |
| `codex` | Codex | CLI/configuração oficial | arquivo TOML nativo |
| `opencode` | OpenCode | configuração oficial | arquivo nativo |
| `deepseek-harness` | DeepSeek Harness | configuração oficial | arquivo nativo |
| `pi` | Pi | configuração oficial | arquivo nativo |
| `antigravity` | Antigravity | configuração oficial | arquivo nativo |
| `cursor` | Cursor | configuração oficial | arquivo nativo |
| `hermes-agent` | Hermes Agent | configuração oficial | arquivo nativo |
| `openclaw` | OpenClaw | CLI oficial ou configuração MCP oficial | arquivo nativo |
| `generic` | Agente genérico | manifesto `.agent` | nenhum |

Os locais e formatos nativos serão mantidos como dados do registro de
adaptadores, com variantes explícitas para Windows, Linux e macOS. O
implementador deverá validá-los contra a documentação oficial de cada agente
e cobri-los com fixtures antes da publicação.

### Formato genérico `.agent`

Para o escopo de projeto, o adaptador genérico criará:

```text
.agent/
  mcp.json
  skills/
    compras-publicas-br.md
```

O `mcp.json` usará uma estrutura compatível com clientes MCP comuns:

```json
{
  "mcpServers": {
    "compras-publicas-br": {
      "command": "uvx",
      "args": [
        "--from",
        "mcp-compras-publicas-br==0.1.0",
        "mcp-compras-publicas-br"
      ],
      "managedBy": {
        "package": "mcp-compras-publicas-br",
        "schemaVersion": 1
      }
    }
  }
}
```

Para o escopo global, o mesmo manifesto será armazenado em `.agent` no
diretório de configuração global do usuário definido pelo sistema
operacional. Campos desconhecidos não serão adicionados aos formatos nativos
dos demais agentes.

## CLI e Ciclo de Vida

### Instalação

```text
uvx mcp-compras-publicas-br install --agent <id>
uvx mcp-compras-publicas-br install --agent <id> --scope user
```

O comando deverá:

1. Validar o agente e o escopo.
2. Resolver a raiz ou configuração de destino.
3. Localizar o arquivo nativo ou manifesto genérico.
4. Ler a configuração existente.
5. Inserir ou atualizar somente a entrada `compras-publicas-br`.
6. Criar a skill específica com o marcador de gerenciamento.
7. Validar e gravar as alterações atomicamente.

### Atualização

```text
uvx mcp-compras-publicas-br update --agent <id>
uvx mcp-compras-publicas-br update --agent <id> --scope user
```

`update` exigirá uma instalação reconhecível no escopo solicitado. Ele
consultará a versão estável mais recente publicada no PyPI, manterá o
comando `uvx` com versão fixada, atualizará a skill gerenciada e não alterará
outras entradas. Se o PyPI não estiver disponível, nenhum arquivo será
modificado.

### Remoção

```text
uvx mcp-compras-publicas-br uninstall --agent <id>
uvx mcp-compras-publicas-br uninstall --agent <id> --scope user
```

`uninstall` removerá a entrada estável `compras-publicas-br` e a skill somente
quando a assinatura ou o marcador confirmarem que pertencem ao pacote. Uma
entrada com o mesmo nome, mas conteúdo não reconhecido, será preservada e
reportada ao usuário.

### Idempotência e escrita

- Reexecutar `install` sem mudança de conteúdo não deverá produzir diferença.
- `update` deverá alterar somente a versão quando a skill não tiver mudado.
- `uninstall` repetido deverá terminar sem erro e informar que nada foi
  removido.
- Escritas deverão ocorrer em arquivo temporário no mesmo diretório, seguidas
  de substituição atômica.
- Permissões existentes deverão ser preservadas quando o sistema permitir.
- Nenhum segredo será incluído em arquivo, log ou argumento gerado.

## Skills Gerenciadas

Cada adaptador instalará uma skill em português do Brasil, com nome estável e
um marcador explícito, por exemplo:

```text
<!-- managed-by: mcp-compras-publicas-br; format: 1 -->
```

O conteúdo deverá orientar o agente sobre:

- quando consultar Compras.gov.br e quando consultar PNCP;
- preferência pelas ferramentas semânticas quando a intenção permitir;
- uso de ferramentas atômicas para filtros específicos;
- caráter estritamente somente leitura;
- paginação e limites de resultados;
- interpretação de envelopes de erro e indisponibilidade upstream;
- preservação da proveniência e dos identificadores oficiais.

O arquivo será próprio do pacote. `update` substituirá somente arquivos com o
marcador reconhecido. Um arquivo com nome semelhante, mas sem marcador, será
preservado e gerará aviso. `uninstall` removerá apenas a skill gerenciada.

## Tratamento de Configurações

O merge deverá preservar entradas não relacionadas, incluindo campos de
configuração que não sejam MCP. O adaptador deverá respeitar o serializer
nativo para evitar produzir uma estrutura inválida.

Quando houver uma entrada `compras-publicas-br` não reconhecida:

- `install` não sobrescreverá;
- `update` não alterará;
- `uninstall` não removerá;
- a saída explicará o conflito e indicará a resolução manual.

Quando o arquivo de configuração estiver inválido ou não puder ser lido, a
operação falhará antes de qualquer alteração parcial.

## Segurança e Falhas

O instalador deverá:

- aceitar somente os IDs de agentes registrados;
- restringir os caminhos ao escopo resolvido e aos diretórios oficiais do
  agente;
- rejeitar caminhos que escapem do destino após normalização;
- não executar comandos arbitrários fornecidos por configuração do usuário;
- usar CLI nativo somente com argumentos construídos pelo adaptador;
- não expor tokens ou conteúdo sensível nos logs;
- não substituir arquivos inteiros por conveniência;
- preservar os arquivos quando a versão remota ou o parser falhar.

Erros de uso, configuração inválida e falhas externas deverão ser distinguíveis
por códigos de saída. Mensagens deverão informar o agente, o escopo, o arquivo
afetado e a ação necessária sem incluir segredos.

## Empacotamento e Publicação

O `pyproject.toml` deverá expor um entry point de console para a CLI. Templates,
skills e metadados de adaptadores deverão ser incluídos no wheel por meio dos
recursos do próprio pacote.

O workflow de publicação deverá:

- construir wheel e source distribution;
- executar a suíte de testes e os gates existentes;
- publicar no PyPI por Trusted Publishing do GitHub Actions;
- validar que o pacote publicado pode ser executado via `uvx`;
- publicar somente versões semânticas explicitamente versionadas.

Não haverá workflow de build, publicação ou execução de imagem Docker.

## Remoção da Conteinerização

A implementação deverá remover a conteinerização atualmente existente, sem
alterar o servidor MCP ou seus transportes suportados diretamente pelo Python.
Isso inclui:

- excluir `Dockerfile`;
- excluir `docker-compose.yml`;
- remover instruções de Docker do `README.md`, `ARCHITECTURE.md`,
  `CONTRIBUTING.md` e demais documentos afetados;
- remover workflows, scripts ou configurações de CI que dependam de Docker;
- remover referências a imagens, containers, portas publicadas ou comandos
  `docker` que não tenham outra finalidade;
- manter o transporte HTTP do FastMCP disponível somente como execução direta
  do processo Python, quando documentado.

## Testes

Os testes deverão cobrir:

- registro correto da CLI e dos subcomandos;
- validação dos dez IDs de agente;
- escopo padrão `project`;
- escopo explícito `user`;
- descoberta da raiz Git subindo por diretórios;
- fallback para diretório atual sem Git, com aviso;
- merge sem perda de entradas não relacionadas;
- idempotência de `install`;
- fixação e atualização de versão;
- falha de atualização sem alteração quando o PyPI estiver indisponível;
- remoção segura e idempotente;
- proteção contra conflito de entrada ou skill não gerenciada;
- escrita atômica e preservação de permissões;
- rejeição de caminhos inseguros;
- conteúdo e marcador das skills em português;
- inclusão de templates e skills no wheel;
- fixtures das configurações global e de projeto de cada agente;
- comportamento em Windows, Linux e macOS.
- ausência de arquivos, workflows e instruções de conteinerização Docker;
- preservação do transporte HTTP executável diretamente pelo Python.

Adaptadores que usam CLIs nativos deverão ser testados com executáveis falsos
controlados ou com a camada de subprocesso isolada. A suíte não dependerá de
agentes instalados na máquina de CI. Testes live das APIs públicas continuarão
opt-in e separados do gate de instalação.

## Documentação

O projeto deverá incluir:

- seção de instalação rápida via `uvx`;
- referência da CLI e seus escopos;
- instrução separada para cada agente suportado;
- exemplo de instalação, atualização e remoção por agente;
- explicação do fallback `.agent`;
- tabela de locais de configuração por sistema operacional;
- política de merge, conflitos e arquivos gerenciados;
- instruções de publicação e atualização da versão;
- aviso de que a instalação local usa `stdio` e não abre uma API pública.

## Critérios de Aceite

1. `uvx mcp-compras-publicas-br install --agent <id>` funciona nos três
   sistemas operacionais suportados sem exigir shell específico.
2. O comando instala no projeto por padrão e encontra a raiz Git corretamente.
3. Sem Git, o comando usa o diretório atual e informa o aviso definido.
4. `--scope user` registra a configuração global do agente selecionado.
5. Todos os dez IDs têm adaptador, manifesto/fixture e skill em português.
6. A entrada MCP aponta para `uvx` com a versão exata registrada.
7. Configurações não relacionadas permanecem intactas após install/update.
8. Conflitos não reconhecidos não são sobrescritos nem removidos.
9. `update` busca a versão estável mais recente e mantém a versão fixada no
   registro.
10. `uninstall` remove somente arquivos e entradas gerenciados.
11. O wheel publicado contém a CLI, os adaptadores, templates e skills.
12. A documentação permite executar o fluxo sem consultar o código-fonte.
13. `Dockerfile`, `docker-compose.yml` e instruções de conteinerização não
    existem no resultado final.
14. A remoção do Docker não elimina nem altera o transporte HTTP executável
    diretamente pelo Python.

## Fora de Escopo

- Servidor MCP remoto hospedado pelo projeto.
- Operações upstream diferentes de `GET`.
- Detecção automática do agente quando `--agent` não for informado.
- Instalação de binários nativos `.exe`, `.dmg` ou pacotes `.deb`.
- Hooks, comandos slash e automações específicas além da skill e do registro
  MCP.
- Conteinerização, imagens, Docker Compose e publicação de imagens Docker.
- Substituição completa de arquivos de configuração do usuário.
- Inclusão de credenciais ou autenticação para as APIs públicas.
