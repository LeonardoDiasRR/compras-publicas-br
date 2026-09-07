import { afterAll, afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { getAdapter, supportedAgentIds } from "../src/features/plugin/adaptadores.js";
import { PluginError, type McpRegistration } from "../src/features/plugin/modelo.js";

function scope(scopeName: "project" | "user", root: string) {
  return { scope: scopeName, root, usedGitRoot: false };
}

const EXPECTED = [
  "antigravity",
  "claude-code",
  "codex",
  "cursor",
  "deepseek-harness",
  "generic",
  "hermes-agent",
  "openclaw",
  "opencode",
  "pi",
] as const;

const tempDirs: string[] = [];
const originalCwd = process.cwd();

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "adapters-"));
  tempDirs.push(dir);
  return dir;
}

function isRelative(candidate: string, base: string): boolean {
  const relative = candidate.slice(base.length);
  return relative === "" || /^[\\/]/.test(relative);
}

afterEach(() => {
  process.chdir(originalCwd);
});

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("McpRegistration", () => {
  // ponytail: TS McpRegistration é interface pura (sem as_mapping); o registro
  // em si é o mapeamento serializável, então o teste porta a forma exata.
  it("expõe os campos do registro como mapeamento", () => {
    const args = ["npx", "-y", "mcp-compras-publicas-br@0.1.0"];
    const registration: McpRegistration = {
      command: "npx",
      args: args,
      version: "0.1.0",
      managedPackage: "mcp-compras-publicas-br",
    };

    expect({ ...registration }).toEqual({
      command: "npx",
      args: args,
      version: "0.1.0",
      managedPackage: "mcp-compras-publicas-br",
    });
  });
});

describe("registro de agentes", () => {
  it("declara todos os agentes suportados sem duplicatas", () => {
    const agentIds = [...supportedAgentIds()];

    expect(agentIds).toHaveLength(new Set(agentIds).size);
    expect(new Set(agentIds)).toEqual(new Set(EXPECTED));
  });

  it("rejeita agente desconhecido", () => {
    expect(() => getAdapter("unknown")).toThrow(PluginError, /unknown/i);
  });
});

describe("generic adapter", () => {
  it("resolve manifesto no escopo project", () => {
    const tmp = mkTmp();
    const projectRoot = join(tmp, "project");
    const home = join(tmp, "home");
    const target = getAdapter("generic").resolveTarget(scope("project", projectRoot));

    expect(projectRoot).not.toBe(home);
    expect(resolve(target.configPath)).toBe(resolve(join(projectRoot, ".agent", "mcp.json")));
    expect(resolve(target.skillPath)).toBe(
      resolve(join(projectRoot, ".agent", "skills", "compras-publicas-br.md")),
    );
  });

  it("resolve manifesto no escopo user", () => {
    const tmp = mkTmp();
    const projectRoot = join(tmp, "project");
    const home = join(tmp, "home");
    const target = getAdapter("generic").resolveTarget(scope("user", home));

    expect(projectRoot).not.toBe(home);
    expect(resolve(target.configPath)).toBe(resolve(join(home, ".agent", "mcp.json")));
    expect(resolve(target.skillPath)).toBe(
      resolve(join(home, ".agent", "skills", "compras-publicas-br.md")),
    );
  });
});

describe("contrato comum dos alvos", () => {
  it.each(EXPECTED)("%s declara o contrato de alvo", (agentId) => {
    const tmp = mkTmp();
    const projectRoot = join(tmp, "project");
    const home = join(tmp, "home");
    const adapter = getAdapter(agentId);

    expect(projectRoot).not.toBe(home);
    expect(adapter.agentId).toBe(agentId);
    expect(adapter.displayName).toBeTruthy();

    for (const [scopeName, base] of [
      ["project", projectRoot],
      ["user", home],
    ] as const) {
      const target = adapter.resolveTarget(scope(scopeName, base));

      expect(isRelative(resolve(target.configPath), resolve(base))).toBe(true);
      expect(isRelative(resolve(target.skillPath), resolve(base))).toBe(true);
      expect(["json", "json5", "toml"]).toContain(target.configFormat);
      expect(target.skillPath.split(/[\\/]/).at(-1)).toBeTruthy();

      const validationCommand = adapter.validationCommand;
      expect(
        validationCommand === null ||
          (Array.isArray(validationCommand) &&
            validationCommand.length > 0 &&
            validationCommand.every((part) => typeof part === "string" && part !== "")),
      ).toBe(true);

      expect(() => adapter.validateTarget(target)).not.toThrow();

      const unsafeConfigTarget = {
        ...target,
        configPath: join(base, "..", "outside", target.configPath.split(/[\\/]/).at(-1)!),
      };
      expect(() => adapter.validateTarget(unsafeConfigTarget)).toThrow(Error);

      const unsafeSkillTarget = {
        ...target,
        skillPath: join(base, "..", "outside", target.skillPath.split(/[\\/]/).at(-1)!),
      };
      expect(() => adapter.validateTarget(unsafeSkillTarget)).toThrow(Error);

      for (const nativeCommand of [target.nativeAdd, target.nativeRemove]) {
        expect(
          nativeCommand === null ||
            (Array.isArray(nativeCommand) &&
              nativeCommand.length > 0 &&
              nativeCommand.every((part) => typeof part === "string" && part !== "")),
        ).toBe(true);
      }
    }
  });
});

describe("ownership de entradas", () => {
  it.each(EXPECTED)("%s é dono apenas da entrada que constrói", (agentId) => {
    const adapter = getAdapter(agentId);
    const entry = adapter.buildEntry("0.1.0") as Record<string, unknown>;

    expect(adapter.ownsEntry(entry)).toBe(true);
    expect(adapter.ownsEntry({ command: "custom" })).toBe(false);

    for (const malformedPin of [
      "other-package@0.1.0",
      "mcp-compras-publicas-br",
      "mcp-compras-publicas-br@not-a-version",
      "mcp-compras-publicas-br@1.0.0-rc1",
    ]) {
      const candidate: Record<string, unknown> = { ...entry };
      if (Array.isArray(candidate["command"])) {
        const command = [...(candidate["command"] as string[])];
        command[2] = malformedPin;
        candidate["command"] = command;
      } else {
        const args = [...(candidate["args"] as string[])];
        args[1] = malformedPin;
        candidate["args"] = args;
      }
      expect(adapter.ownsEntry(candidate)).toBe(false);
    }
  });
});

describe("entrada versionada fixa", () => {
  const pinnedArgs = ["-y", "mcp-compras-publicas-br@0.1.0"];

  it.each(EXPECTED)("%s constrói a entrada npx versionada", (agentId) => {
    const entry = getAdapter(agentId).buildEntry("0.1.0") as Record<string, unknown>;

    if (agentId === "generic") {
      expect(entry["command"]).toBe("npx");
      expect(entry["args"]).toEqual(pinnedArgs);
      const managedBy = entry["managedBy"] as Record<string, unknown>;
      expect(typeof managedBy).toBe("object");
      expect(managedBy["package"]).toBe("mcp-compras-publicas-br");
      expect(Number.isInteger(managedBy["schemaVersion"])).toBe(true);
      expect(managedBy["schemaVersion"]).toBe(1);
    } else if (agentId === "opencode") {
      expect(entry).toEqual({
        type: "local",
        command: ["npx", ...pinnedArgs],
      });
    } else if (agentId === "cursor") {
      expect(entry).toEqual({
        type: "stdio",
        command: "npx",
        args: pinnedArgs,
      });
    } else {
      expect(entry["command"]).toBe("npx");
      expect(entry["args"]).toEqual(pinnedArgs);
      expect("managedBy" in entry).toBe(false);
    }
  });
});

describe("openclaw", () => {
  it("usa comando nativo de remoção próprio", () => {
    const tmp = mkTmp();
    const target = getAdapter("openclaw").resolveTarget(scope("project", tmp));

    expect(target.nativeRemove).toEqual(["openclaw", "mcp", "unset"]);
  });
});

describe("validação de declarações inválidas", () => {
  it.each(EXPECTED)("%s rejeita alvos malformados", (agentId) => {
    const tmp = mkTmp();
    const projectRoot = join(tmp, "project");
    const home = join(tmp, "home");
    const adapter = getAdapter(agentId);
    const target = adapter.resolveTarget(scope("project", projectRoot));

    expect(() =>
      adapter.validateTarget({ ...target, configFormat: "ini" as never }),
    ).toThrow(Error);

    expect(() =>
      adapter.validateTarget({ ...target, nativeAdd: "malformed" as never }),
    ).toThrow(Error);

    expect(() =>
      adapter.validateTarget({ ...target, nativeRemove: "malformed" as never }),
    ).toThrow(Error);
  });
});

describe("containers documentados", () => {
  it.each([
    ["codex", ["mcp_servers"]],
    ["openclaw", ["mcp", "servers"]],
    ["generic", ["mcpServers"]],
  ] as const)("%s preserva o container %j", (agentId, containerPath) => {
    const tmp = mkTmp();
    const projectRoot = join(tmp, "project");
    const home = join(tmp, "home");
    const target = getAdapter(agentId).resolveTarget(scope("project", projectRoot));

    expect(target.containerPath).toEqual([...containerPath]);
  });
});
