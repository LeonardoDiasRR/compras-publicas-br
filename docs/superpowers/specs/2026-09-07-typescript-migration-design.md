# Migração para TypeScript — Design

Data: 2026-09-07
Branch: `typescript`
Status: aprovado pelo usuário

## Objetivo

Reescrever integralmente o `mcp-compras-publicas-br` de Python 3.12 para
TypeScript, removendo todo o runtime Python ao final. O pacote passa a ser
publicado no npm com o nome `mcp-compras-publicas-br`; o registro do plugin
nos agentes troca `uvx --from mcp-compras-publicas-br==<versão>` por
`npx -y mcp-compras-publicas-br@<versão-exata>`.

Nada do comportamento observável muda: nomes de ferramentas, schemas de
entrada, envelope `McpResponse`, proveniência, códigos de erro, cache,
garantias somente-leitura e o manifesto `coverage/endpoints.yaml` são o
contrato de compatibilidade e permanecem idênticos.

## Stack

| Camada | Python (atual) | TypeScript (alvo) |
| --- | --- | --- |
| Runtime | Python 3.12 + uv | Node.js >= 20 + npm |
| MCP | fastmcp 3.2.4 | `@modelcontextprotocol/sdk` |
| Validação/modelos | pydantic v2 | `zod` |
| HTTP | httpx | `fetch` nativo (injetável via construtor) |
| Config env | pydantic-settings | parse de `process.env` com zod |
| YAML / TOML / JSON5 | PyYAML / tomlkit / json5 | `yaml` / `smol-toml` / `json5` |
| Testes | pytest + respx + pytest-asyncio | `vitest` (fetch stubbado) |
| Tipos/lint | pyright strict + ruff | `tsc --strict` (sem eslint) |
| CLI | argparse | parsing manual de `process.argv` |

Nenhuma dependência além das listadas.

## Estrutura

```text
package.json      name=mcp-compras-publicas-br, bin → dist/index.js (shebang),
                  engines: node>=20, files: ["dist"]
tsconfig.json     strict, module/moduleResolution NodeNext, outDir dist
src/
  index.ts                      entrada do servidor/CLI
  shared/http_readonly.ts       ReadOnlyHttpClient
  shared/runtime.ts             env, TtlCache, erros
  features/provedores/clientes.ts    ComprasClient, PncpClient
  features/consultas/servico.ts      QueryService
  features/catalogo/catalogo.ts      descobrir/comparar/verificar
  features/catalogo/modelos.ts       tipos do manifesto (zod)
  features/mcp/servidor.ts      registro de ferramentas e recursos
  features/plugin/cli.ts        CLI do plugin
  features/plugin/instalador.ts InstallerService
  features/plugin/adaptadores.ts     AgentAdapters
  features/plugin/armazenamento.ts   escrita atômica
  features/plugin/escopo.ts
  features/plugin/modelo.ts
  features/plugin/habilidades.ts     (ex-skill)
  features/plugin/versoes.ts
test/                           15 arquivos vitest 1:1 com os testes pytest
```

## Componentes

### ReadOnlyHttpClient

- `fetch` nativo com leitura em `ReadableStream` e abort ao exceder
  `MAX_DOCUMENT_BYTES`.
- Mantém: HTTPS obrigatório, whitelist de hostnames oficiais, apenas caminhos
  relativos, sem query/fragmento/traversal no caminho, apenas `get()`.
- Retry: timeout/falha de rede/429/502/503/504 com backoff exponencial +
  jitter limitado; 404 nunca repete.
- O `fetch` é injetado pelo construtor para testes (substitui o respx).

### QueryService, provedores e cache

Port 1:1 da lógica atual: validação de argumentos catalogados, normalização
de CNPJ, renderização apenas de parâmetros de caminho catalogados,
seleção de provedor, normalização de paginação, `auto_paginar` com
`limite_resultados` e limites de segurança, envelope `McpResponse` com
`source`/`endpoint`/`query`/`metadata.retrieved_at`.

`TtlCache` em memória: chave SHA-256 (provedor + operação + caminho +
consulta ordenada), máx. 4096 entradas, mesmas categorias de TTL
(86400/3600/300 s), `CACHE_ENABLED=false` desativa.

### Servidor MCP

- `McpServer` do SDK oficial; tools registradas de `coverage/endpoints.yaml`
  exatamente como hoje (nomes `^(compras|pncp)_[a-z0-9_]+$`, schemas dos
  parâmetros OpenAPI resolvidos).
- Transporte `stdio` (padrão) e `http` via `StreamableHTTPServerTransport` +
  `node:http`, porta configurável (padrão 8000).
- Ferramentas compostas chamam apenas `QueryService.execute_many`; recursos
  (`mcp://coverage`, `compras://*`, `pncp://*`) leem manifesto/snapshots.
- Sem entrada de URL arbitrária e sem operações de escrita.

### Catálogo (CLI)

`npm run catalogo -- discover|compare|check` sobre os snapshots em
`specs/upstream/` e o manifesto, com as mesmas três etapas (descobrir,
comparar, verificar) e as mesmas validações (cobertura pública, nomes de
ferramenta, exclusões autenticadas justificadas).

### Plugin instalador

- Arquitetura inalterada: `CLI → InstallerService → AgentAdapter`, escopos
  `project`/`user`, fusão da entrada MCP e skill gerenciada, escrita atômica.
- Mudança de comportamento: a entrada de registro gerada passa a ser
  `npx -y mcp-compras-publicas-br@<versão-exata>`, com a versão lida do
  `package.json` em execução (`createRequire`), nunca `latest`.
- `docs/agents/*.md` atualizados para o comando `npx`.

### Erros e limites

Mesmos tipos de `UpstreamError`: `NOT_FOUND`, `UPSTREAM_RATE_LIMIT`,
`UPSTREAM_UNAVAILABLE`, `UPSTREAM_BAD_REQUEST`, `UPSTREAM_SCHEMA_CHANGED`,
`UPSTREAM_TIMEOUT`, `DOCUMENT_TOO_LARGE`. JSON só é parseado para mídia JSON;
texto/CSV voltam inalterados; documento acima do limite retorna marcador com
`download_available: true`, `content_returned: false`,
`reason: file_size_limit`.

## Testes

- Os 15 arquivos pytest viram 15 arquivos vitest com as mesmas asserções
  (especificação comportamental): `test_catalogo`, `test_clientes`,
  `test_contracts`, `test_http_readonly`, `test_live`,
  `test_plugin_adapters`, `test_plugin_cli`, `test_plugin_installer`,
  `test_plugin_package`, `test_plugin_scope`, `test_plugin_skills`,
  `test_plugin_storage`, `test_plugin_version`, `test_servico_consultas`,
  `test_servidor_mcp`.
- respx → fetch stubbado/injetado; marker `live` → `test.skip` condicional a
  `RUN_LIVE_TESTS=1`.

## Estratégia de migração

Reescrita bottom-up na branch `typescript`, módulo a módulo na ordem de
dependências, trazendo os testes junto em cada passo:

1. Scaffold: `package.json`, `tsconfig.json`, vitest.
2. `shared/` (runtime, http_readonly) + testes.
3. `features/provedores/` + testes.
4. `features/consultas/` + testes.
5. `features/catalogo/` + testes.
6. `features/mcp/` + testes (inclui contrato de envelope).
7. `features/plugin/` + testes.
8. CI, docs e publicação: workflows npm, `docs/agents/*`, README/CHANGELOG.
9. Remoção do Python: `pyproject.toml`, `uv.lock`, `src/` .py, `tests/` .py.

Python e TS coexistem apenas durante o desenvolvimento da branch; o resultado
final na branch não tem Python.

## CI alvo

```text
npm run typecheck    (tsc --noEmit)
npm test             (vitest run, exclui live)
npm run catalogo -- check coverage/endpoints.yaml
npm run build
```

Mantém a checagem estática da fronteira HTTP (sem métodos de escrita) e o
workflow agendado Upstream Drift (agora via `npm run catalogo -- discover
--official --compare ... --fail-on-diff`).

## Fora de escopo

- Qualquer mudança de comportamento, endpoints, ferramentas ou envelope.
- eslint/prettier, bundlers, publishes automáticos novos, suporte a Bun.
