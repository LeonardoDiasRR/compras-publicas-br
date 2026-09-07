import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";

import { logger } from "../../shared/runtime.js";
import type { ScopeName, ScopeTarget } from "./modelo.js";

export function findProjectRoot(start: string): string | null {
  let candidate = resolve(start);
  for (;;) {
    const gitPath = join(candidate, ".git");
    if (existsSync(gitPath) && (statSync(gitPath).isDirectory() || statSync(gitPath).isFile())) {
      return candidate;
    }
    const parent = dirname(candidate);
    if (parent === candidate) return null;
    candidate = parent;
  }
}

export function resolveScope(scope: ScopeName, start: string, home?: string): ScopeTarget {
  if (scope === "user") {
    const userRoot = home !== undefined ? home : homedir();
    return { scope: scope, root: userRoot, usedGitRoot: false };
  }

  const projectRoot = findProjectRoot(start);
  if (projectRoot !== null) {
    return { scope: scope, root: projectRoot, usedGitRoot: true };
  }

  logger.warn("Git não encontrado; usando o diretório atual.");
  return { scope: scope, root: resolve(start), usedGitRoot: false };
}
