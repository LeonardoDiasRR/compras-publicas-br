import { afterAll, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { InstallerService } from "../src/features/plugin/instalador.js";
import { getAdapter } from "../src/features/plugin/adaptadores.js";
import { resolveScope } from "../src/features/plugin/escopo.js";
import { PluginError } from "../src/features/plugin/modelo.js";

const tempDirs: string[] = [];

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "installer-"));
  tempDirs.push(dir);
  return dir;
}

// Espelha InstallerService.for_testing(root, agent="generic", latest_version=...)
function forTesting(root: string, version = "1.2.3"): InstallerService {
  const scope = resolveScope("project", root, root);
  return new InstallerService(getAdapter("generic"), scope, async () => version);
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("InstallerService", () => {
  it("install é idempotente e preserva outras entradas", async () => {
    const tmp = mkTmp();
    const configPath = join(tmp, ".agent", "mcp.json");
    mkdirSync(join(tmp, ".agent"), { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: { other: { command: "other" } },
        settings: { keep: true },
      }),
      "utf8"
    );
    const service = forTesting(tmp);

    const first = await service.install();
    const before = readFileSync(first.configPath, "utf8");
    const beforeSkill = readFileSync(first.skillPath);
    const second = await service.install();

    const document = JSON.parse(before);
    expect(first.changed).toBe(true);
    expect(readFileSync(first.skillPath, "utf8")).toContain(
      "managed-by: mcp-compras-publicas-br"
    );
    expect(document.mcpServers.other).toEqual({ command: "other" });
    expect(document.settings).toEqual({ keep: true });
    expect(second.changed).toBe(false);
    expect(readFileSync(second.configPath, "utf8")).toBe(before);
    expect(readFileSync(second.skillPath)).toEqual(beforeSkill);
  });

  it("update altera apenas a versão fixada", async () => {
    const tmp = mkTmp();
    const service = forTesting(tmp, "0.2.0");
    const installed = await new InstallerService(
      getAdapter("generic"),
      resolveScope("project", tmp, tmp),
      async () => "1.2.3"
    ).install();
    const beforeDocument = JSON.parse(readFileSync(installed.configPath, "utf8"));
    const beforeSkill = readFileSync(installed.skillPath);
    const expectedDocument = structuredClone(beforeDocument);
    expectedDocument.mcpServers["compras-publicas-br"].args[1] =
      "mcp-compras-publicas-br@0.2.0";

    const result = await service.update();

    const afterDocument = JSON.parse(readFileSync(result.configPath, "utf8"));
    expect(result.changed).toBe(true);
    expect(afterDocument).toEqual(expectedDocument);
    expect(readFileSync(result.skillPath)).toEqual(beforeSkill);
  });

  it("uninstall remove entrada gerenciada e skill", async () => {
    const tmp = mkTmp();
    const configPath = join(tmp, ".agent", "mcp.json");
    mkdirSync(join(tmp, ".agent"), { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: { other: { command: "other" } },
        settings: { keep: true },
      }),
      "utf8"
    );
    const service = forTesting(tmp);
    await service.install();

    const result = await service.uninstall();

    const document = JSON.parse(readFileSync(result.configPath, "utf8"));
    const afterFirstUninstall = readFileSync(result.configPath);
    const second = await service.uninstall();
    expect(result.changed).toBe(true);
    expect(document.mcpServers).not.toHaveProperty("compras-publicas-br");
    expect(document.mcpServers.other).toEqual({ command: "other" });
    expect(document.settings).toEqual({ keep: true });
    expect(() => readFileSync(result.skillPath)).toThrow();
    expect(second.changed).toBe(false);
    expect(readFileSync(second.configPath)).toEqual(afterFirstUninstall);
  });

  it("install preserva skill não gerenciada e avisa", async () => {
    const tmp = mkTmp();
    const skillPath = join(tmp, ".agent", "skills", "compras-publicas-br.md");
    mkdirSync(join(tmp, ".agent", "skills"), { recursive: true });
    writeFileSync(skillPath, "custom skill", "utf8");
    const service = forTesting(tmp);

    const result = await service.install();

    expect(result.changed).toBe(true);
    expect(resolve(result.skillPath)).toBe(resolve(skillPath));
    expect(readFileSync(result.skillPath, "utf8")).toBe("custom skill");
    expect(result.warnings.some((w) => w.toLowerCase().includes("skill"))).toBe(
      true
    );
  });

  it("install preserva conflito não reconhecido atomicamente", async () => {
    const tmp = mkTmp();
    const configPath = join(tmp, ".agent", "mcp.json");
    mkdirSync(join(tmp, ".agent"), { recursive: true });
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: { "compras-publicas-br": { command: "custom" } },
      }),
      "utf8"
    );
    const before = readFileSync(configPath);
    const service = forTesting(tmp);

    const result = await service.install();

    expect(result.changed).toBe(false);
    expect(readFileSync(result.configPath)).toEqual(before);
    expect(() => readFileSync(result.skillPath)).toThrow();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("update não modifica config quando entrada gerenciada é perdida", async () => {
    const tmp = mkTmp();
    const service = forTesting(tmp, "0.2.0");
    const installed = await new InstallerService(
      getAdapter("generic"),
      resolveScope("project", tmp, tmp),
      async () => "1.2.3"
    ).install();
    const document = JSON.parse(readFileSync(installed.configPath, "utf8"));
    document.mcpServers["compras-publicas-br"] = { command: "custom" };
    writeFileSync(installed.configPath, JSON.stringify(document), "utf8");
    const beforeConfig = readFileSync(installed.configPath);
    const beforeSkill = readFileSync(installed.skillPath);

    const result = await service.update();

    expect(result.changed).toBe(false);
    expect(readFileSync(result.configPath)).toEqual(beforeConfig);
    expect(readFileSync(result.skillPath)).toEqual(beforeSkill);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("falha de update com versão inválida injetada é atômica", async () => {
    const tmp = mkTmp();
    const installed = await forTesting(tmp).install();
    const beforeConfig = readFileSync(installed.configPath);
    const beforeSkill = readFileSync(installed.skillPath);
    const failingService = forTesting(tmp, "not-a-valid-version");

    await expect(failingService.update()).rejects.toThrow(PluginError);

    expect(readFileSync(installed.configPath)).toEqual(beforeConfig);
    expect(readFileSync(installed.skillPath)).toEqual(beforeSkill);
  });
});
