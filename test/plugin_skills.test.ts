import { afterAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isManagedSkill,
  removeManagedSkill,
  renderSkill,
} from "../src/features/plugin/habilidades.js";

const tempDirs: string[] = [];

function mkTmpFile(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "skills-"));
  tempDirs.push(dir);
  const path = join(dir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("skills gerenciadas", () => {
  it("skill renderizada contém agente e marcador de gerenciamento", () => {
    const content = renderSkill("codex", "Codex", "project");
    const path = mkTmpFile("SKILL.md", content);

    expect(content).toContain("managed-by: mcp-compras-publicas-br; format: 1");
    expect(content).toContain("Codex");
    expect(content).toContain("somente leitura");
    expect(isManagedSkill(path)).toBe(true);
  });

  it("skill gerenciada é detectada", () => {
    const path = mkTmpFile("SKILL.md", "managed-by: mcp-compras-publicas-br; format: 1\n");

    expect(isManagedSkill(path)).toBe(true);
  });

  it("skill gerenciada é removida", () => {
    const path = mkTmpFile("SKILL.md", "managed-by: mcp-compras-publicas-br; format: 1\n");

    expect(removeManagedSkill(path)).toBe(true);
    expect(existsSync(path)).toBe(false);
  });

  it("skill não gerenciada é preservada", () => {
    const path = mkTmpFile("SKILL.md", "custom");

    expect(isManagedSkill(path)).toBe(false);
    expect(removeManagedSkill(path)).toBe(false);
    expect(readFileSync(path, "utf-8")).toBe("custom");
  });
});
