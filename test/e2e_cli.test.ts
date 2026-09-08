import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const BIN = resolve("dist/index.js");
const distReady = existsSync(BIN);

const tempDirs: string[] = [];
function makeTempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "e2e-cli-"));
  mkdirSync(join(dir, ".git"));
  tempDirs.push(dir);
  return dir;
}
function makeTempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), "e2e-home-"));
  tempDirs.push(dir);
  return dir;
}

function runBin(args: string[], cwd: string, extraEnv: Record<string, string> = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
    timeout: 60_000,
  });
}

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe.skipIf(!distReady)("e2e: catálogo via bin real", () => {
  it("catalogo check do manifesto, tools e coverage doc", () => {
    expect(runBin(["catalogo", "--check", "coverage/endpoints.yaml"], process.cwd()).status).toBe(0);
    expect(runBin(["catalogo", "--check-tools", "TOOLS.md"], process.cwd()).status).toBe(0);
    expect(
      runBin(["catalogo", "--check-coverage-doc", "ENDPOINT_COVERAGE.md"], process.cwd()).status
    ).toBe(0);
  });
});

describe.skipIf(!distReady)("e2e: plugin install/uninstall via bin real", () => {
  it("install idempotente e uninstall no escopo project (agente generic)", () => {
    const project = makeTempProject();

    const install = runBin(["plugin", "install", "--agent", "generic", "--scope", "project"], project);
    expect(install.status, install.stderr).toBe(0);
    expect(install.stdout).toContain("changed: True");

    const configPath = join(project, ".agent", "mcp.json");
    const skillPath = join(project, ".agent", "skills", "compras-publicas-br.md");
    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(skillPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, "utf8"));
    const entry = config.mcpServers["compras-publicas-br"];
    expect(entry.command).toBe("node");
    expect(entry.args).toHaveLength(1);
    expect(String(entry.args[0]).replace(/\\/g, "/")).toMatch(/dist\/index\.js$/);
    expect(readFileSync(skillPath, "utf8")).toContain("managed-by: mcp-compras-publicas-br; format: 1");

    const reinstall = runBin(["plugin", "install", "--agent", "generic", "--scope", "project"], project);
    expect(reinstall.status, reinstall.stderr).toBe(0);
    expect(reinstall.stdout).toContain("changed: False");

    const uninstall = runBin(["plugin", "uninstall", "--agent", "generic", "--scope", "project"], project);
    expect(uninstall.status, uninstall.stderr).toBe(0);
    expect(uninstall.stdout).toContain("changed: True");
    expect("compras-publicas-br" in JSON.parse(readFileSync(configPath, "utf8")).mcpServers).toBe(false);
    expect(existsSync(skillPath)).toBe(false);
  });

  it("install no escopo user usa o HOME informado", () => {
    const home = makeTempHome();
    const project = makeTempProject();

    const install = runBin(["plugin", "install", "--agent", "generic", "--scope", "user"], project, {
      HOME: home,
      USERPROFILE: home,
    });
    expect(install.status, install.stderr).toBe(0);
    expect(install.stdout).toContain(`config_path: ${join(home, ".agent", "mcp.json")}`.replace(/\//g, "\\"));
    expect(existsSync(join(home, ".agent", "mcp.json"))).toBe(true);
  });

  it("agente inválido sai 2 com usage", () => {
    const invalid = runBin(["plugin", "install", "--agent", "__inexistente__"], makeTempProject());
    expect(invalid.status).toBe(2);
    expect(invalid.stderr).toContain("invalid choice");
  });
});
