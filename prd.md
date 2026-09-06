# MCP Compras Públicas Brasil

## Especificação Técnica e Funcional

**Versão:** 1.0
**Situação:** Especificação inicial
**Natureza:** Servidor MCP somente leitura
**Fontes primárias:** Compras.gov.br e PNCP
**Objetivo de cobertura:** 100% dos endpoints GET públicos e úteis

---

# 1. Objetivo

Construir um servidor **Model Context Protocol — MCP** dedicado à consulta de dados de compras públicas brasileiras, oferecendo aos clientes MCP uma interface consistente, segura e semanticamente adequada sobre:

1. **API de Dados Abertos do Compras.gov.br**;
2. **APIs públicas de consulta do Portal Nacional de Contratações Públicas — PNCP**.

O MCP deverá fornecer **100% de cobertura dos endpoints HTTP GET que sejam simultaneamente**:

* documentados oficialmente;
* acessíveis publicamente;
* não dependentes de autenticação privada;
* relacionados a dados públicos de compras ou às tabelas de domínio necessárias à interpretação desses dados;
* tecnicamente utilizáveis em produção.

O servidor será **estritamente somente leitura**.

Nenhuma operação POST, PUT, PATCH ou DELETE deverá existir no MCP.

---

# 2. Princípio fundamental de cobertura

A cobertura não deverá ser definida pelo número de ferramentas criadas manualmente.

Deverá existir um **catálogo canônico de endpoints da API de origem**.

Para cada endpoint oficial deverá ser possível determinar:

```text
endpoint upstream
        │
        ├── público?
        ├── GET?
        ├── útil?
        ├── operacional?
        │
        └── implementação MCP correspondente
```

A cobertura deverá ser calculada automaticamente:

```text
coverage =
endpoints GET públicos úteis implementados
──────────────────────────────────────────
total de endpoints GET públicos úteis existentes
```

Meta obrigatória:

```text
coverage = 100%
```

Uma nova versão da API oficial que introduza um GET público útil e ainda não implementado deverá fazer o CI do projeto indicar:

```text
COVERAGE REGRESSION
```

até que o endpoint seja implementado ou explicitamente classificado como não pertencente ao escopo, com justificativa documentada.

---

# 3. Definição formal de "GET público e útil"

## 3.1. Endpoint público

Um endpoint é público quando:

* pode ser utilizado sem conta institucional;
* não exige token de portador privado;
* não exige certificado de cliente;
* não exige credenciamento como plataforma integradora;
* não depende de autorização administrativa específica.

No PNCP, as APIs de consulta são públicas, enquanto serviços de inserção, retificação e exclusão exigem autenticação/credenciamento.

Portanto, um endpoint como:

```http
GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}
```

entra no escopo.

Já:

```http
GET /v1/usuarios/{id}
Authorization: Bearer ...
```

fica fora, embora seja GET, pois a documentação informa que seu acesso depende do usuário autenticado ou administrador.

---

# 4. Fontes oficiais

## 4.1. Compras.gov.br

Fonte principal:

```text
https://dadosabertos.compras.gov.br/
```

A documentação oficial vigente deverá ser considerada a fonte de verdade para descoberta dos endpoints.

A documentação do Governo Federal identifica atualmente:

* Manual da API v2.0;
* documentação interativa da API;
* coleção Postman oficial;
* catálogo navegável de módulos e endpoints.

O Swagger oficial está disponível em:

```text
https://dadosabertos.compras.gov.br/swagger-ui/index.html
```

---

## 4.2. PNCP

Base de produção:

```text
https://pncp.gov.br/api/pncp
```

Documentação:

```text
https://pncp.gov.br/api/pncp/swagger-ui/index.html
```

Manual de integração:

```text
https://pncp.gov.br/manual/pt-br/latest/
```

A versão oficial consultada na elaboração desta especificação é a **2.6**.

Também deverão ser consideradas as APIs especificamente disponibilizadas pelo PNCP para consulta pública quando fizerem parte da interface oficial pública.

---

# 5. Fontes que NÃO serão utilizadas como contrato primário

Não utilizar como fonte definitiva:

* implementações GitHub de terceiros;
* camadas de encapsulamento em Python;
* bibliotecas npm;
* projetos MCP existentes;
* raspadores;
* documentação não oficial;
* exemplos encontrados em blogs;
* código de outros projetos.

Eles poderão eventualmente ser usados apenas como material auxiliar de diagnóstico.

O contrato será sempre determinado pela documentação oficial da API de origem.

---

# 6. Escopo funcional principal

O MCP deverá abranger integralmente as seguintes famílias de informação sempre que existirem endpoints GET públicos correspondentes.

## 6.1. Compras.gov.br

### Catálogo de materiais — CATMAT

Cobrir integralmente consultas relacionadas a:

* grupos;
* classes;
* padrões descritivos;
* materiais;
* itens de material;
* características;
* unidades de fornecimento;
* situação;
* relacionamentos disponíveis.

O manual oficial, por exemplo, documenta consultas do módulo Material através de endpoints GET específicos.

### Catálogo de serviços — CATSER

Cobrir:

* seções;
* divisões;
* grupos;
* classes;
* subclasses;
* serviços;
* unidades;
* natureza;
* relacionamentos e demais entidades públicas existentes.

### Organizações

Cobrir:

* órgãos;
* unidades;
* UASG;
* unidades compradoras;
* hierarquias;
* atributos e filtros disponíveis.

### Contratações

Cobrir integralmente:

* processos de contratação;
* licitações;
* dispensas;
* inexigibilidades;
* modalidades;
* situação;
* itens;
* resultados;
* fornecedores vencedores;
* valores;
* datas;
* unidades;
* demais relacionamentos disponíveis nos endpoints.

### Atas de Registro de Preços

Cobrir:

* atas;
* itens;
* unidades;
* fornecedores;
* vigência;
* quantitativos;
* preços;
* saldos;
* adesões ou relacionamentos existentes na API pública.

### Pesquisa de preços

Cobrir:

* materiais;
* serviços;
* resultados agregados;
* resultados detalhados;
* fornecedores;
* quantidades;
* preços;
* localização;
* datas;
* filtros disponibilizados pela API.

### Planejamento

Cobrir integralmente os módulos públicos relacionados a:

* PGC;
* PCA;
* itens de planejamento;
* unidades;
* agregações;
* valores;
* categorias;
* anos de planejamento.

### Demais módulos

Qualquer outro módulo GET público introduzido ou já presente na documentação oficial deverá ser incluído, mesmo que não esteja nominalmente listado nesta especificação.

---

# 7. PNCP — escopo funcional

A cobertura do PNCP deverá ser determinada automaticamente a partir do contrato oficial, e não limitada a esta lista.

## 7.1. Tabelas de domínio

Todas as tabelas de domínio acessíveis publicamente deverão ser expostas.

Exemplos:

* modalidades;
* modos de disputa;
* instrumentos convocatórios;
* amparos legais;
* tipos de contrato;
* tipos de documento;
* tipos de instrumentos de cobrança;
* categorias;
* situações;
* demais domínios existentes.

Por exemplo:

```http
GET /v1/tipos-documentos
GET /v1/tipos-documentos/{id}
```

são consultas públicas documentadas oficialmente.

---

# 8. PNCP — PCA

Cobrir todos os GET públicos referentes ao Plano de Contratações Anual, incluindo:

* planos por órgão;
* planos por unidade;
* itens;
* valores;
* agregações;
* categorias.

Exemplo oficial:

```http
GET /v1/orgaos/{cnpj}/pca/{ano}/valorcategoriaitem
```

e:

```http
GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/valorcategoriaitem
```

---

# 9. PNCP — Contratações

Cobrir integralmente consultas de:

* contratação individual;
* contratações por períodos;
* contratações atualizadas;
* contratações por proposta;
* itens;
* resultados;
* documentos;
* histórico;
* fontes orçamentárias;
* relacionamentos;
* demais GET públicos existentes.

Por exemplo:

```http
GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}
GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens
```

são endpoints públicos documentados pelo PNCP.

---

# 10. PNCP — Atas de Registro de Preços

Cobertura integral incluindo, sempre que disponibilizado:

```text
Ata
 ├─ detalhes
 ├─ documentos
 ├─ histórico
 ├─ contratos
 ├─ partes envolvidas
 └─ outros relacionamentos
```

Exemplos:

```http
GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas

GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}

GET .../atas/{sequencialAta}/arquivos

GET .../atas/{sequencialAta}/historico

GET .../atas/{sequencialAta}/contratos
```

Todos esses tipos de consulta são documentados no manual oficial atual.

---

# 11. PNCP — Contratos e Empenhos

Cobrir:

* contrato individual;
* contratos relacionados a contratação;
* documentos;
* históricos;
* empenhos;
* instrumentos de cobrança;
* termos de contrato;
* documentos dos termos;
* demais sub-recursos públicos.

Exemplos:

```http
GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}

GET /v1/orgaos/{cnpj}/contratos/contratacao/{ano}/{sequencial}

GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico
```

E:

```http
GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/empenhos
```

---

# 12. PNCP — Organizações e unidades

Cobrir todos os GET públicos relacionados a:

* órgãos;
* entidades;
* unidades;
* detalhes das unidades;
* relacionamentos disponíveis.

Endpoints que exijam autenticação ficam automaticamente excluídos.

---

# 13. Arquitetura

Arquitetura lógica:

```text
                 ┌───────────────────────┐
                 │      MCP Client       │
                 │ ChatGPT / Claude /    │
                 │ Codex / IDE / Agent   │
                 └───────────┬───────────┘
                             │ MCP
                             ▼
                ┌────────────────────────┐
                │      MCP Server        │
                │                        │
                │ Tool Registry          │
                │ Resource Registry      │
                │ Domain Services        │
                └───────────┬────────────┘
                            │
                  ┌─────────┴──────────┐
                  ▼                    ▼
           Compras Adapter         PNCP Adapter
                  │                    │
                  ▼                    ▼
       dadosabertos.compras      pncp.gov.br
```

---

# 14. Arquitetura interna sugerida

```text
src/
├── server/
│   ├── mcp_server.py
│   ├── registry.py
│   └── capabilities.py
│
├── core/
│   ├── models/
│   ├── pagination.py
│   ├── errors.py
│   ├── validation.py
│   ├── serialization.py
│   └── http.py
│
├── providers/
│   ├── compras/
│   │   ├── client.py
│   │   ├── endpoints.py
│   │   ├── models/
│   │   └── services/
│   │
│   └── pncp/
│       ├── client.py
│       ├── endpoints.py
│       ├── models/
│       └── services/
│
├── tools/
│   ├── compras/
│   ├── pncp/
│   └── composite/
│
├── resources/
│
├── coverage/
│   ├── discovery.py
│   ├── classifier.py
│   ├── manifest.py
│   ├── diff.py
│   └── report.py
│
└── tests/
```

---

# 15. Regra de arquitetura crítica

Uma ferramenta MCP **não deve executar HTTP diretamente**.

Fluxo obrigatório:

```text
MCP Tool
   ↓
Domain Service
   ↓
Provider Adapter
   ↓
HTTP Client
   ↓
API oficial
```

Isso permitirá:

* testes unitários;
* troca de endpoint;
* tratamento consistente de erros;
* composição entre APIs;
* novas tentativas controladas;
* observabilidade;
* cobertura automatizada.

---

# 16. Clientes HTTP

Deverão existir clientes separados:

```text
ComprasClient
PNCPClient
```

Os clientes serão responsáveis exclusivamente por:

* URL;
* conexão;
* timeout;
* parâmetros de consulta;
* cabeçalhos;
* paginação de baixo nível;
* tratamento de HTTP;
* desserialização inicial.

Não deverão conter lógica MCP.

---

# 17. Política de somente leitura

O servidor deverá rejeitar arquiteturalmente qualquer método diferente de GET.

Sugestão:

```python
ALLOWED_HTTP_METHODS = {"GET"}
```

O cliente HTTP especializado não deverá sequer fornecer métodos:

```python
post()
put()
patch()
delete()
```

para os adaptadores das APIs.

Deve existir teste automatizado garantindo:

```text
POST   = impossível
PUT    = impossível
PATCH  = impossível
DELETE = impossível
```

---

# 18. Proteção adicional contra SSRF

As URLs das APIs de origem deverão ser fixas.

Lista de permissões:

```text
https://dadosabertos.compras.gov.br
https://pncp.gov.br
```

Opcionalmente:

```text
https://treina.pncp.gov.br
```

somente no perfil de testes.

Nenhuma ferramenta poderá receber uma URL arbitrária do usuário.

---

# 19. Estratégia de ferramentas MCP

Existirão dois tipos de ferramentas.

## Tipo A — ferramentas atômicas

Representam uma operação de consulta na API de origem.

Exemplo conceitual:

```text
pncp_get_contratacao
pncp_list_itens_contratacao
pncp_get_resultado_item
pncp_list_atas_contratacao
pncp_list_empenhos_contrato
```

## Tipo B — ferramentas semânticas

Combinam várias consultas sem alterar dados.

Exemplos:

```text
buscar_contratacao_completa
buscar_ata_completa
buscar_contrato_completo
comparar_precos_material
historico_completo_contratacao
```

As ferramentas compostas são adicionais.

Elas **não substituem** as ferramentas necessárias para garantir a cobertura dos endpoints.

---

# 20. Relação endpoint ↔ implementação

Todo endpoint deverá possuir um identificador interno estável.

Exemplo:

```yaml
id: pncp.contratacao.get
provider: pncp
method: GET
path: /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}
public: true
useful: true
tool: pncp_get_contratacao
status: implemented
```

Outro:

```yaml
id: pncp.usuario.get_by_id
provider: pncp
method: GET
path: /v1/usuarios/{id}
public: false
reason: bearer_token_required
status: excluded
```

---

# 21. Manifesto de cobertura

O repositório deverá conter arquivo gerado automaticamente:

```text
coverage/endpoints.yaml
```

Formato:

```yaml
source_version:
  compras:
    discovered_at: 2026-09-04
    source: official
  pncp:
    manual_version: "2.6"

endpoints:

  - id: pncp.contract.commitments.list
    method: GET
    path: /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/empenhos
    public: true
    useful: true
    implemented: true
    tool: pncp_list_empenhos

  - id: pncp.user.get
    method: GET
    path: /v1/usuarios/{id}
    public: false
    useful: false
    implemented: false
    exclusion:
      reason: authentication_required
```

---

# 22. Descoberta automática de endpoints

Criar comando:

```bash
python -m coverage.discover
```

Ele deverá:

1. recuperar o OpenAPI oficial;
2. enumerar todos os caminhos;
3. filtrar operações GET;
4. registrar esquemas de segurança;
5. comparar com o instantâneo anterior;
6. gerar um novo manifesto.

Resultado:

```text
Compras.gov.br
GET discovered: 74

PNCP
GET discovered: 91

New endpoints: 2
Removed endpoints: 0
Changed endpoints: 1
```

Os números acima são meramente ilustrativos.

---

# 23. Classificação

Cada GET será classificado em uma das categorias:

```text
PUBLIC_USEFUL
PUBLIC_NOT_USEFUL
AUTHENTICATED
DEPRECATED
BROKEN_UPSTREAM
INTERNAL
UNKNOWN
```

`UNKNOWN` deverá quebrar o teste de cobertura.

Isto é importante.

Um endpoint novo não poderá simplesmente desaparecer do relatório.

---

# 24. Regra para "útil"

Por padrão:

```text
GET + público = útil
```

Exclusão somente mediante justificativa explícita.

Exemplos aceitáveis:

```text
verificação de saúde
swagger config
actuator
endpoint interno de framework
endpoint duplicado sem função de domínio
```

A exclusão ficará versionada.

---

# 25. CI de cobertura

Pipeline obrigatório:

```text
discover upstream
       ↓
normalize OpenAPI
       ↓
classify endpoints
       ↓
compare manifest
       ↓
compare tool registry
       ↓
calculate coverage
```

Build passa somente se:

```text
public_useful_coverage == 100%
```

---

# 26. Relatório de cobertura

Gerar:

```text
coverage-report.md
```

Exemplo:

| API            | GET oficiais | Públicos úteis | Implementados | Cobertura |
| -------------- | -----------: | -------------: | ------------: | --------: |
| Compras.gov.br |           84 |             82 |            82 |      100% |
| PNCP           |          113 |             91 |            91 |      100% |
| **Total**      |      **197** |        **173** |       **173** |  **100%** |

Valores ilustrativos.

---

# 27. Detecção de mudanças na API de origem

Executar automaticamente, por exemplo, diariamente ou semanalmente:

```text
official API
     ↓
OpenAPI snapshot
     ↓
semantic diff
```

Detectar:

```text
endpoint_added
endpoint_removed
parameter_added
parameter_removed
parameter_type_changed
response_changed
security_changed
deprecated_changed
```

Mudanças deverão abrir issue automática ou falhar no CI.

---

# 28. Espaços de nomes das ferramentas

Usar nomenclatura previsível.

## Compras

```text
compras_...
```

## PNCP

```text
pncp_...
```

Exemplos:

```text
compras_listar_materiais
compras_obter_material
compras_pesquisar_precos_material

pncp_obter_contratacao
pncp_listar_itens_contratacao
pncp_listar_atas_contratacao
pncp_obter_ata
pncp_listar_contratos_ata
pncp_listar_empenhos_contrato
```

---

# 29. Idioma

Os nomes das ferramentas deverão ser em português.

Motivos:

* domínio brasileiro;
* terminologia jurídica brasileira;
* usuários predominantemente lusófonos;
* correspondência com nomes oficiais.

Parâmetros também devem preferencialmente utilizar terminologia de domínio:

```text
cnpj
ano
sequencial_contratacao
numero_item
uasg
codigo_material
codigo_servico
```

---

# 30. Descrição das ferramentas

Toda ferramenta deverá ter descrição suficientemente detalhada para seleção correta pelo LLM.

Ruim:

```text
Consulta contratação.
```

Bom:

```text
Consulta os dados detalhados de uma contratação publicada no PNCP a partir
do CNPJ do órgão, ano e número sequencial da contratação. Use esta ferramenta
quando os identificadores PNCP da contratação já forem conhecidos.
```

---

# 31. Esquemas de entrada

Todos os argumentos deverão possuir:

* tipo;
* descrição;
* obrigatoriedade;
* limites;
* formato;
* exemplo quando útil.

Exemplo:

```python
cnpj: str
```

validação:

```text
14 dígitos numéricos
```

Não aceitar automaticamente pontuação se a API não aceitar.

Pode-se normalizar:

```text
00.394.460/0001-41
→
00394460000141
```

---

# 32. Datas

Internamente utilizar ISO 8601:

```text
YYYY-MM-DD
```

Se a API de origem exigir:

```text
YYYYMMDD
```

a conversão deverá ocorrer dentro do adaptador.

O modelo não deve precisar conhecer peculiaridades de formato da API.

---

# 33. Paginação

Criar abstração única:

```python
Page[T]
```

Exemplo de retorno normalizado:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_pages": 12,
    "total_items": 574,
    "has_next": true
  }
}
```

Quando a API de origem não fornecer todos esses campos, utilizar apenas os disponíveis.

Nunca fabricar números.

---

# 34. Paginação automática

As ferramentas de listagem deverão oferecer:

```text
pagina
tamanho_pagina
```

e opcionalmente:

```text
auto_paginar
limite_resultados
```

Mas deve haver proteção contra chamadas gigantes.

Exemplo:

```text
limite_resultados padrão = 100
máximo configurável
```

---

# 35. Respostas MCP

Não modificar desnecessariamente os dados oficiais.

Retorno recomendado:

```json
{
  "source": "pncp",
  "endpoint": "...",
  "query": {},
  "data": [],
  "metadata": {
    "retrieved_at": "...",
    "pagination": {}
  }
}
```

---

# 36. Proveniência

Toda resposta deverá indicar a origem.

Exemplo:

```json
{
  "_source": {
    "provider": "PNCP",
    "api": "pncp.gov.br",
    "retrieved_at": "2026-09-04T16:00:00Z"
  }
}
```

Isso é especialmente importante para agentes.

---

# 37. Documentos e anexos

Quando um GET retornar documento, arquivo ou URL para download, o MCP deverá suportá-lo.

Duas operações distintas:

```text
listar metadados
obter conteúdo
```

Nunca fazer download de todos os documentos implicitamente.

Exemplo:

```text
pncp_listar_documentos_ata
pncp_obter_documento_ata
```

---

# 38. Limite de documentos

Configuração:

```env
MAX_DOCUMENT_BYTES=
```

Documentos acima do limite poderão retornar:

```json
{
  "download_available": true,
  "content_returned": false,
  "reason": "file_size_limit"
}
```

---

# 39. Armazenamento em cache

Cache recomendado para consultas públicas.

Categorias:

### Domínios

TTL longo:

```text
6–24 horas
```

### CATMAT/CATSER

TTL:

```text
1–24 horas
```

### Contratações recentes

TTL curto:

```text
1–10 minutos
```

### Contratações históricas

TTL maior.

O cache deve poder ser desabilitado.

---

# 40. Chave de cache

Incluir:

```text
provider
endpoint
path params
query params normalizados
```

Exemplo:

```text
sha256(
  "pncp:/v1/...:{cnpj}:2026:123"
)
```

---

# 41. Resiliência

Implementar:

* timeout;
* pool de conexões;
* novas tentativas limitadas;
* recuo exponencial;
* variação aleatória;
* disjuntor opcional.

Repetir somente em:

```text
429
502
503
504
connection reset
timeout
```

Não repetir automaticamente:

```text
400
401
403
404
422
```

---

# 42. Limites de taxa

Mesmo que a API de origem não publique limites claros, o MCP deverá proteger as APIs.

Configurações:

```env
COMPRAS_MAX_CONCURRENCY=
PNCP_MAX_CONCURRENCY=
HTTP_REQUESTS_PER_SECOND=
```

---

# 43. Erros normalizados

Modelo:

```json
{
  "error": {
    "provider": "pncp",
    "type": "NOT_FOUND",
    "status": 404,
    "message": "...",
    "upstream_message": "...",
    "retryable": false
  }
}
```

Tipos mínimos:

```text
INVALID_ARGUMENT
NOT_FOUND
UPSTREAM_BAD_REQUEST
UPSTREAM_RATE_LIMIT
UPSTREAM_TIMEOUT
UPSTREAM_UNAVAILABLE
UPSTREAM_SCHEMA_CHANGED
INTERNAL_ERROR
```

---

# 44. Não mascarar erros da API de origem

O MCP poderá explicar o erro, mas não deverá transformar:

```text
HTTP 500
```

em:

```text
[]
```

Retornar lista vazia nesse cenário induziria o LLM a concluir falsamente que não existem resultados.

---

# 45. Modo bruto

Cada consulta deverá suportar internamente acesso à carga útil original da API de origem para testes.

Opcionalmente expor argumento:

```text
formato = normalizado | original
```

Padrão:

```text
normalizado
```

Isso ajuda quando o usuário precisa de campos recém-adicionados ainda não mapeados.

---

# 46. Preservação de campos desconhecidos

Os modelos deverão tolerar campos adicionais.

Nova propriedade adicionada pela API de origem não poderá quebrar imediatamente a API.

Política:

```text
known fields → typed
unknown fields → preserved
```

---

# 47. Ferramentas compostas

Além da cobertura 1:1 dos recursos oficiais, criar ferramentas de maior valor para LLMs.

Exemplos:

## Contratação completa

```text
pncp_obter_contratacao_completa
```

Executa:

```text
contratação
 ├── itens
 ├── resultados
 ├── documentos
 ├── atas
 ├── contratos
 └── fontes orçamentárias
```

---

# 48. Ata completa

```text
pncp_obter_ata_completa
```

Retorna:

```text
ata
├── documentos
├── partes envolvidas
├── contratos
└── histórico
```

---

# 49. Contrato completo

```text
pncp_obter_contrato_completo
```

Retorna:

```text
contrato
├── empenhos
├── instrumentos de cobrança
├── termos
├── documentos
└── histórico
```

---

# 50. Busca federada

Criar ferramentas que pesquisem mais de uma fonte.

Exemplo:

```text
buscar_compras_publicas
```

Parâmetros:

```text
texto
orgao
uasg
cnpj
modalidade
data_inicio
data_fim
codigo_material
codigo_servico
fonte
```

`fonte`:

```text
compras
pncp
todas
```

---

# 51. Não deduplicar silenciosamente

Quando resultados de Compras.gov.br e PNCP representarem a mesma contratação, fornecer:

```text
possible_same_record = true
```

e referências de ambas as fontes.

Não apagar uma das fontes automaticamente.

---

# 52. Identificadores

Preservar identificadores oficiais:

```text
numeroControlePNCP
cnpj
uasg
sequencialCompra
sequencialAta
sequencialContrato
numeroItem
codigoMaterial
codigoServico
```

Eles são fundamentais para navegação entre recursos.

---

# 53. Recursos MCP

Além das ferramentas, expor recursos úteis.

Exemplos:

```text
compras://coverage
compras://providers
compras://endpoints
compras://domains
pncp://domains
pncp://api-version
```

---

# 54. Recurso de cobertura

Especialmente importante:

```text
mcp://coverage
```

Retorno:

```json
{
  "compras": {
    "coverage": 1.0
  },
  "pncp": {
    "coverage": 1.0
  },
  "overall": {
    "coverage": 1.0
  }
}
```

---

# 55. Ferramenta de metadados

Criar:

```text
listar_capacidades_mcp
```

Permite ao agente descobrir:

* fontes;
* domínios;
* quantidade de ferramentas;
* endpoints cobertos;
* versão;
* data do último instantâneo.

---

# 56. Ferramenta de diagnóstico

Criar:

```text
verificar_saude_fontes
```

Consulta endpoints leves e retorna:

```text
Compras.gov.br: operational
PNCP: operational
```

Sem realizar alterações.

---

# 57. Testes unitários

Cobertura mínima sugerida:

```text
>= 90%
```

Para:

* adaptadores;
* validação;
* paginação;
* normalização;
* erros;
* registro;
* verificador de cobertura.

---

# 58. Testes de contrato

Cada endpoint deverá possuir teste baseado no contrato oficial.

Exemplo:

```text
test_pncp_get_contratacao_contract
test_pncp_list_itens_contract
test_pncp_list_atas_contract
```

---

# 59. Testes de verificação contra produção

Executar um pequeno conjunto de consultas públicas conhecidas.

Nunca depender exclusivamente de simulações.

Separar:

```text
unit
integration
live
```

---

# 60. Teste de somente leitura

Obrigatório no CI.

Pesquisar por:

```text
POST
PUT
PATCH
DELETE
```

nos adaptadores e nos métodos HTTP habilitados.

Qualquer ocorrência operacional deve quebrar o pipeline.

---

# 61. Teste de cobertura

Obrigatório:

```python
assert useful_public_get_coverage == 1.0
```

---

# 62. Teste de deriva de esquema

Executar um instantâneo contra a API de origem.

Se houver mudança:

```text
FAIL
```

com relatório:

```text
NEW:
GET /foo/bar

CHANGED:
GET /v1/...

REMOVED:
GET /old/path
```

---

# 63. Observabilidade

Logs estruturados JSON.

Campos:

```text
timestamp
request_id
provider
tool
endpoint
duration_ms
status_code
retry_count
cache_hit
```

Nunca registrar conteúdo sensível desnecessariamente.

---

# 64. Métricas

Expor opcionalmente:

```text
mcp_requests_total
upstream_requests_total
upstream_errors_total
upstream_latency_seconds
cache_hits_total
cache_misses_total
tool_calls_total
coverage_ratio
```

---

# 65. Telemetria de falhas na API de origem

Registrar separadamente:

```text
schema_error
invalid_json
timeout
5xx
rate_limit
unexpected_content_type
```

Isso permitirá detectar regressões das APIs governamentais.

---

# 66. Configuração

Exemplo:

```env
MCP_TRANSPORT=stdio

COMPRAS_BASE_URL=https://dadosabertos.compras.gov.br
PNCP_BASE_URL=https://pncp.gov.br/api/pncp

HTTP_TIMEOUT=30
HTTP_MAX_RETRIES=3

CACHE_ENABLED=true

LOG_LEVEL=INFO

MAX_DOCUMENT_BYTES=25000000
```

---

# 67. Transportes MCP

Suportar:

```text
STDIO
Streamable HTTP
```

STDIO será útil para uso local.

Streamable HTTP será apropriado para servidor compartilhado.

---

# 68. Segurança do MCP remoto

Se usado remotamente:

* TLS;
* autenticação no próprio MCP;
* limitação de taxa;
* limite de carga útil;
* limite de concorrência;
* CORS restrito quando aplicável.

Isso não altera o caráter público das APIs de origem.

---

# 69. Pilha tecnológica sugerida

Implementação preferencial:

```text
Python 3.12+
FastMCP / MCP Python SDK
httpx
Pydantic v2
pytest
respx
structlog
tenacity
```

Cache opcional:

```text
in-memory
ou
Redis
```

Redis não deverá ser requisito para execução local.

---

# 70. Gerenciamento de dependências

Preferir:

```text
uv
```

Estrutura:

```text
pyproject.toml
uv.lock
```

---

# 71. Qualidade

Ferramentas:

```text
ruff
mypy ou pyright
pytest
```

CI:

```text
lint
typecheck
unit tests
contract tests
coverage manifest
read-only enforcement
package build
```

---

# 72. Docker

Fornecer:

```text
Dockerfile
docker-compose.yml
```

Imagem:

* usuário não-root;
* sistema de arquivos preferencialmente somente leitura;
* verificação de saúde;
* sem credenciais embutidas.

---

# 73. Documentação

O projeto deverá possuir:

```text
README.md
ARCHITECTURE.md
TOOLS.md
ENDPOINT_COVERAGE.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md
```

---

# 74. ENDPOINT_COVERAGE.md

Arquivo gerado automaticamente.

Exemplo:

```text
PNCP

✅ GET /v1/tipos-documentos
✅ GET /v1/tipos-documentos/{id}
✅ GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}
✅ GET .../itens
✅ GET .../atas
...

🔒 GET /v1/usuarios/{id}
Excluded: authentication required
```

---

# 75. Processo para adicionar endpoint

Ao detectar novo endpoint:

```text
1. discover
2. classify
3. generate test skeleton
4. implement adapter
5. implement domain service
6. expose MCP tool
7. add contract test
8. update manifest
9. coverage returns to 100%
```

---

# 76. Geração de código

Pode-se gerar automaticamente:

* modelos básicos;
* esquemas;
* identificadores;
* testes;
* registro.

Mas **não gerar automaticamente descrições MCP diretamente do operationId sem revisão**.

A qualidade semântica da descrição influencia fortemente o comportamento do agente.

---

# 77. Compatibilidade futura

O MCP não deverá assumir que:

```text
API de hoje = API permanente
```

Todo contrato da API de origem será versionado em:

```text
specs/upstream/
```

Exemplo:

```text
specs/upstream/
├── compras/
│   └── 2026-09-04.json
└── pncp/
    └── 2.6.json
```

---

# 78. Diferença semântica

Não comparar apenas texto JSON.

Normalizar:

* ordem dos parâmetros;
* `$ref`;
* descrição;
* esquemas;
* segurança;
* métodos.

Classificar mudança como:

```text
breaking
non_breaking
documentation_only
```

---

# 79. Critérios de aceite da versão 1.0

A versão 1.0 somente será considerada concluída quando:

### Cobertura

```text
100% Compras.gov.br GET público útil
100% PNCP GET público útil
```

### Segurança

```text
0 tools de escrita
0 chamadas POST
0 chamadas PUT
0 chamadas PATCH
0 chamadas DELETE
```

### Contrato

Todos os endpoints estarão presentes no manifesto.

### Testes

Todos os endpoints terão pelo menos:

```text
contract test
+
tool test
```

### Deriva

O projeto terá mecanismo automático para detectar alterações na API de origem.

---

# 80. Definição de concluído por endpoint

Um endpoint somente será considerado implementado quando:

* [ ] estiver registrado no manifesto;
* [ ] classificação pública confirmada;
* [ ] parâmetros mapeados;
* [ ] adaptador implementado;
* [ ] tratamento de paginação implementado, se aplicável;
* [ ] erros tratados;
* [ ] ferramenta MCP exposta;
* [ ] descrição semântica revisada;
* [ ] esquema de entrada validado;
* [ ] teste unitário presente;
* [ ] teste de contrato presente;
* [ ] teste ao vivo possível;
* [ ] proveniência presente na resposta;
* [ ] documentação atualizada.

---

# 81. Fora do escopo

Versão 1.0 não deverá:

* publicar contratação;
* modificar contratação;
* excluir contratação;
* inserir ata;
* modificar ata;
* enviar documentos;
* autenticar como órgão público;
* alterar contratos;
* enviar empenhos;
* substituir sistemas oficiais;
* realizar raspagem de páginas HTML quando existir API oficial equivalente.

---

# 82. Filosofia do projeto

O MCP deverá ser tratado como:

> **uma camada pública, tipada, verificável e estritamente somente leitura sobre os dados oficiais de compras públicas do Governo Federal.**

Ele não será apenas uma coleção de ferramentas.

Será uma implementação cuja correspondência com as APIs de origem pode ser matematicamente auditada.

A propriedade fundamental do projeto será:

```text
API oficial mudou
        ↓
MCP detecta
        ↓
CI acusa diferença
        ↓
implementação é atualizada
        ↓
cobertura volta a 100%
```

---

# 83. Arquitetura final resumida

```text
                         MCP CLIENT
                             │
                             ▼
                    ┌─────────────────┐
                    │   MCP SERVER    │
                    ├─────────────────┤
                    │ Atomic Tools    │
                    │ Semantic Tools  │
                    │ Resources       │
                    └────────┬────────┘
                             │
                     DOMAIN SERVICES
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
         COMPRAS ADAPTER            PNCP ADAPTER
                 │                       │
                 ▼                       ▼
       Compras.gov.br API           PNCP API
                 
                 
            COVERAGE SUBSYSTEM
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    OpenAPI      Manifest      Diff
        │           │           │
        └───────────┼───────────┘
                    ▼
                CI GATE
                    │
          coverage must = 100%
```

# 84. Requisito central

A versão 1.0 deverá ser capaz de responder objetivamente:

> “O MCP cobre todos os GET públicos úteis disponíveis hoje?”

sem depender de avaliação humana subjetiva.

A resposta deverá ser produzida pelo próprio sistema de cobertura:

```text
Compras.gov.br: 100%
PNCP:           100%
Overall:        100%

Unmapped public useful GET endpoints: 0
Authenticated GET endpoints excluded: N
Deprecated endpoints excluded: N
Broken upstream endpoints: N
```

Esse relatório será a principal evidência de conformidade do projeto.
