# Arquitetura

MCP Compras Públicas Brasil é um servidor MCP somente leitura sobre as APIs
públicas oficiais do Compras.gov.br e do PNCP. O caminho da requisição é
obrigatório:

```text
MCP tool -> QueryService -> provider adapter -> ReadOnlyHttpClient -> official API
```

Nenhuma ferramenta MCP pode chamar HTTP diretamente. O `QueryService` é a única
fronteira de serviço entre os manipuladores de ferramentas e os provedores, e
os provedores são a única fronteira que seleciona uma API upstream. Isso mantém
a validação de parâmetros, a paginação, o cache, a normalização de erros e a
proveniência consistentes para todos os endpoints.

O plugin publicado tem um caminho de instalação separado:

```text
plugin CLI -> InstallerService -> AgentAdapter
```

A CLI do plugin seleciona o agente e o escopo `project` ou `user`.
`InstallerService` resolve o destino, obtém a versão do pacote em execução,
mescla a entrada MCP e a skill gerenciada e grava as alterações atomicamente.
`AgentAdapter` é responsável pelo formato, pela localização e pela validação da
configuração específica do agente. O instalador não chama APIs upstream nem
altera o caminho da requisição MCP.

A entrada de registro de cada agente inicia o servidor localmente por meio de
`stdio`, com uma fixação exata do pacote. O comando gerado é equivalente a:

```text
uvx --from mcp-compras-publicas-br==<exact-version> mcp-compras-publicas-br
```

A versão é a versão do pacote usada pelo instalador, nunca uma referência à
versão mais recente sem fixação.

## Componentes

### Servidor MCP

`src/features/mcp/servidor.py` constrói o servidor FastMCP a partir de
`coverage/endpoints.yaml`:

- Cada GET `PUBLIC_USEFUL` implementado é registrado como uma ferramenta
  atômica.
- Os nomes das ferramentas e os esquemas de entrada JSON vêm do manifesto
  revisado e dos parâmetros OpenAPI resolvidos.
- As ferramentas de diagnóstico usam a camada de serviço quando consultam uma
  fonte upstream.
- O servidor não contém entrada de URL arbitrária nem operação de escrita.

### QueryService

`src/features/consultas/servico.py` valida os argumentos catalogados, normaliza
identificadores como CNPJ, renderiza apenas os parâmetros de caminho
catalogados e separa os valores de caminho dos valores de consulta. Ele
seleciona `ComprasClient` ou `PncpClient`, chama o cliente HTTP compartilhado,
normaliza a resposta do provedor e retorna o envelope de resposta MCP.

A paginação é opcional e ativada por meio de parâmetros documentados.
`auto_paginar` segue um sinal de próxima página ou próximo token fornecido pela
resposta upstream e para em `limite_resultados` e nos limites de segurança
configurados. O serviço rejeita argumentos não documentados e localizações de
parâmetros obrigatórios não suportadas.

### Adaptadores de provedores

`ComprasClient` e `PncpClient` fornecem a fachada específica do provedor usada
pelo serviço. Eles normalizam a paginação e os contêineres de itens do provedor
sem inventar totais ou alterar a resposta bruta quando `formato=original` é
solicitado.

As origens de execução são fixas nos adaptadores:

| Provedor | Origem da API em execução |
| --- | --- |
| Compras.gov.br | `https://dadosabertos.compras.gov.br` |
| PNCP | `https://pncp.gov.br/api/pncp` |

A URL de descoberta OpenAPI do PNCP é intencionalmente diferente da sua origem
de API em execução. Uma URL base nunca é derivada de um documento OpenAPI nem
aceita de um chamador MCP.

### ReadOnlyHttpClient

`src/shared/http_readonly.py` é a única fronteira HTTP de saída. Ela expõe
apenas `get()` e impõe:

- HTTPS e um hostname oficial presente na lista de permissões;
- apenas caminhos relativos, sem scheme, host, query, fragmento, traversal ou
  escape com barra invertida no caminho;
- leitura da resposta em streaming com o limite de tamanho de documento
  configurado;
- nenhuma superfície `POST`, `PUT`, `PATCH` ou `DELETE`.

O cliente tenta novamente em caso de timeouts, falhas de rede e status upstream
transitórios (`429`, `502`, `503`, `504`), com backoff exponencial limitado e
jitter. Um `404` não é repetido.

## Descoberta e Cobertura do Contrato

Os documentos OpenAPI oficiais são a fonte do inventário de endpoints. Snapshots
imutáveis são versionados em:

```text
specs/upstream/compras/YYYY-MM-DD.json
specs/upstream/pncp/YYYY-MM-DD.json
```

As URLs de descoberta são:

```text
https://dadosabertos.compras.gov.br/v3/api-docs
https://pncp.gov.br/pncp-api/v3/api-docs
```

`coverage/endpoints.yaml` é o mapeamento revisado e versionado de cada operação
GET descoberta para sua decisão de implementação. Ele registra o snapshot e a
versão OpenAPI, o provedor, o método, o caminho, a segurança, os parâmetros, a
descrição, a classificação, o estado de implementação e um nome de ferramenta
estável em português. As operações públicas úteis devem ter `implemented: true`
e um nome de ferramenta exclusivo que corresponda a
`^(compras|pncp)_[a-z0-9_]+$`. As operações autenticadas ou excluídas por outro
motivo permanecem explícitas e devem incluir uma justificativa de exclusão.

O comando de catálogo oferece três etapas distintas:

1. **Descobrir:** carregar um snapshot local ou obter a URL fixa de descoberta
   oficial, resolver referências OpenAPI locais e normalizar operações GET.
2. **Comparar:** comparar o catálogo descoberto com o manifesto revisado e
   relatar operações adicionadas, removidas e alteradas, incluindo mudanças
   semânticas como segurança, parâmetros obrigatórios, tipos, respostas e
   descrições.
3. **Verificar:** rejeitar entradas ausentes ou extras no manifesto, contratos
   upstream alterados, classificação de segurança não resolvida, cobertura
   pública incompleta, nomes de ferramentas inválidos e exclusões autenticadas
   inconsistentes.

O manifesto não é gerado na inicialização do servidor. Uma alteração em um
contrato upstream exige primeiro descoberta, revisão, classificação explícita,
nomeação estável e atualização do manifesto.

## Portões de CI

A CI de pull request executa:

```text
uv run ruff check .
uv run pyright
uv run pytest -m "not live" -q
uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
uv build
```

Ela também verifica a fronteira HTTP e os adaptadores de provedores em busca de
chamadas a métodos de escrita. A verificação do manifesto garante que nenhum
GET público útil fique sem um mapeamento de implementação nomeado.

O workflow agendado `Upstream Drift` obtém as duas URLs OpenAPI oficiais fixas e
executa:

```text
uv run python -m src.features.catalogo.catalogo discover \
  --official --compare coverage/endpoints.yaml --fail-on-diff
```

Qualquer divergência de contrato fica, portanto, visível como uma falha de CI,
em vez de alterar silenciosamente a superfície MCP. As sondagens de produção ao
vivo são opcionais e não fazem parte do portão de testes padrão.

## Ferramentas Atômicas e Compostas

### Ferramentas atômicas

As ferramentas atômicas preservam a relação de uma ferramenta para cada GET
catalogado. Elas aceitam apenas os parâmetros documentados para aquela operação
e delegam diretamente ao `QueryService`. A cobertura atômica é o contrato de
compatibilidade e completude: todo GET público útil deve ser representado de
forma independente, mesmo quando também existe uma ferramenta composta mais
conveniente.

### Ferramentas compostas

As ferramentas compostas são visões convenientes sobre várias operações
atômicas. Os exemplos atuais incluem visões completas de contratação, atas e
contratos do PNCP, além da busca federada de compras públicas. Elas selecionam
apenas operações elegíveis respaldadas pelo manifesto e chamam
`QueryService.execute_many`; não executam HTTP por conta própria, substituem
ferramentas atômicas nem reduzem os requisitos de cobertura.

Os resultados compostos permanecem indexados pelo identificador da ferramenta ou
operação subjacente. A busca federada não deduplica registros silenciosamente;
quando os identificadores se sobrepõem entre fontes, ela adiciona um marcador de
possível mesmo registro e referências para que o chamador decida como
reconciliá-los.

## Recursos

Os recursos expõem metadados de catálogo e capacidades somente leitura, não
acesso arbitrário a dados upstream:

| URI | Conteúdo |
| --- | --- |
| `mcp://coverage` | Cobertura pública geral e por provedor |
| `compras://coverage` | Cobertura do Compras.gov.br |
| `compras://providers` | Provedores, snapshots e contagens de endpoints |
| `compras://endpoints` | Manifesto de endpoints carregado |
| `compras://domains` | Domínios catalogados do Compras.gov.br |
| `pncp://domains` | Domínios catalogados do PNCP |
| `pncp://api-version` | Versão OpenAPI do PNCP e metadados do snapshot |

Os manipuladores de recursos leem o manifesto carregado e os metadados dos
snapshots. Eles não introduzem outro caminho HTTP ao redor do `QueryService`.

## Transportes

O servidor executável oferece suporte a:

- `stdio` para clientes MCP locais e a invocação padrão;
- transporte `http` direto do FastMCP quando selecionado explicitamente a partir
  do Python, usando uma porta configurável (padrão `8000`).

```text
uv run python -m src.features.mcp.servidor --transport http
```

O transporte HTTP é um processo Python direto e é independente do caminho de
instalação do plugin. Ele não altera o registro de ferramentas, as origens dos
provedores, as garantias de somente leitura nem o fluxo de consultas.

O transporte altera apenas o mecanismo de conexão MCP.

## Cache

O cache é um `TtlCache` limitado em memória, local ao processo do servidor. As
respostas públicas são elegíveis quando não são conteúdo limitado de documento/
arquivo e não contêm um resultado incompleto `content_returned: false`. Defina
`CACHE_ENABLED=false` para ignorá-lo.

A chave é um digest SHA-256 do provedor, do ID da operação, do caminho
renderizado e da consulta/opções ordenadas. Isso impede que requisições
equivalentes compartilhem entradas entre provedores ou contratos de endpoints.
As categorias padrão de TTL são:

| Categoria | TTL |
| --- | ---: |
| Domínios e dados históricos | 86400 segundos |
| Dados de catálogo | 3600 segundos |
| Dados recentes ou não categorizados | 300 segundos |

O cache tem no máximo 4096 entradas e remove uma entrada existente quando está
cheio. Ele não é um cache entre processos nem persistente.

## Erros e Limites de Segurança

Falhas de entrada e transporte são mantidas distintas de resultados vazios
válidos. A fronteira HTTP normaliza as falhas como tipos de `UpstreamError`,
incluindo `NOT_FOUND`, `UPSTREAM_RATE_LIMIT`, `UPSTREAM_UNAVAILABLE`,
`UPSTREAM_BAD_REQUEST`, `UPSTREAM_SCHEMA_CHANGED`, `UPSTREAM_TIMEOUT` e
`DOCUMENT_TOO_LARGE`.

O conteúdo JSON é analisado apenas para tipos de mídia JSON. JSON inválido é
relatado como uma alteração de schema upstream; texto não JSON e CSV são
retornados inalterados. Um documento que excede `MAX_DOCUMENT_BYTES` não é lido
para a resposta. O serviço retorna um marcador limitado com
`download_available: true`, `content_returned: false` e
`reason: file_size_limit`.

## Proveniência

Toda consulta atômica retorna um envelope `McpResponse`:

```json
{
  "source": "pncp",
  "endpoint": "/v1/modalidades",
  "query": {},
  "data": [],
  "metadata": {
    "retrieved_at": "2026-09-05T00:00:00+00:00",
    "pagination": {}
  }
}
```

`source` identifica o provedor, `endpoint` identifica o caminho HTTP
catalogado, `query` registra a consulta efetiva sem os valores de caminho e
`retrieved_at` registra quando a resposta foi montada. Os metadados de paginação
contêm apenas campos observados ou normalizados a partir da resposta upstream.
As ferramentas compostas preservam esses envelopes para cada operação
constituinte.
