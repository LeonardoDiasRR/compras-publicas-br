# Plugin entry local + manifesto absoluto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 2 bugs: (1) `plugin install` grava `npx -y pkg@versão` que quebra enquanto o pacote não existe no npm; (2) `DEFAULT_MANIFEST` relativo ao CWD crasha fora da raiz do repo (e o manifesto nem é empacotado).

**Architecture:** (1) `versionedCommand` híbrido: se a versão pinada == versão instalada e o bin local (`dist/index.js` relativo ao módulo) existe → `["node", <bin>]`; senão mantém `npx`. `ownsEntry` passa a reconhecer as duas formas. (2) `DEFAULT_MANIFEST` resolvido via `import.meta.url` (3 níveis acima = raiz do pacote em `src/` e `dist/`) e `coverage/endpoints.yaml` incluído em `files`.

**Tech Stack:** TypeScript ESM (Node ≥20), vitest, npm.

**Contexto:** Branch `master` (consentimento explícito do usuário). A versão do pacote é `0.1.0` (package.json), portanto no fluxo de instalação o pin `0.1.0` == `installedVersion()` → forma local. Update usa `latestStableVersion()` do registry (versão ≠ instalada) → forma npx, correta pós-publish.

**Contratos entre tarefas:**
- `versoes.ts` exporta `localBinPath(): string | null` (novo) e `versionedCommand(version: string): string[]` (assinatura inalterada).
- `adaptadores.ts` consome `localBinPath` de `./versoes.js`.

---

### Phase 1: Teste vermelho (e2e espera a forma local)

**Entry criteria:** `npm run build` ok (senão o e2e fica skipado e o vermelho não aparece).

**Parallel dispatch:** 1 tarefa.

**Completion gate:** `npx vitest run test/e2e_cli.test.ts` falha exatamente na asserção `entry.command` (esperado `"node"`, recebido `"npx"`).

#### Task 1.1: `test/e2e_cli.test.ts`

**Files:**
- Modify: `test/e2e_cli.test.ts`

- [ ] **Step 1: Atualizar asserções da entrada instalada** — substituir linhas 62–63:

```ts
// antes
expect(entry.command).toBe("npx");
expect(entry.args).toContain(`mcp-compras-publicas-br@${version}`);
// depois (o e2e roda o bin de dist/ → versão pinada == instalada → node local)
expect(entry.command).toBe("node");
expect(entry.args).toHaveLength(1);
expect(String(entry.args[0]).replace(/\\/g, "/")).toMatch(/dist\/index\.js$/);
```

A constante `version` (linha 9) fica sem uso no arquivo — remover.

- [ ] **Step 2: Rodar para confirmar falha**

Run: `npx vitest run test/e2e_cli.test.ts`
Expected: FAIL `expected "npx" to be "node"`.

- [ ] **Step 3: Commit**

```powershell
git add test/e2e_cli.test.ts
git commit -m "test: e2e plugin espera entrada node local quando versao pinada == instalada"
```

---

### Phase 2: Implementação

**Entry criteria:** Phase 1 gate cumprido (e2e vermelho pela razão certa).

**Parallel dispatch:** 4 tarefas simultâneas (arquivos distintos; contratos acima já definidos): `src/features/plugin/versoes.ts`, `src/features/plugin/adaptadores.ts`, `src/features/mcp/servidor.ts`, `package.json`.

**Completion gate:** `npx tsc --noEmit` 0 erros; `npm run build` ok; `npx vitest run` 100% verde (inclui `test/e2e_cli.test.ts` de Phase 1); `npm run catalogo -- check coverage/endpoints.yaml` exit 0; `npm pack --dry-run` lista `coverage/endpoints.yaml`; rodando de fora do repo não dá ENOENT:

```powershell
Push-Location $env:TEMP
node D:\projetos\compras-publicas-br\dist\index.js --transport http --port 3999
# Expected: servidor sobe (log de listen), SEM "ENOENT ... endpoints.yaml". kill depois.
Pop-Location
```

#### Task 2.1: `src/features/plugin/versoes.ts` — `localBinPath` + comando híbrido

**Files:**
- Modify: `src/features/plugin/versoes.ts` (imports `existsSync`, `fileURLToPath` já existem nas linhas 1–3)

- [ ] **Step 1: Substituir `versionedCommand` (linhas 40–42) por:**

```ts
// bin do pacote relativo ao módulo: dist/index.js. Em src/ (vitest) não existe
// → null → forma npx, preservando os testes unitários atuais.
export function localBinPath(): string | null {
  const bin = fileURLToPath(new URL("../../index.js", import.meta.url));
  return existsSync(bin) ? bin : null;
}

// ponytail: local bin vence enquanto o pacote não está publicado; quando
// publicado, update (latest != installed) cai naturalmente no npx.
export function versionedCommand(version: string): string[] {
  const bin = localBinPath();
  if (bin !== null) {
    let installed: string | null = null;
    try {
      installed = installedVersion();
    } catch {
      installed = null;
    }
    if (installed === version) return ["node", bin];
  }
  return ["npx", "-y", `${PACKAGE_NAME}@${version}`];
}
```

- [ ] **Step 2: Typecheck** — Run: `npx tsc --noEmit` → Expected: 0 erros.

- [ ] **Step 3: Commit**

```powershell
git add src/features/plugin/versoes.ts
git commit -m "fix: entry do plugin usa bin local quando versao pinada == instalada"
```

#### Task 2.2: `src/features/plugin/adaptadores.ts` — `ownsEntry` aceita as duas formas

**Files:**
- Modify: `src/features/plugin/adaptadores.ts` (sem isso, reinstall/uninstall de entradas gravadas na forma node não são reconhecidas como próprias)

- [ ] **Step 1: Linha 5, estender o import:**

```ts
import { localBinPath, PACKAGE_NAME, versionedCommand } from "./versoes.js";
```

- [ ] **Step 2: Substituir `ownsFullCommand`/`ownsArgs` (linhas 77–89) por:**

```ts
// duas formas possuídas: ["npx","-y",`${PACKAGE_NAME}@<stable>`] e
// ["node", <caminho do bin local>] escrita enquanto não publicado.
// ponytail: localBinPath() é null em vitest(src); forma node só é testada
// no e2e (roda do dist), onde ela é escrita de verdade.
function isLocalNodeCommand(command: unknown, args: unknown[]): boolean {
  const bin = localBinPath();
  return (
    command === "node" &&
    args.length === 1 &&
    typeof args[0] === "string" &&
    bin !== null &&
    resolve(args[0]) === resolve(bin)
  );
}

function ownsFullCommand(parts: unknown[]): boolean {
  if (parts.length === 3) {
    return parts[0] === "npx" && parts[1] === "-y" && isStablePin(parts[2]);
  }
  return parts.length === 2 && isLocalNodeCommand(parts[0], parts.slice(1));
}

function ownsArgs(args: unknown[], command: unknown): boolean {
  if (command === "npx") {
    return args.length === 2 && args[0] === "-y" && isStablePin(args[1]);
  }
  return isLocalNodeCommand(command, args);
}
```

(`resolve` já deve ser importado de `node:path` no arquivo — conferir o import no topo e adicionar se faltar.)

- [ ] **Step 3: Ramo cursor (linhas 196–202) — trocar por:**

```ts
    if (this.entryStyle === "cursor") {
      if (!hasExactKeys(entry, "type", "command", "args")) return false;
      if (entry["type"] !== "stdio") return false;
      const rawArgs = entry["args"];
      if (!isSequence(rawArgs)) return false;
      return ownsArgs(rawArgs, entry["command"]);
    }
```

- [ ] **Step 4: Ramo generic/command_args (linhas 204–213) — trocar a checagem de command:**

```ts
    if (!hasExactKeys(entry, ...expectedKeys)) {
      return false;
    }
    const rawArgs = entry["args"];
    if (!isSequence(rawArgs)) return false;
    if (!ownsArgs(rawArgs, entry["command"])) return false;
```

(o bloco `managedBy` das linhas 214–221 fica intacto)

- [ ] **Step 5: Typecheck** — Run: `npx tsc --noEmit` → Expected: 0 erros.

- [ ] **Step 6: Commit**

```powershell
git add src/features/plugin/adaptadores.ts
git commit -m "fix: ownsEntry reconhece entrada node local alem do pin npx"
```

#### Task 2.3: `src/features/mcp/servidor.ts` — `DEFAULT_MANIFEST` absoluto

**Files:**
- Modify: `src/features/mcp/servidor.ts`

- [ ] **Step 1: Adicionar import (após linha 2):**

```ts
import { fileURLToPath } from "node:url";
```

- [ ] **Step 2: Substituir linha 23:**

```ts
// raiz do pacote a partir do módulo (funciona em src/ e dist/, repo e npm).
// --manifest continua sobrescrevendo.
export const DEFAULT_MANIFEST = fileURLToPath(
  new URL("../../../coverage/endpoints.yaml", import.meta.url),
);
```

- [ ] **Step 3: Typecheck** — Run: `npx tsc --noEmit` → Expected: 0 erros.

- [ ] **Step 4: Commit**

```powershell
git add src/features/mcp/servidor.ts
git commit -m "fix: manifesto default resolvido da raiz do pacote, nao do CWD"
```

#### Task 2.4: `package.json` — empacotar o manifesto

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Linha 9:**

```json
  "files": ["dist", "coverage/endpoints.yaml"],
```

- [ ] **Step 2: Verificar empacotamento** — Run: `npm pack --dry-run` → Expected: lista inclui `coverage/endpoints.yaml` e `dist/`.

- [ ] **Step 3: Commit**

```powershell
git add package.json
git commit -m "fix: empacota coverage/endpoints.yaml no tarball npm"
```

---

### Phase 3: Verificação final

**Entry criteria:** Phase 2 gate verde.

**Parallel dispatch:** nenhuma — gate sequencial.

**Completion gate (todos exit 0 / verde):**

```powershell
npm run build
npx tsc --noEmit
npx vitest run
npm run catalogo -- check coverage/endpoints.yaml
npx vitest run test/e2e_cli.test.ts
```

Mais o smoke de CWD externo do gate da Phase 2 (servidor sobe de `%TEMP%` sem ENOENT).

---

**Skipped (ponytail):** unit test da forma node em `ownsEntry` (localBinPath é null via src; o e2e cobre o fluxo real), validação de publicação no registry, mover manifesto para `dist/` via postbuild. Adicionar quando o pacote for publicado e o fluxo update/npx virar o caminho primário.
