# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o servidor MCP `mcp-compras-publicas-br` de Python para TypeScript sem mudar comportamento observável, removendo Python ao final.

**Architecture:** Mesma arquitetura do spec aprovado (`docs/superpowers/specs/2026-09-07-typescript-migration-design.md`): `tool MCP → QueryService → adaptador de provedor → ReadOnlyHttpClient → API oficial`; plugin `CLI → InstallerService → AgentAdapter`. Reescrita bottom-up, módulo a módulo, com os testes portados 1:1 como especificação comportamental.

**Tech Stack:** Node >= 20, npm, TypeScript strict (NodeNext), `@modelcontextprotocol/sdk`, `zod`, `yaml`, `smol-toml`, `json5`, `vitest`. Fetch nativo injetável.

---

## Regras de execução desta migração (leia antes de qualquer task)

1. **Fonte canônica de conteúdo:** o arquivo Python correspondente (listado em cada task) permanece no repositório até a Fase 11 e É a especificação do comportamento. A task de implementação porta o arquivo Python 1:1 (mesma lógica, mesmas mensagens de erro, mesmos valores de constante), convertendo `snake_case` → `camelCase` apenas em identificadores; chaves de JSON de wire (`source`, `endpoint`, `totalRegistros`, `retrieved_at`, campos do manifesto, nomes de env vars) permanecem **idênticas**.
2. **Contratos:** as assinaturas TypeScript da seção "Contratos compartilhados" abaixo são a verdade de interface. Tasks em paralelo codificam contra elas; nomes/siglas devem bater exatamente.
3. **TDD adaptado para porta:** testes e implementação de um módulo são despachados em paralelo na mesma fase. A task de teste roda os testes e espera FALHA de resolução de módulo (`Cannot find module`) — esse é o red. O green é garantido no **completion gate da fase**, que roda `npm run typecheck` + `npx vitest run` e faz o loop de correção mínimo.
4. **Módulos NodeNext:** imports relativos entre arquivos TS usam extensão `.js` (ex.: `import { logger } from "../shared/runtime.js"`).
5. **Nomes de arquivo de teste:** `test/<nome>.test.ts` porta `tests/<nome>.py` com as MESMAS names de casos de teste (em `describe`/`it`), um `it` por função `test_*`.
6. **Commit por task** apenas do arquivo da task (comando no passo 5 de cada task).
7. **Nenhuma dependência nova** além das listadas em `package.json` (Fase 1).

## Contratos compartilhados (interface truth)

```ts
// src/shared/runtime.ts  (porta src/shared/runtime.py)
export interface Settings {
  comprasBaseUrl: string;            // env COMPRAS_BASE_URL (default https://dadosabertos.compras.gov.br)
  pncpBaseUrl: string;               // env PNCP_BASE_URL    (default https://pncp.gov.br/api/pncp)
  httpTimeout: number;               // env HTTP_TIMEOUT, segundos, >0, finito (default 30)
  httpMaxRetries: number;            // HTTP_MAX_RETRIES, int >0 (default 3)
  httpRequestsPerSecond: number;     // HTTP_REQUESTS_PER_SECOND, int >0 (default 5)
  comprasMaxConcurrency: number;     // COMPRAS_MAX_CONCURRENCY, int >0 (default 4)
  pncpMaxConcurrency: number;        // PNCP_MAX_CONCURRENCY, int >0 (default 4)
  cacheEnabled: boolean;             // CACHE_ENABLED (default true)
  cacheDomainsTtl: number;           // CACHE_DOMAINS_TTL (default 86400)
  cacheCatalogTtl: number;           // CACHE_CATALOG_TTL (default 3600)
  cacheRecentTtl: number;            // CACHE_RECENT_TTL  (default 300)
  cacheHistoricalTtl: number;        // CACHE_HISTORICAL_TTL (default 86400)
  maxDocumentBytes: number;          // MAX_DOCUMENT_BYTES (default 25000000)
  mcpTransport: "stdio" | "http";    // MCP_TRANSPORT (default "stdio")
  logLevel: string;                  // LOG_LEVEL (default "INFO")
}
export function loadSettings(env?: NodeJS.ProcessEnv): Settings; // lança Error com mensagem contendo "must be" nos mesmos casos do pydantic
export class TtlCache {
  constructor(maxEntries?: number);  // default 4096; <=0 → throw Error("max_entries must be positive")
  get<T = unknown>(key: string): T | undefined;
  put(key: string, value: unknown, ttlSeconds: number): void;    // <=0 → throw Error("ttl_seconds must be positive")
}
export function configureLogging(settings?: Settings): void;
export const logger: {
  info(message: string, extra?: Record<string, unknown>): void;
  warn(message: string, extra?: Record<string, unknown>): void;
  error(message: string, extra?: Record<string, unknown>): void;
};

// src/shared/http_readonly.ts  (porta src/shared/http_readonly.py)
export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | JsonValue[] | { [key: string]: JsonValue };
export type QueryParams = Record<string, JsonScalar | JsonScalar[]>;
export class UpstreamError extends Error {
  readonly kind: string;
  readonly status: number | null;
  readonly provider: string | null;
  readonly endpoint: string | null;
  readonly upstreamMessage: string;   // truncado a 4096 chars
  readonly retryable: boolean;
  constructor(kind: string, status: number | null, message: string,
    opts?: { provider?: string; endpoint?: string; upstreamMessage?: string });
  // message do Error = `${kind}: ${message}`
}
export interface ReadOnlyHttpOptions {
  maxRetries?: number;          // default 3
  timeout?: number;             // segundos, default 30
  maxDocumentBytes?: number;    // default 25_000_000
  maxConcurrency?: number;
  requestsPerSecond?: number;
  provider?: string;
  fetchImpl?: typeof globalThis.fetch;   // default globalThis.fetch — ponto de stub dos testes (substitui respx)
}
export class ReadOnlyHttpClient {
  constructor(baseUrl: string, options?: ReadOnlyHttpOptions);
  get(path: string, params?: QueryParams): Promise<JsonValue | string>;
}

// src/features/catalogo/modelos.ts  (porta src/features/catalogo/models.py)
export type Classification =
  | "PUBLIC_USEFUL" | "PUBLIC_NOT_USEFUL" | "AUTHENTICATED"
  | "DEPRECATED" | "BROKEN_UPSTREAM" | "INTERNAL" | "UNKNOWN";
export interface Operation {
  id: string; provider: "compras" | "pncp"; method: "GET"; path: string;
  security: Record<string, string[]>[]; parameters: Record<string, unknown>[];
  description: string; classification: Classification; implemented: boolean;
  tool: string | null;
  [key: string]: unknown;                       // extra="allow" preservado
}
export interface CoverageReport { public_useful: number; implemented: number; ratio: number; [key: string]: unknown }
export interface McpResponse {
  source: string; endpoint: string; query: Record<string, unknown>;
  data: unknown; metadata: Record<string, unknown>; [key: string]: unknown;
}

// src/features/provedores/clientes.ts  (porta src/features/provedores/clientes.py)
export interface NormalizedPage { items: unknown; pagination: Record<string, unknown> }
export interface ProviderClient {
  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient;
}
export abstract class NormalizingClient implements ProviderClient {
  static normalizePage(payload: unknown): NormalizedPage;   // implementado nas subclasses
}
export class ComprasClient extends NormalizingClient {
  static readonly baseUrl = "https://dadosabertos.compras.gov.br";
  static normalizePage(payload: unknown): NormalizedPage;   // item keys "resultado","data"
  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient;
}
export class PncpClient extends NormalizingClient {
  static readonly baseUrl = "https://pncp.gov.br/api/pncp";
  static normalizePage(payload: unknown): NormalizedPage;   // item key "data"
  client(opts?: { maxDocumentBytes?: number }): ReadOnlyHttpClient;
}

// src/features/consultas/servico.ts  (porta src/features/consultas/servico.py)
export function normalizeCnpj(value: string): string;
export function renderPath(template: string, values: Record<string, unknown>): string;
export class QueryService {
  constructor(options?: {
    settings?: Settings; cache?: TtlCache;
    comprasFactory?: new () => NormalizingClient; pncpFactory?: new () => NormalizingClient;
    maxPage?: number; maxPageSize?: number; maxResults?: number; maxDocumentBytes?: number;
  });
  execute(operation: Operation, args: Record<string, unknown>): Promise<McpResponse>;
  executeMany(operations: Operation[], args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// src/features/mcp/servidor.ts  (porta src/features/mcp/servidor.py)
export function buildServer(manifestPath?: string): McpServer;   // import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
export function main(argv?: string[]): Promise<void>;

// src/features/plugin/modelo.ts  (porta src/features/plugin/modelos.py)
export type AgentId = "claude-code" | "codex" | "opencode" | "deepseek-harness" | "pi"
  | "antigravity" | "cursor" | "hermes-agent" | "openclaw" | "generic";
export type ScopeName = "project" | "user";
export interface ScopeTarget { scope: ScopeName; root: string; usedGitRoot: boolean }
export interface McpRegistration { command: string; args: string[]; version: string; managedPackage: string }
export interface OperationResult { changed: boolean; configPath: string; skillPath: string; version: string; warnings: string[] }
export class PluginError extends Error {}
export class ConfigConflictError extends PluginError {}
export class ConfigFormatError extends PluginError {}

// src/features/plugin/escopo.ts
export function findProjectRoot(start: string): string | null;
export function resolveScope(scope: ScopeName, start: string, home?: string): ScopeTarget;

// src/features/plugin/versoes.ts
export const PACKAGE_NAME = "mcp-compras-publicas-br";
export const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}`;
export function installedVersion(): string;                       // versão do package.json em execução (createRequire(import.meta.url))
export function versionedCommand(version: string): string[];      // ["npx", "-y", `${PACKAGE_NAME}@${version}`]
export function latestStableVersion(fetcher?: () => Promise<unknown>): Promise<string>;

// src/features/plugin/habilidades.ts  (porta skills.py; template em src/features/plugin/templates/skill.md)
export function renderSkill(agentId: string, agentName: string, scope: ScopeName): string;
export function isManagedSkill(path: string): boolean;
export function writeManagedSkill(path: string, agentId: string, agentName: string, scope: ScopeName): boolean;
export function removeManagedSkill(path: string): boolean;

// src/features/plugin/armazenamento.ts
export type FormatName = "json" | "json5" | "toml";
export function loadDocument(path: string, format: FormatName): Record<string, unknown>;
export function dumpDocument(document: Record<string, unknown>, format: FormatName): string;
export function atomicWrite(path: string, content: string): void;
export function mergeMcpEntry(...): Record<string, unknown>;      // mesma aridade/semântica de merge_mcp_entry em armazenamento.py
export function removeMcpEntry(...): Record<string, unknown>;

// src/features/plugin/adaptadores.ts
export interface AgentAdapter {
  agentId: AgentId;
  configPath(target: ScopeTarget): string;
  format: FormatName;
  registration(version: string): McpRegistration;
  entryFor(entryName: string, registration: McpRegistration): Record<string, unknown>;
  skillPath(target: ScopeTarget): string;
  agentName: string;
  validationCommand: string[] | null;
}
export function getAdapter(agentId: string): AgentAdapter;
export function supportedAgentIds(): AgentId[];

// src/features/plugin/instalador.ts
export class InstallerService {
  constructor(adapter: AgentAdapter, target: ScopeTarget,
    versionResolver: () => string | Promise<string>);
  install(): Promise<OperationResult>;
  update(): Promise<OperationResult>;
  uninstall(): Promise<OperationResult>;
}

// src/index.ts — bin do pacote
// argv[2]==="catalogo" → catalogo main(argv.slice(2)); argv[2]==="plugin" → plugin cli main(argv.slice(2));
// sem args → servidor MCP no transporte de Settings().mcpTransport.
```

Regra de nomes exportados em `catalogo.ts`: camelCase exato dos nomes públicos de `catalogo.py` (`load_openapi` → `loadOpenApi`, `classify_operations` → `classifyOperations`, `compare_catalogs` → `compareCatalogs` etc.). O que `test_catalogo.py`/`test_contracts.py` importam deve ser exportado.

## Mapa de arquivos (Python → TypeScript → teste)

| Python (fonte canônica) | TypeScript (alvo) | Teste TS (porta `tests/*.py`) |
| --- | --- | --- |
| `src/shared/runtime.py` | `src/shared/runtime.ts` | `test/http_readonly.test.ts` (cobre `TtlCache`) |
| `src/shared/http_readonly.py` | `src/shared/http_readonly.ts` | `test/http_readonly.test.ts` |
| `src/features/catalogo/models.py` | `src/features/catalogo/modelos.ts` | via `test/contracts.test.ts` |
| `src/features/provedores/clientes.py` | `src/features/provedores/clientes.ts` | `test/clientes.test.ts` |
| `src/features/consultas/servico.py` | `src/features/consultas/servico.ts` | `test/servico_consultas.test.ts` |
| `src/features/catalogo/catalogo.py` | `src/features/catalogo/catalogo.ts` | `test/catalogo.test.ts` |
| `src/features/mcp/servidor.py` | `src/features/mcp/servidor.ts` | `test/servidor_mcp.test.ts`, `test/contracts.test.ts`, `test/live.test.ts` |
| — | `src/index.ts` | via `test/servidor_mcp.test.ts` |
| `src/features/plugin/modelos.py` | `src/features/plugin/modelo.ts` | (tipos; coberto pelos demais) |
| `src/features/plugin/escopo.py` | `src/features/plugin/escopo.ts` | `test/plugin_scope.test.ts` |
| `src/features/plugin/versoes.py` | `src/features/plugin/versoes.ts` | `test/plugin_version.test.ts` |
| `src/features/plugin/skills.py` + `templates/skill.md` | `src/features/plugin/habilidades.ts` + `src/features/plugin/templates/skill.md` | `test/plugin_skills.test.ts` |
| `src/features/plugin/armazenamento.py` | `src/features/plugin/armazenamento.ts` | `test/plugin_storage.test.ts` |
| `src/features/plugin/adaptadores.py` | `src/features/plugin/adaptadores.ts` | `test/plugin_adapters.test.ts` |
| `src/features/plugin/instalador.py` | `src/features/plugin/instalador.ts` | `test/plugin_installer.test.ts` |
| `src/features/plugin/cli.py` | `src/features/plugin/cli.ts` | `test/plugin_cli.test.ts` |
| `pyproject.toml` (metadados) | `package.json` | `test/package.test.ts` |

---

## Phase 1: Scaffold npm

**Entry criteria:** branch `typescript` ativa; Node >= 20 e npm disponíveis; nenhum arquivo TS existe ainda.

**Parallel dispatch:** despachar as 6 tasks abaixo juntas.

**Completion gate:** `npm install` sem erro; `npx vitest run` → `test/scaffold.test.ts` PASSA; `npx tsc --noEmit` exit 0.

### Task 1.1: `package.json`

**Files:**
- Create exactly one file: `package.json`

- [ ] **Step 1: Criar `package.json`** com exatamente:

```json
{
  "name": "mcp-compras-publicas-br",
  "version": "0.1.0",
  "description": "MCP somente leitura para APIs públicas de compras brasileiras",
  "type": "module",
  "license": "MIT",
  "engines": { "node": ">=20" },
  "bin": { "mcp-compras-publicas-br": "dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "tsc && node scripts/postbuild.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "catalogo": "npm run build --silent && node dist/index.js catalogo",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.13.0",
    "json5": "^2.2.3",
    "smol-toml": "^1.3.1",
    "yaml": "^2.7.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Rodar `npm install`** — esperado: exit 0, `package-lock.json` criado (o lock será commitado na task 1.4 com o `.gitignore`).
- [ ] **Step 3: Commit** — `git add package.json; git commit -m "chore: scaffold package.json"` (faça no gate; se outro task rodar o install primeiro, apenas commit o arquivo).

### Task 1.2: `tsconfig.json`

**Files:**
- Create exactly one file: `tsconfig.json`

- [ ] **Step 1: Criar** com exatamente:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": false
  },
  "include": ["src"]
}
```

Nota: `include` é só `src`; os testes rodam pelo vitest (que compila por conta), o typecheck cobre `src`.
- [ ] **Step 2: Commit** — `git add tsconfig.json; git commit -m "chore: scaffold tsconfig"`

### Task 1.3: `vitest.config.ts`

**Files:**
- Create exactly one file: `vitest.config.ts`

- [ ] **Step 1: Criar** com exatamente:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
```

- [ ] **Step 2: Commit** — `git add vitest.config.ts; git commit -m "chore: scaffold vitest"`

### Task 1.4: `.gitignore` + lockfile

**Files:**
- Modify exactly one file: `.gitignore`

- [ ] **Step 1:** Adicionar ao final do `.gitignore` existente: `node_modules/` e `dist/`.
- [ ] **Step 2:** `git add .gitignore package-lock.json; git commit -m "chore: gitignore node artifacts"` (inclui `package-lock.json` gerado pelo install da task 1.1 — se ainda não existir, aguarde o install do gate e adicione-o aqui).

### Task 1.5: `scripts/postbuild.mjs`

**Files:**
- Create exactly one file: `scripts/postbuild.mjs`

- [ ] **Step 1: Criar** com exatamente:

```js
import { cpSync, readFileSync, writeFileSync } from "node:fs";

const bin = "dist/index.js";
writeFileSync(bin, "#!/usr/bin/env node\n" + readFileSync(bin, "utf8"));
cpSync("src/features/plugin/templates", "dist/features/plugin/templates", { recursive: true });
```

Motivo: shebang do bin (tsc não preserva) e cópia do template da skill para `dist`.
- [ ] **Step 2: Commit** — `git add scripts/postbuild.mjs; git commit -m "chore: postbuild shebang e templates"`

### Task 1.6: `test/scaffold.test.ts`

**Files:**
- Create exactly one file: `test/scaffold.test.ts`

- [ ] **Step 1: Criar** o smoke test:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("scaffold", () => {
  it("expõe nome e versão do pacote", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.name).toBe("mcp-compras-publicas-br");
    expect(pkg.bin["mcp-compras-publicas-br"]).toBe("dist/index.js");
  });
});
```

- [ ] **Step 2: Rodar `npx vitest run`** — esperado: 1 PASS.
- [ ] **Step 3: Commit** — `git add test/scaffold.test.ts; git commit -m "test: smoke test do scaffold"`

---

## Phase 2: Camada compartilhada (runtime, modelos, HTTP somente leitura)

**Entry criteria:** gate da Fase 1 verde.

**Parallel dispatch:** as 5 tasks abaixo juntas. `http_readonly` depende de `runtime` apenas via contratos acima (mesma fase é segura porque os contratos estão travados).

**Completion gate:** `npx tsc --noEmit` exit 0; `npx vitest run test/http_readonly.test.ts` PASSA (todos os casos portados de `tests/test_http_readonly.py` + `TtlCache`).

### Task 2.1: `src/shared/runtime.ts`

**Files:**
- Create exactly one file: `src/shared/runtime.ts`

**Source canônica:** `src/shared/runtime.py` (porta completa: redação de segredos, logger JSON, `Settings`, `TtlCache`).

**Notas de porta:**
- `loadSettings(env = process.env)`: tentar `process.loadEnvFile(".env")` dentro de try/catch silencioso antes de ler o env. Nomes de env exatos: `COMPRAS_BASE_URL`, `PNCP_BASE_URL`, `HTTP_TIMEOUT`, `HTTP_MAX_RETRIES`, `HTTP_REQUESTS_PER_SECOND`, `COMPRAS_MAX_CONCURRENCY`, `PNCP_MAX_CONCURRENCY`, `CACHE_ENABLED`, `CACHE_DOMAINS_TTL`, `CACHE_CATALOG_TTL`, `CACHE_RECENT_TTL`, `CACHE_HISTORICAL_TTL`, `MAX_DOCUMENT_BYTES`, `MCP_TRANSPORT`, `LOG_LEVEL`.
- Validações idênticas ao pydantic: inteiros rejeitam bool/float (`must be an integer`), timeout bool → `must be numeric seconds`, timeout não-finito → `must be finite`, todos `> 0`; `MCP_TRANSPORT` apenas `stdio|http`.
- `TtlCache`: usar `performance.now()` (monotônico); eviction do primeiro inserido (Map preserva ordem de inserção).
- `logger`: uma linha JSON por registro em **stderr** (`process.stderr.write`), campos `timestamp` (ISO com `Z`), `level`, `name` (constante `"compras-publicas-br"`), `message` + extras permitidos (`request_id`, `provider`, `tool`, `endpoint`, `duration_ms`, `status_code`, `retry_count`, `cache_hit`); regexes de redação (`_SENSITIVE_KEY`, `_SENSITIVE_MESSAGE`) portadas 1:1 (prefixar flags `/i` do JS; grupos nomeados existem no JS), limite de mensagem 2048 com `...`, redação `[REDACTED]` inclusive de JSON embutido em string (`raw_decode` → scanner manual que tenta `JSON.parse` em substrings a partir de `{`/`[`).

- [ ] **Step 1:** Implementar o arquivo contra os contratos.
- [ ] **Step 2:** `npx tsc --noEmit` — esperado: 0 erros.
- [ ] **Step 3:** Commit — `git add src/shared/runtime.ts; git commit -m "feat: runtime (settings, ttl cache, logging redigido)"`

### Task 2.2: `src/features/catalogo/modelos.ts`

**Files:**
- Create exactly one file: `src/features/catalogo/modelos.ts`

**Source canônica:** `src/features/catalogo/models.py`.

**Notas de porta:** interfaces da seção de contratos; adicionar `const OperationSchema = z.looseObject`-equivalente: usar `z.object({...}).passthrough()` (zod 3: `.passthrough()`) apenas para parse do manifesto em catalogo.ts; `Classification` exatamente os 7 valores; `CoverageReport`/`McpResponse` como interfaces com chaves wire em snake_case.

- [ ] **Step 1:** Implementar. **Step 2:** `npx tsc --noEmit` → 0 erros. **Step 3:** `git add src/features/catalogo/modelos.ts; git commit -m "feat: modelos do catálogo (Operation, McpResponse, CoverageReport)"`

### Task 2.3: `src/shared/http_readonly.ts`

**Files:**
- Create exactly one file: `src/shared/http_readonly.ts`

**Source canônica:** `src/shared/http_readonly.py` (completa: whitelist, validação de path, retry+jitter, rate limit, limite de bytes, classificação de erro).

**Notas de porta:**
- `_relative_path`: portar 1:1 (decodificação `decodeURIComponent` em loop, rejeitar scheme/netloc/`//` inicial/query/fragmento/`\\`/segmento `..`; erro com a mesma mensagem `path must be relative to the fixed upstream origin`).
- Validação de `baseUrl`: `new URL`, `protocol === "https:"`, hostname em `{dadosabertos.compras.gov.br, pncp.gov.br}` minúsculo, porta `null` ou `443`, sem user/password/query/hash — mesmas mensagens de `ValueError`.
- Retry: `for attempt 0..maxRetries`, retry em `429|502|503|504`, timeout (`AbortSignal.timeout(timeout*1000)` capturando `TimeoutError`/`AbortError` da fetch) e falha de rede; backoff `0.2 * 2^attempt + rand(0, 0.1*delay)`; 404 → `NOT_FOUND` sem retry; ≥300 → `_error_kind` (`UPSTREAM_RATE_LIMIT`/`UPSTREAM_UNAVAILABLE`/`UPSTREAM_BAD_REQUEST`).
- Leitura limitada: checar header `content-length`; iterar `response.body` (Uint8Array) somando bytes e lançar `DOCUMENT_TOO_LARGE` ao exceder `maxDocumentBytes`.
- JSON: content-type `application/json` ou `+json` → `JSON.parse`, falha → `UPSTREAM_SCHEMA_CHANGED`; senão texto com charset do content-type, `TextDecoder` com `fatal: false` (equivalente `errors="replace"`).
- Rate limit/concurrency: semaphore + `nextRequestAt` por origem, compartilhados por origem dentro do processo (Map módulo-level keyed por `origin` — equivalente do WeakKey por event loop).
- `logger.info("upstream request", {request_id, provider, endpoint: sha256(endpoint), duration_ms, status_code, retry_count, cache_hit:false})` a cada tentativa (`node:crypto` `createHash`).
- `fetchImpl` default `globalThis.fetch.bind(globalThis)`.

- [ ] **Step 1:** Implementar. **Step 2:** `npx tsc --noEmit` → 0 erros. **Step 3:** `git add src/shared/http_readonly.ts; git commit -m "feat: ReadOnlyHttpClient com fetch injetável"`

### Task 2.4: `test/support/stub_fetch.ts`

**Files:**
- Create exactly one file: `test/support/stub_fetch.ts`

**Propósito:** substituto do `respx` para todas as tasks de teste.

- [ ] **Step 1: Criar** com exatamente:

```ts
export interface StubCall { url: string; init: RequestInit }
export type StubHandler = (url: URL, init: RequestInit) => Response | undefined | Promise<Response | undefined>;

export function stubFetch(...routes: [RegExp | string, Response | ((url: URL, init: RequestInit) => Response)][]) {
  const handlerMap = routes.map(([matcher, response]) => ({ matcher, response }));
  const calls: StubCall[] = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : input.url;
    const url = new URL(raw);
    calls.push({ url: raw, init });
    for (const { matcher, response } of handlerMap) {
      const hit = matcher instanceof RegExp ? matcher.test(raw) : raw.startsWith(matcher);
      if (hit) return typeof response === "function" ? response(url, init) : response;
    }
    throw new TypeError(`no stub for ${raw}`);   // falha de rede simulada
  }) as unknown as typeof globalThis.fetch;
  return { fetchImpl, calls };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function textResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain", ...headers } });
}
```

- [ ] **Step 2:** `npx vitest run test/scaffold.test.ts` — esperado: continua 1 PASS (arquivo novo não quebra nada).
- [ ] **Step 3:** `git add test/support/stub_fetch.ts; git commit -m "test: stub de fetch substituindo respx"`

### Task 2.5: `test/http_readonly.test.ts`

**Files:**
- Create exactly one file: `test/http_readonly.test.ts`

**Source canônica:** `tests/test_http_readonly.py` (portar 1:1, um `it` por `test_*`).

**Notas de porta:** cada fixture `@pytest.mark.asyncio` vira `it(..., async () => ...)`; mocks respx → `stubFetch` de `test/support/stub_fetch.js`; `httpx.TimeoutException` → handler que rejeita `TypeError("fetch failed")` (rede) ou um handler que nunca resolve + `timeout: 0.01`; asserts de `UpstreamError` via `await expect(...).rejects.toThrow` + cast para checar `.kind`/`.status`/`.retryable`; asserts de `TtlCache` (importar de `src/shared/runtime.js`). **Para stubs, usar sempre hosts oficiais** (`https://dadosabertos.compras.gov.br/...`, `https://pncp.gov.br/...`) porque a whitelist é validada no construtor.

- [ ] **Step 1:** Portar todos os casos. **Step 2:** `npx vitest run test/http_readonly.test.ts` — esperado: FAIL `Cannot find module` se a task 2.3 ainda não terminou (red válido); verde no gate. **Step 3:** `git add test/http_readonly.test.ts; git commit -m "test: porta de test_http_readonly"`

---

## Phase 3: Provedores e consultas

**Entry criteria:** gate da Fase 2 verde.

**Parallel dispatch:** 4 tasks juntas.

**Completion gate:** `npx tsc --noEmit` exit 0; `npx vitest run test/clientes.test.ts test/servico_consultas.test.ts` PASSA.

### Task 3.1: `src/features/provedores/clientes.ts`

**Files:**
- Create exactly one file: `src/features/provedores/clientes.ts`

**Source canônica:** `src/features/provedores/clientes.py` (`_normalize_page` com `_PAGINATION_KEYS` idênticos — chaves wire PT→snake_case normalizado; `client()` monta `ReadOnlyHttpClient` com opções vindas de `loadSettings()`; validação `max_document_bytes must be positive`).

**Nota:** `fetchImpl` não é setado aqui (produção usa fetch real). Manter chaves normalizadas `total_items/total_pages/page/page_size`.

- [ ] **Step 1:** Implementar. **Step 2:** typecheck 0 erros. **Step 3:** `git add src/features/provedores/clientes.ts; git commit -m "feat: clientes Compras/PNCP"`

### Task 3.2: `src/features/consultas/servico.ts`

**Files:**
- Create exactly one file: `src/features/consultas/servico.ts`

**Source canônica:** `src/features/consultas/servico.py` (804 linhas — porta COMPLETA: `normalize_cnpj`, `render_path`, `QueryService` com validação de parâmetros, paginação/`auto_paginar`/tokens, cache SHA-256, TTLs por categoria, `_file_size_response`, `_content_size`, envelopes).

**Notas de porta:**
- Constantes: `_DEFAULT_RESULT_LIMIT=100`, `_DEFAULT_MAX_PAGE=10000`, `_DEFAULT_MAX_PAGE_SIZE=1000`, `_FORMAT_VALUES={"normalizado","original"}`, aliases de paginação e nomes de token exatamente os da fonte.
- Erros: lançar `Error` com as MESMAS mensagens (`only GET operations are supported`, `formato must be one of: normalizado, original`, `auto_paginar must be a boolean`, `... must be a positive integer` etc.) — os testes portados assertam por substring.
- Cache: chave = `createHash("sha256")` de `provider|operationId|renderedPath|JSON ordenado deterministicamente` (ordenar chaves recursivamente antes do `JSON.stringify`) — portar `_cache_key` fielmente; TTLs via `Settings` (`cache_domains_ttl` etc.).
- `execute` retorna objeto `McpResponse` com `metadata.retrieved_at` = `new Date().toISOString()`.
- `executeMany` retorna `Record<tool-or-id, plain object>` (equivalente `model_dump(mode="json")`).
- `normalizeCnpj`: remover não-dígitos, validar 11 dígitos e dígitos verificadores (portar algoritmo do Python exatamente), erro com mesma mensagem.

- [ ] **Step 1:** Implementar (arquivo grande; nada de stubs — cada método privado de `servico.py` tem correspondente privado). **Step 2:** typecheck 0 erros. **Step 3:** `git add src/features/consultas/servico.ts; git commit -m "feat: QueryService (validação, paginação, cache, proveniência)"`

### Task 3.3: `test/clientes.test.ts`

**Files:**
- Create exactly one file: `test/clientes.test.ts`

**Source canônica:** `tests/test_clientes.py` (1:1; `normalize_page` dos dois clientes + montagem de `client()`; asserts de base_url fixa).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate (red antes = `Cannot find module`). **Step 3:** `git add test/clientes.test.ts; git commit -m "test: porta de test_clientes"`

### Task 3.4: `test/servico_consultas.test.ts`

**Files:**
- Create exactly one file: `test/servico_consultas.test.ts`

**Source canônica:** `tests/test_servico_consultas.py` (portar 1:1: `normalize_cnpj`, `render_path`; se houver casos com HTTP, usar `stubFetch`).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/servico_consultas.test.ts; git commit -m "test: porta de test_servico_consultas"`

---

## Phase 4: Catálogo OpenAPI

**Entry criteria:** gate da Fase 3 verde.

**Parallel dispatch:** 2 tasks juntas (a maior task da migração é 4.1 — ~1500 linhas de CLI/contratos).

**Completion gate:** `npx tsc --noEmit` 0 erros; `npx vitest run test/catalogo.test.ts` PASSA; `npm run catalogo -- check coverage/endpoints.yaml` exit 0 (paridade com o gate Python atual).

### Task 4.1: `src/features/catalogo/catalogo.ts`

**Files:**
- Create exactly one file: `src/features/catalogo/catalogo.ts`

**Source canônica:** `src/features/catalogo/catalogo.py` (COMPLETO: `load_openapi`, resolução de `$ref` local com detecção de ref externo, `classify_operations`, canonicalização, `compare_catalogs` com `CatalogChange/CatalogDiff` e impactos, `_semantic_changes`, validação do manifesto, check de completude, nomes de ferramenta sugeridos/overrides, render tools/coverage, subcomandos CLI `discover|compare|check|render-tools|render-coverage|check-tools|check-coverage` do `_parser()`).

**Notas de porta:**
- YAML: `import { parse, stringify } from "yaml"`; OpenAPI JSON: `JSON.parse(readFileSync)`.
- CLI: parse manual de `process.argv` replicando flags do `_parser()` (`--official`, `--compare`, `--fail-on-diff`, `--output`, paths posicionais, `--check` como 1º arg posicional legacy: `node dist/index.js catalogo --check <file>` deve funcionar como hoje `--check`).
- `TOOL_NAME_OVERRIDES`, `TOOL_NAME_RE = /^(compras|pncp)_[a-z0-9_]+$/`, `CLASSIFICATIONS`, `CURATION_FIELDS`, `UNORDERED_LIST_FIELDS`, `_NON_ATOMIC_TOOL_NAMES`: copiar valores 1:1.
- `main(argv = process.argv.slice(2)): Promise<number>` — código de saída idêntico (0 ok, 1 diff/erro de validação).
- Comparação canônica: ordenar arrays de `enum`/`required` antes de comparar (mesma semântica de `UNORDERED_LIST_FIELDS`).
- Sem dependência do `ReadOnlyHttpClient`: o modo `--official` usa `fetch` global direto na URL fixa (a whitelist do http client não se aplica ao discovery CLI; manter as duas URLs fixas `DEFAULT_OFFICIAL_URLS` exatamente do Python).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck 0 erros. **Step 3:** `git add src/features/catalogo/catalogo.ts; git commit -m "feat: catálogo OpenAPI (discover/compare/check/render)"`

### Task 4.2: `test/catalogo.test.ts`

**Files:**
- Create exactly one file: `test/catalogo.test.ts`

**Source canônica:** `tests/test_catalogo.py` (1:1; fixtures de spec OpenAPI inline como objetos; paths via `fs.mkdtempSync`; asserts dos mesmos códigos de saída/mensagens).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/catalogo.test.ts; git commit -m "test: porta de test_catalogo"`

---

## Phase 5: Servidor MCP

**Entry criteria:** gate da Fase 4 verde (manifesto checkável via TS já disponível).

**Parallel dispatch:** 5 tasks juntas.

**Completion gate:** `npx tsc --noEmit` 0 erros; `npx vitest run test/servidor_mcp.test.ts test/contracts.test.ts` PASSA; `npm run catalogo -- check coverage/endpoints.yaml` continua exit 0.

### Task 5.1: `src/features/mcp/servidor.ts`

**Files:**
- Create exactly one file: `src/features/mcp/servidor.ts`

**Source canônica:** `src/features/mcp/servidor.py` (COMPLETO: carga do manifesto, `openapi_parameters_to_json_schema`, elegibilidade, tools atômicas, tools compostas (`_register_composites`, busca federada com overlap marker), recursos (`mcp://coverage`, `compras://coverage|providers|endpoints|domains`, `pncp://domains|api-version`), envelope de erro `_upstream_error_envelope`, redação `_SENSITIVE_ERROR_VALUE`, `main` com transporte).

**Notas de porta:**
- `new McpServer({ name: "mcp-compras-publicas-br", version: <package.json version> })`; registrar tools com `server.registerTool(name, { description, inputSchema: jsonSchemaObject }, handler)` — o SDK aceita JSON Schema (ver `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts`; se a versão instalada exigir zod shape, converter o schema do manifesto com um mini-conversor local **neste mesmo arquivo**: `string→z.string().optional()` etc.).
- Handler: chama `QueryService.execute/executeMany`, captura `UpstreamError` → envelope de erro idêntico ao Python (`{ error: { kind, status, message, upstream_message, provider, endpoint } }` com `isError: true` no resultado MCP — seguir exatamente o shape de `_upstream_error_envelope`).
- Transporte: `stdio` = `new StdioServerTransport()`; `http` = `StreamableHTTPServerTransport` sobre `node:http` na porta `process.env.PORT ?? 8000`.
- `openapiParametersToJsonSchema`: mesmos tipos/enum/required/description; propriedades extras `formato/auto_paginar/limite_resultados` adicionadas quando a operação é de lista (copiar lógica do Python).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck 0 erros. **Step 3:** `git add src/features/mcp/servidor.ts; git commit -m "feat: servidor MCP (tools atômicas, compostas e recursos)"`

### Task 5.2: `src/index.ts`

**Files:**
- Create exactly one file: `src/index.ts`

- [ ] **Step 1: Criar** o dispatcher do bin:

```ts
import { main as catalogoMain } from "./features/catalogo/catalogo.js";
import { main as pluginMain } from "./features/plugin/cli.js";
import { main as servidorMain } from "./features/mcp/servidor.js";

const argv = process.argv.slice(2);
const command = argv[0];
const code =
  command === "catalogo" ? await catalogoMain(argv.slice(1))
  : command === "plugin" ? pluginMain(argv.slice(2))
  : (await servidorMain(argv), 0);
if (typeof code === "number" && code !== 0) process.exitCode = code;
```

**Nota de ordem:** este arquivo referencia `plugin/cli.js` (Fase 7). Para a Fase 5 compilar, crie `src/index.ts` SEM o ramo `plugin` (comentário `// ponytail: ramo plugin entra na task 7.4`) e a task 7.4 adiciona o ramo. O contrato final é o acima.
- [ ] **Step 2:** `npm run build` — esperado: `dist/index.js` criado com shebang. **Step 3:** `git add src/index.ts; git commit -m "feat: bin dispatcher (servidor|catalogo)"`

### Task 5.3: `test/servidor_mcp.test.ts`

**Files:**
- Create exactly one file: `test/servidor_mcp.test.ts`

**Source canônica:** `tests/test_servidor_mcp.py` (1:1).

**Notas de porta:** `fastmcp Client` + `Client.create_connected_session` → SDK:

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
const [ca, cb] = InMemoryTransport.createLinkedPair();
await server.connect(cb);
const client = new Client({ name: "test", version: "0.0.0" });
await client.connect(ca);
```

`list_tools`/`call_tool`/`read_resource` → `client.listTools()`/`client.callTool(...)`/`client.readResource(...)`; asserts de nome de tool, schema e conteúdo de recurso idênticos.

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/servidor_mcp.test.ts; git commit -m "test: porta de test_servidor_mcp"`

### Task 5.4: `test/contracts.test.ts`

**Files:**
- Create exactly one file: `test/contracts.test.ts`

**Source canônica:** `tests/test_contracts.py` (1:1: contrato de envelope `McpResponse`, proveniência, erros upstream via respx→`stubFetch`, manifesto real `coverage/endpoints.yaml`, `build_server` in-memory).

**Notas de porta:** usar `stubFetch` com clientes stubados passados via `comprasFactory/pncpFactory` do `QueryService` (equivalente ao monkeypatch do pytest); o `SimpleNamespace` do python vira objeto literal.

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/contracts.test.ts; git commit -m "test: porta de test_contracts (contratos de envelope)"`

### Task 5.5: `test/live.test.ts`

**Files:**
- Create exactly one file: `test/live.test.ts`

**Source canônica:** `tests/test_live.py` (1:1).

**Notas de porta:**

```ts
const live = process.env.RUN_LIVE_TESTS === "1" ? it : it.skip;
live("endpoints oficiais respondem", async () => { /* mesmas duas sondas do python */ });
```

- [ ] **Step 1:** Portar. **Step 2:** `npx vitest run test/live.test.ts` → skipped sem `RUN_LIVE_TESTS`. **Step 3:** `git add test/live.test.ts; git commit -m "test: porta de test_live (opt-in)"`

---

## Phase 6: Plugin — base (modelo, escopo, versões, skill)

**Entry criteria:** gate da Fase 5 verde.

**Parallel dispatch:** 8 tasks juntas.

**Completion gate:** `npx tsc --noEmit` 0 erros; `npx vitest run test/plugin_scope.test.ts test/plugin_version.test.ts test/plugin_skills.test.ts` PASSA.

### Task 6.1: `src/features/plugin/modelo.ts`

**Files:**
- Create exactly one file: `src/features/plugin/modelo.ts`

**Source canônica:** `src/features/plugin/modelos.py` — interfaces/classes da seção de contratos; caminhos como `string`; `as_mapping()` não é portado (montagem inline no adaptador, como em `adaptadores.py`).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/modelo.ts; git commit -m "feat: modelos do plugin"`

### Task 6.2: `src/features/plugin/escopo.ts`

**Files:**
- Create exactly one file: `src/features/plugin/escopo.ts`

**Source canônica:** `src/features/plugin/escopo.py` (procura `.git` dir OU file subindo diretórios; warning em PT: `Git não encontrado; usando o diretório atual.` via `logger.warn`).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/escopo.ts; git commit -m "feat: resolução de escopo project/user"`

### Task 6.3: `src/features/plugin/versoes.ts`

**Files:**
- Create exactly one file: `src/features/plugin/versoes.ts`

**Source canônica:** `src/features/plugin/versoes.py`, com a mudança de comportamento aprovada no spec:

- `installedVersion()`: `createRequire(import.meta.url)("../../package.json").version` — resolver do diretório do pacote (subir até achar `package.json` com `name === PACKAGE_NAME` para funcionar também empacotado).
- `versionedCommand(version)` → `["npx", "-y", `${PACKAGE_NAME}@${version}`]` (substitui `uvx --from pkg==v pkg`).
- `latestStableVersion(fetcher = fetchRegistry)`: buscar `REGISTRY_URL`; pegar `dist-tags.latest`; rejeitar pré-release (contains `-`); `PluginError` com mensagens análogas (`Could not fetch package releases`, `No stable package release was found`). `fetcher` injetável retorna `Promise<unknown>` (stub nos testes).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/versoes.ts; git commit -m "feat: versões via npm registry (npx pin exato)"`

### Task 6.4: `src/features/plugin/templates/skill.md`

**Files:**
- Create exactly one file: `src/features/plugin/templates/skill.md`

- [ ] **Step 1:** Copiar byte-a-byte de `src/features/plugin/templates/skill.md` (o template Python já existe e é a fonte canônica; `git cp`/`Copy-Item`, sem edições).
- [ ] **Step 2:** `git add src/features/plugin/templates/skill.md; git commit -m "feat: template da skill gerenciada (cópia TS)"`

### Task 6.5: `src/features/plugin/habilidades.ts`

**Files:**
- Create exactly one file: `src/features/plugin/habilidades.ts`

**Source canônica:** `src/features/plugin/skills.py` (`MANAGED_MARKER` e `_COMMENTED_MARKER` idênticos; template lido via `new URL("./templates/skill.md", import.meta.url)`; renderização substitui os placeholders exatamente como o `.format` do python — verificar placeholders no template da task 6.4).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/habilidades.ts; git commit -m "feat: skill gerenciada (render/write/remove)"`

### Task 6.6: `test/plugin_scope.test.ts`

**Files:**
- Create exactly one file: `test/plugin_scope.test.ts`

**Source canônica:** `tests/test_plugin_scope.py` (1:1; `fs.mkdtempSync` + criar `.git` dir/file fake; o case de logging → espião simples substituindo `logger.warn` por objeto com flag).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_scope.test.ts; git commit -m "test: porta de test_plugin_scope"`

### Task 6.7: `test/plugin_version.test.ts`

**Files:**
- Create exactly one file: `test/plugin_version.test.ts`

**Source canônica:** `tests/test_plugin_version.py` (1:1; fetcher stubado retorna doc do npm registry no lugar do doc do PyPI — adaptar a fixture para `{ "dist-tags": { "latest": "1.2.3" } }` e pré-release `{ latest: "2.0.0-beta.1" }` → error; `versionedCommand` → asserts `["npx","-y","mcp-compras-publicas-br@1.2.3"]`).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_version.test.ts; git commit -m "test: porta de test_plugin_version"`

### Task 6.8: `test/plugin_skills.test.ts`

**Files:**
- Create exactly one file: `test/plugin_skills.test.ts`

**Source canônica:** `tests/test_plugin_skills.py` (1:1: `render_skill` contém marcador/agent/scope; `is_managed_skill` só com marcador; `write/remove` idempotentes; arquivo não-gerenciado não é sobrescrito/removido).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_skills.test.ts; git commit -m "test: porta de test_plugin_skills"`

---

## Phase 7: Plugin — núcleo (armazenamento, adaptadores, instalador, CLI)

**Entry criteria:** gate da Fase 6 verde.

**Parallel dispatch:** 8 tasks juntas.

**Completion gate:** `npx tsc --noEmit` 0 erros; `npx vitest run test/plugin_storage.test.ts test/plugin_adapters.test.ts test/plugin_installer.test.ts test/plugin_cli.test.ts` PASSA; `npm run build && node dist/index.js plugin install --help` imprime usage com os 10 agentes.

### Task 7.1: `src/features/plugin/armazenamento.ts`

**Files:**
- Create exactly one file: `src/features/plugin/armazenamento.ts`

**Source canônica:** `src/features/plugin/armazenamento.py` (load/dump json|json5|toml via `JSON`/`json5`/`smol-toml`; `ConfigFormatError` com mesmas mensagens; `merge_mcp_entry`/`remove_mcp_entry` com a mesma aridade — portar assinatura completa do python; `atomic_write`: `fs.writeFileSync` para `path.tmp-<rand>` + `fs.renameSync`, preservando modo do arquivo original quando existir).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/armazenamento.ts; git commit -m "feat: armazenamento atômico json/json5/toml"`

### Task 7.2: `src/features/plugin/adaptadores.ts`

**Files:**
- Create exactly one file: `src/features/plugin/adaptadores.ts`

**Source canônica:** `src/features/plugin/adaptadores.py` (os 10 adapters com paths/format/entry_style/skill paths EXATOS do python; `_owns_command` passa a reconhecer o pin npm: `command === "npx"` e args contém `mcp-compras-publicas-br@<versão estável>`; `_is_stable_pin` idem para versão npm; validações de ownership/paths portadas 1:1; `registration(version)` monta `{ command: "npx", args: ["-y", pkg@v], ... }` conforme os entry styles `generic|opencode|cursor|command_args`).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/adaptadores.ts; git commit -m "feat: adaptadores de agentes (npx pin)"`

### Task 7.3: `src/features/plugin/instalador.ts`

**Files:**
- Create exactly one file: `src/features/plugin/instalador.ts`

**Source canônica:** `src/features/plugin/instalador.py` (fusões/validações `_MISSING/_CONFLICT`, avisos com mesmas strings — inclusive `Conflict preserved`, escrita atômica da config + skill gerenciada, `uninstall` só remove o que é gerenciado).

**Nota:** resolver de versão pode ser async (`update` usa `latestStableVersion`); `install/update/uninstall` retornam `Promise<OperationResult>` (contrato).

- [ ] **Step 1:** Implementar. **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/instalador.ts; git commit -m "feat: InstallerService (merge/update/uninstall atômico)"`

### Task 7.4: `src/features/plugin/cli.ts` + ramo no bin

**Files:**
- Modify exactly one file: `src/features/plugin/cli.ts`

**Source canônica:** `src/features/plugin/cli.py`.

- [ ] **Step 1:** Implementar `main(argv: string[]): number` com parse manual equivalente ao argparse (`install|update|uninstall`, `--agent` obrigatório com choices dos 10 agentes, `--scope project|user` default `project`, `--help` com exit 0 / erro com exit 2); `_print_result` com as MESMAS 7 linhas de saída (`agent:`…`warnings:`); códigos de erro idênticos (3 para `ConfigFormat/Conflict/ValueError`, 4 para outros). **Nota:** `run_operation` é async — `main` retorna `Promise<number>`; atualizar o ramo `plugin` em `src/index.ts` (contrato da Fase 5, task 5.2) removendo o `ponytail` e chamando `await pluginMain(...)` — essa é a ÚNICA outra edição permitida aqui, na mesma task/commit.
- [ ] **Step 2:** typecheck. **Step 3:** `git add src/features/plugin/cli.ts src/index.ts; git commit -m "feat: CLI do plugin"`

### Task 7.5: `test/plugin_storage.test.ts`

**Files:**
- Create exactly one file: `test/plugin_storage.test.ts`

**Source canônica:** `tests/test_plugin_storage.py` (1:1; json/json5/toml round-trip, merge/remove entry, conflito não-gerenciado, atomic write — o teste de permissões `stat/os.chmod` do python: portar para `fs.statSync(...).mode & 0o777` e pular (`it.skip`) a asserção específica de symlink-only-Windows com comentário).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_storage.test.ts; git commit -m "test: porta de test_plugin_storage"`

### Task 7.6: `test/plugin_adapters.test.ts`

**Files:**
- Create exactly one file: `test/plugin_adapters.test.ts`

**Source canônica:** `tests/test_plugin_adapters.py` (1:1; os 10 agentes: path/format/entry por escopo; ownership de comando `uvx` antigo → adaptar fixtures para o formato `npx` equivalente mantendo os mesmos cenários owned/not-owned).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_adapters.test.ts; git commit -m "test: porta de test_plugin_adapters"`

### Task 7.7: `test/plugin_installer.test.ts`

**Files:**
- Create exactly one file: `test/plugin_installer.test.ts`

**Source canônica:** `tests/test_plugin_installer.py` (1:1; resolver de versão stubado `async () => "1.2.3"`; conflitos preservados com warning `Conflict preserved`; update só muda pin gerenciado; uninstall remove apenas config+skill gerenciadas).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_installer.test.ts; git commit -m "test: porta de test_plugin_installer"`

### Task 7.8: `test/plugin_cli.test.ts`

**Files:**
- Create exactly one file: `test/plugin_cli.test.ts`

**Source canônica:** `tests/test_plugin_cli.py` (1:1; capturar stdout via spy em `console.log`/`process.stdout.write` — a CLI do plugin deve escrever via `process.stdout.write` para facilitar o assert; exit codes 0/2/3/4).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/plugin_cli.test.ts; git commit -m "test: porta de test_plugin_cli"`

---

## Phase 8: Teste de pacote + docs de agentes (parte 1)

**Entry criteria:** gate da Fase 7 verde.

**Parallel dispatch:** 8 tasks juntas.

**Completion gate:** `npm run build && npx vitest run test/package.test.ts` PASSA; `Select-String -Path docs/agents/*.md -Pattern 'uvx|uv run'` retorna vazio nos arquivos tocados.

### Task 8.1: `test/package.test.ts`

**Files:**
- Create exactly one file: `test/package.test.ts`

**Source canônica:** `tests/test_plugin_package.py` (substitui entry-points/importlib: assertar `package.json` — `bin["mcp-compras-publicas-br"] === "dist/index.js"`, `files` contém `dist`, versão é semver estável; após `npm run build` (feito pelo gate, não pelo teste): `dist/index.js` começa com shebang e `dist/features/plugin/templates/skill.md` existe).

- [ ] **Step 1:** Portar. **Step 2:** roda no gate. **Step 3:** `git add test/package.test.ts; git commit -m "test: porta de test_plugin_package"`

### Tasks 8.2–8.8: docs de agentes (parte 1)

Cada task modifica exatamente UM arquivo. Conteúdo da mudança (idêntico para todas): trocar o comando de registro `uvx --from mcp-compras-publicas-br==X.Y.Z mcp-compras-publicas-br` por `npx -y mcp-compras-publicas-br@X.Y.Z` e o comando de instalação do plugin por `npx -y mcp-compras-publicas-br@X.Y.Z plugin install --agent <id> --scope <scope>`; atualizar qualquer menção a `uv run`/`pyproject` para `npm run`/`package.json`; manter o resto do documento intacto.

- Task 8.2: Modify `docs/agents/README.md`
- Task 8.3: Modify `docs/agents/claude-code.md`
- Task 8.4: Modify `docs/agents/codex.md`
- Task 8.5: Modify `docs/agents/cursor.md`
- Task 8.6: Modify `docs/agents/opencode.md`
- Task 8.7: Modify `docs/agents/antigravity.md`
- Task 8.8: Modify `docs/agents/deepseek-harness.md`

Steps (cada task): editar o arquivo → `Select-String -Path <arquivo> -Pattern 'uvx|uv run'` vazio → `git add <arquivo>; git commit -m "docs: <agente> registra via npx"`.

---

## Phase 9: Docs de agentes (parte 2) + docs raiz

**Entry criteria:** gate da Fase 8 verde.

**Parallel dispatch:** 8 tasks juntas.

**Completion gate:** `Select-String -Path docs/agents/*.md,README.md,ARCHITECTURE.md,CHANGELOG.md,SECURITY.md -Pattern 'uvx|uv run|pyproject|pytest|pyright|ruff'` retorna vazio (histórico do CHANGELOG antigo é a única exceção tolerada; a nova entrada é TS).

### Tasks 9.1–9.4: docs de agentes (parte 2)

Mesma mudança de conteúdo das tasks 8.2–8.8 (comando de registro `npx -y mcp-compras-publicas-br@X.Y.Z`, instalação via `plugin install`):

- Task 9.1: Modify `docs/agents/hermes-agent.md`
- Task 9.2: Modify `docs/agents/openclaw.md`
- Task 9.3: Modify `docs/agents/pi.md`
- Task 9.4: Modify `docs/agents/generic.md`

Steps: editar → grep vazio de `uvx|uv run` → `git add <arquivo>; git commit -m "docs: <agente> registra via npx"`.

### Task 9.5: `README.md`

**Files:**
- Modify exactly one file: `README.md`

- [ ] **Step 1:** Substituir instalação/uso Python (`uvx`, `uv run`, `pip`) pelos equivalentes npm: registro `npx -y mcp-compras-publicas-br@<versão>`; plugin `npx -y mcp-compras-publicas-br@<versão> plugin install --agent <id>`; dev `npm install`, `npm test`, `npm run typecheck`, `npm run catalogo -- check coverage/endpoints.yaml`, `npm run build`; transporte HTTP `npm start` com `MCP_TRANSPORT=http`.
- [ ] **Step 2:** grep `uvx|uv run` vazio no arquivo. **Step 3:** `git add README.md; git commit -m "docs: README para TypeScript/npm"`

### Task 9.6: `ARCHITECTURE.md`

**Files:**
- Modify exactly one file: `ARCHITECTURE.md`

- [ ] **Step 1:** Atualizar caminhos de módulo (`src/shared/runtime.py` → `src/shared/runtime.ts` etc. conforme o mapa deste plano), comando de registro (`npx -y …@<versão-exata>`), seção de CI (`npm run typecheck` / `npm test` / `npm run catalogo -- check` / `npm run build`) e transporte HTTP (`MCP_TRANSPORT=http npm start`). Fluxos e garantias permanecem com o mesmo texto.
- [ ] **Step 2:** grep `uv|\.py` vazio no arquivo. **Step 3:** `git add ARCHITECTURE.md; git commit -m "docs: arquitetura em TypeScript"`

### Task 9.7: `CHANGELOG.md`

**Files:**
- Modify exactly one file: `CHANGELOG.md`

- [ ] **Step 1:** Nova entrada no topo:

```markdown
## [0.1.0] - 2026-09-07
### Changed
- Projeto migrado de Python para TypeScript (Node >= 20). Registro de agentes passa de `uvx` para `npx -y mcp-compras-publicas-br@<versão>`. Sem mudança de comportamento, ferramentas ou envelope.
```

- [ ] **Step 2:** `git add CHANGELOG.md; git commit -m "docs: changelog da migração TS"`

### Task 9.8: `SECURITY.md`

**Files:**
- Modify exactly one file: `SECURITY.md`

- [ ] **Step 1:** Trocar referências de tooling Python (`uv run`, pip) pelas equivalentes npm; manter conteúdo de política intacto.
- [ ] **Step 2:** grep `uv ` vazio. **Step 3:** `git add SECURITY.md; git commit -m "docs: SECURITY para npm"`

---

## Phase 10: CI de publicação

**Entry criteria:** gate da Fase 9 verde.

**Parallel dispatch:** 4 tasks juntas.

**Completion gate:** os 4 comandos usados na CI passam localmente: `npm run typecheck`, `npx vitest run`, `npm run catalogo -- check coverage/endpoints.yaml`, `npm run build`; nenhum workflow contém `uv`/`python` (grep vazio).

### Task 10.1: `.github/workflows/ci.yml`

**Files:**
- Modify exactly one file: `.github/workflows/ci.yml`

- [ ] **Step 1:** Reescrever os passos para Node 22 + `actions/setup-node@v4` (`cache: npm`), rodando exatamente: `npm ci`, `npm run typecheck`, `npx vitest run`, `npm run catalogo -- check coverage/endpoints.yaml`, `npm run build`, e a checagem estática de fronteira HTTP (`grep -n "post(\|put(\|patch(\|delete(" src/shared/http_readonly.ts` deve não casar — usar `rg -nE "\.(post|put|patch|delete)\(" src/shared/http_readonly.ts || true` com `! rg ...`). Remover passos `uv`/`ruff`/`pyright`/`pytest`/`uv build`.
- [ ] **Step 2:** `git add .github/workflows/ci.yml; git commit -m "ci: pipeline npm/tsc/vitest"`

### Task 10.2: `.github/workflows/publish.yml`

**Files:**
- Modify exactly one file: `.github/workflows/publish.yml`

- [ ] **Step 1:** Publicação npm em tag: `setup-node` com `registry-url: https://registry.npmjs.org`, `NPM_TOKEN` via `NODE_AUTH_TOKEN`, passos `npm ci && npm run typecheck && npx vitest run && npm run build && npm publish` (provenance `--provenance` se OIDC; manter gatilho de release existente trocando apenas os comandos).
- [ ] **Step 2:** `git add .github/workflows/publish.yml; git commit -m "ci: publish npm"`

### Task 10.3: `.github/workflows/upstream-drift.yml`

**Files:**
- Modify exactly one file: `.github/workflows/upstream-drift.yml`

- [ ] **Step 1:** Manter a agenda; trocar o comando por `npm ci && npm run catalogo -- discover --official --compare coverage/endpoints.yaml --fail-on-diff`.
- [ ] **Step 2:** `git add .github/workflows/upstream-drift.yml; git commit -m "ci: upstream drift via catalogo npm"`

### Task 10.4: `CONTRIBUTING.md`

**Files:**
- Modify exactly one file: `CONTRIBUTING.md`

- [ ] **Step 1:** Comandos de dev: `npm install`, `npm test`, `npm run typecheck`, `npm run build`, `npm run catalogo -- check …`; requisitos: Node >= 20 (trocar seção Python/uv).
- [ ] **Step 2:** grep `uv|pytest|ruff|pyright` vazio. **Step 3:** `git add CONTRIBUTING.md; git commit -m "docs: contributing para stack TS"`

---

## Phase 11: Remoção do Python

**Entry criteria:** gate da Fase 10 verde; suíte TS completa verde; catálogo check via TS ok.

**Parallel dispatch:** as 3 tasks de remoção juntas (são disjuntas).

**Completion gate:** `git ls-files "*.py" "pyproject.toml" "uv.lock"` vazio; `npx tsc --noEmit` 0 erros; `npx vitest run` PASSA; `npm run catalogo -- check coverage/endpoints.yaml` exit 0; `npm run build` ok.

### Task 11.1: Remover fontes Python

**Files:**
- Delete: todos os `src/**/*.py` (e `__init__.py`) — esta task deleta apenas o conteúdo Python; nenhum `.py` permanece em `src/`.

- [ ] **Step 1:** `git ls-files "src/*.py" | ForEach-Object { git rm --quiet $_ }`
- [ ] **Step 2:** `git commit -m "chore!: remove fontes Python (migração TS concluída)"`

### Task 11.2: Remover testes Python

**Files:**
- Delete: todos os `tests/**/*.py`.

- [ ] **Step 1:** `git ls-files "tests/*.py" | ForEach-Object { git rm --quiet $_ }`
- [ ] **Step 2:** `git commit -m "chore!: remove testes Python"`

### Task 11.3: Remover metadados Python

**Files:**
- Delete: `pyproject.toml` e `uv.lock`.

- [ ] **Step 1:** `git rm pyproject.toml uv.lock`
- [ ] **Step 2:** `git commit -m "chore!: remove pyproject/uv.lock"`

---

## Self-review do plano (executado pelo autor)

- **Cobertura do spec:** pacote npm+bin+Fase 1/11 ✓; npx pin ✓ (6.3/7.2); ferramentas/recursos/envelope ✓ (5.1/5.4); http readonly ✓ (2.3/2.5); catálogo ✓ (4.1); cache ✓ (3.2); plugin instalador ✓ (6–7); CI gates ✓ (10); upstream drift ✓ (10.3); docs agentes ✓ (8/9); testes 1:1 ✓; remoção Python ✓ (11). Comportamento mudado intencional (spec): apenas comando de registro uvx→npx.
- **Placeholders:** `mergeMcpEntry(...)`/`removeMcpEntry(...)` com aridade definida na fonte canônica (`armazenamento.py:merge_mcp_entry`) — especificado por referência canônica, não TBD.
- **Consistência de tipos:** `Settings`/`TtlCache` (2.1) usados em clientes/servico; `Operation`/`McpResponse` (2.2) usados em 3.2/4.1/5.1; `installedVersion`/`versionedCommand` (6.3) usados em 7.2/7.3; contratos conferem com as assinaturas da seção de contratos.
