import { existsSync, lstatSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import type { ScopeName } from "./modelo.js";

export const MANAGED_MARKER = "managed-by: mcp-compras-publicas-br; format: 1";
const COMMENTED_MARKER = `<!-- ${MANAGED_MARKER} -->`;

function template(): string {
  return readFileSync(new URL("./templates/skill.md", import.meta.url), "utf8");
}

export function renderSkill(agentId: string, agentName: string, scope: ScopeName): string {
  const rendered = template()
    .replaceAll("{{AGENT_ID}}", agentId)
    .replaceAll("{{AGENT_NAME}}", agentName)
    .replaceAll("{{SCOPE}}", scope);
  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export function isManagedSkill(path: string): boolean {
  if (isSymlink(path)) return false;
  try {
    if (!lstatSync(path).isFile()) return false;
  } catch {
    return false;
  }

  const prefixLength = Math.max(MANAGED_MARKER.length, COMMENTED_MARKER.length);
  let prefix: string;
  try {
    // ponytail: reads whole file; python reads prefixLength+1 chars. Skill files are tiny.
    prefix = readFileSync(path, "utf8").slice(0, prefixLength + 1);
  } catch {
    return false;
  }

  for (const marker of [MANAGED_MARKER, COMMENTED_MARKER]) {
    if (prefix === marker || prefix.startsWith(`${marker}\n`) || prefix.startsWith(`${marker}\r`)) {
      return true;
    }
  }
  return false;
}

export function writeManagedSkill(path: string, agentId: string, agentName: string, scope: ScopeName): boolean {
  if (isSymlink(path)) return false;

  const content = renderSkill(agentId, agentName, scope);
  if (existsSync(path)) {
    let current: string;
    try {
      current = readFileSync(path, "utf8");
    } catch {
      return false;
    }
    if (!isManagedSkill(path) || current === content) return false;
  } else {
    mkdirSync(dirname(path), { recursive: true });
  }

  writeFileSync(path, content);
  return true;
}

export function removeManagedSkill(path: string): boolean {
  if (!isManagedSkill(path)) return false;
  unlinkSync(path);
  return true;
}
