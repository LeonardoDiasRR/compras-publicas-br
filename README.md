# MCP Compras Públicas Brasil

Servidor [Model Context Protocol](https://modelcontextprotocol.io/) somente leitura para consultar dados públicos oficiais de compras governamentais brasileiras. O projeto fornece uma interface MCP sobre as APIs do Compras.gov.br e do Portal Nacional de Contratações Públicas (PNCP), preservando a origem e os identificadores dos dados.

## Fontes oficiais

- [Compras.gov.br - Dados Abertos](https://dadosabertos.compras.gov.br/)
- [Compras.gov.br - Swagger](https://dadosabertos.compras.gov.br/swagger-ui/index.html)
- [Compras.gov.br - OpenAPI](https://dadosabertos.compras.gov.br/v3/api-docs)
- [PNCP - API de produção](https://pncp.gov.br/api/pncp)
- [PNCP - Swagger UI e configuração](https://pncp.gov.br/pncp-api/swagger-ui/index.html?configUrl=/pncp-api/v3/api-docs/swagger-config)
- [PNCP - OpenAPI](https://pncp.gov.br/pncp-api/v3/api-docs)
- [PNCP - Manual de integração](https://pncp.gov.br/manual/pt-br/latest/)

As especificações OpenAPI oficiais são a fonte do catálogo e da verificação de cobertura. Implementações de terceiros, wrappers, scrapers e blogs não são contratos primários.

## Instalação local com uv

Requer Python 3.12 ou superior.

Instale o `uv` usando o instalador oficial:

```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

Em macOS ou Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Na raiz do projeto, crie o ambiente e instale as dependências, incluindo as de desenvolvimento:

```bash
uv sync --all-groups
```

O `uv.lock` fixa a resolução das dependências. Não é necessário ativar manualmente o `.venv`; os comandos `uv run` usam o ambiente do projeto.

## Execução

### STDIO

Use STDIO para clientes MCP locais:

```bash
uv run python -m src.features.mcp.servidor --transport stdio
```

### Streamable HTTP

O CLI deste projeto expõe o transporte HTTP do FastMCP como `http`:

```bash
uv run python -m src.features.mcp.servidor --transport http --port 8000
```

Por padrão, o servidor escuta na porta `8000`. Para execução remota, proteja o serviço com TLS, autenticação e limites de tráfego apropriados.

## Configuração

Somente as variáveis abaixo são suportadas atualmente e alteram o comportamento em execução. Elas podem ser fornecidas pelo ambiente ou por um arquivo `.env`:

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `MCP_TRANSPORT` | `stdio` | Transporte padrão (`stdio` ou `http`); `--transport` tem precedência |
| `LOG_LEVEL` | `INFO` | Nível dos logs JSON |
| `HTTP_TIMEOUT` | `30` | Timeout das consultas HTTP, em segundos |
| `HTTP_MAX_RETRIES` | `3` | Número máximo de tentativas para falhas transitórias |
| `HTTP_REQUESTS_PER_SECOND` | `5` | Limite de requisições por segundo por provedor |
| `COMPRAS_MAX_CONCURRENCY` | `4` | Concorrência máxima para Compras.gov.br |
| `PNCP_MAX_CONCURRENCY` | `4` | Concorrência máxima para PNCP |
| `CACHE_ENABLED` | `true` | Habilita o cache em memória |
| `CACHE_DOMAINS_TTL` | `86400` | TTL de domínios, em segundos |
| `CACHE_CATALOG_TTL` | `3600` | TTL de CATMAT/CATSER, em segundos |
| `CACHE_RECENT_TTL` | `300` | TTL de consultas recentes, em segundos |
| `CACHE_HISTORICAL_TTL` | `86400` | TTL de consultas históricas, em segundos |
| `MAX_DOCUMENT_BYTES` | `25000000` | Limite de segurança para todo corpo de resposta upstream, em bytes |

`COMPRAS_BASE_URL` e `PNCP_BASE_URL` não são overrides suportados: os adapters usam as origens fixas `https://dadosabertos.compras.gov.br` e `https://pncp.gov.br/api/pncp`, ambas dentro da allowlist HTTPS do cliente. Uma futura substituição de origem só deve ser documentada depois que o código implementar um override seguro, com validação explícita contra a allowlist.

O argumento `--transport` do módulo é a forma explícita de escolher o transporte na inicialização e prevalece sobre `MCP_TRANSPORT`. Não coloque credenciais ou tokens no repositório.

`MAX_DOCUMENT_BYTES` limita o corpo de toda resposta upstream antes que ele seja completamente lido, inclusive respostas JSON, texto, CSV e binárias. Para endpoints identificados como documentos, arquivos, imagens ou conteúdo limitado, exceder o limite retorna o sentinel:

```json
{
  "download_available": true,
  "content_returned": false,
  "reason": "file_size_limit"
}
```

Para os demais endpoints, exceder o limite retorna o erro upstream `DOCUMENT_TOO_LARGE`, em vez de fabricar uma resposta vazia.

## Verificação

Execute os testes locais, excluindo as sondas opt-in de produção:

```bash
uv run pytest -m "not live" -q
```

Execute o gate de cobertura do manifesto:

```bash
uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
```

Verifique lint e tipos:

```bash
uv run ruff check .
uv run pyright
```

As sondas contra as fontes oficiais são opt-in:

```bash
RUN_LIVE_TESTS=1 uv run pytest -m live -q
```

No PowerShell:

```powershell
$env:RUN_LIVE_TESTS = "1"
uv run pytest -m live -q
```

## Cobertura de endpoints

O manifesto [`coverage/endpoints.yaml`](coverage/endpoints.yaml) registra cada operação GET descoberta, sua classificação e a ferramenta MCP correspondente. A evidência atual é:

| Fonte | GET catalogados | GET públicos úteis | Implementados | Cobertura |
| --- | ---: | ---: | ---: | ---: |
| Compras.gov.br | 73 | 69 | 69 | 100% |
| PNCP | 108 | 100 | 100 | 100% |
| **Total** | **181** | **169** | **169** | **100%** |

Os 12 GETs restantes estão classificados como autenticados e, portanto, fora da cobertura pública. O gate também exige zero endpoint público útil sem mapeamento:

```text
Compras.gov.br: 100.0%
PNCP: 100.0%
overall=1.0
Unmapped public useful GET endpoints: 0
```

Uma alteração no contrato oficial que introduza um GET público útil sem classificação e implementação deve falhar no gate de cobertura.

## Limites de segurança

- Read-only aplica-se às requisições para as APIs upstream: somente `GET` é usado.
- O transporte Streamable HTTP pode receber `POST` do protocolo MCP; isso transporta mensagens MCP e não altera dados nas APIs upstream.
- Não existem operações upstream `POST`, `PUT`, `PATCH` ou `DELETE` no cliente HTTP.
- As origens upstream são fixas e usam HTTPS: `dadosabertos.compras.gov.br` e `pncp.gov.br`.
- As ferramentas aceitam apenas caminhos relativos catalogados; uma URL absoluta ou caminho inseguro é rejeitado.
- Nenhuma ferramenta aceita uma URL arbitrária fornecida pelo usuário.
- Todo corpo de resposta upstream respeita `MAX_DOCUMENT_BYTES`; conteúdo documental excedente usa o sentinel `file_size_limit` quando aplicável.
- Falhas do upstream não são convertidas silenciosamente em listas vazias.

Consulte [`SECURITY.md`](SECURITY.md) para a política detalhada.

## Documentação do projeto

- [`ARCHITECTURE.md`](ARCHITECTURE.md): fluxo interno e limites arquiteturais.
- [`TOOLS.md`](TOOLS.md): catálogo e convenções das ferramentas MCP.
- [`ENDPOINT_COVERAGE.md`](ENDPOINT_COVERAGE.md): relatório gerado de cobertura.
- [`SECURITY.md`](SECURITY.md): controles de segurança e SSRF.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): fluxo de desenvolvimento e contribuições.
