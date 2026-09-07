import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { resolve } from "node:path";
import { logger } from "../src/shared/runtime.js";
import { findProjectRoot, resolveScope } from "../src/features/plugin/escopo.js";

const tempDirs: string[] = [];
const originalCwd = process.cwd();

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "scope-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
});

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("findProjectRoot / resolveScope", () => {
  it("encontra raiz do projeto subindo até diretório .git", () => {
    const tmp = mkTmp();
    const root = join(tmp, "repo");
    mkdirSync(join(root, ".git"), { recursive: true });
    const nested = join(root, "src", "feature");
    mkdirSync(nested, { recursive: true });

    expect(resolve(findProjectRoot(nested)!)).toBe(resolve(root));
    const result = resolveScope("project", nested);
    expect(resolve(result.root)).toBe(resolve(root));
    expect(result.usedGitRoot).toBe(true);
  });

  it("aceita arquivo .git", () => {
    const tmp = mkTmp();
    const root = join(tmp, "repo");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, ".git"), "gitdir: /other/repo/.git\n");
    const nested = join(root, "src");
    mkdirSync(nested, { recursive: true });

    expect(resolve(findProjectRoot(nested)!)).toBe(resolve(root));
  });

  it("sem git usa diretório atual e emite warning", () => {
    const tmp = mkTmp();
    const warnings: string[] = [];
    const spy = vi.spyOn(logger, "warn").mockImplementation((msg: unknown) => {
      warnings.push(String(msg));
    });

    const result = resolveScope("project", tmp);

    expect(resolve(result.root)).toBe(resolve(tmp));
    expect(result.usedGitRoot).toBe(false);
    expect(spy).toHaveBeenCalled();
    expect(
      warnings.some((m) => m.includes("Git") && m.includes("diretório atual"))
    ).toBe(true);
  });

  it("escopo user não depende do diretório atual", () => {
    const tmp = mkTmp();
    const unrelated = join(tmp, "unrelated");
    mkdirSync(unrelated, { recursive: true });
    process.chdir(unrelated);

    const result = resolveScope("user", tmp);

    expect(result.scope).toBe("user");
    expect(resolve(result.root)).toBe(resolve(homedir()));
    expect(result.usedGitRoot).toBe(false);
  });

  it("escopo user com home explícito ignora árvore git", () => {
    const tmp = mkTmp();
    const root = join(tmp, "repo");
    mkdirSync(join(root, ".git"), { recursive: true });
    const start = join(root, "src");
    mkdirSync(start, { recursive: true });
    const home = join(tmp, "home");

    const result = resolveScope("user", start, home);

    expect(resolve(result.root)).toBe(resolve(home));
    expect(result.usedGitRoot).toBe(false);
  });
});
