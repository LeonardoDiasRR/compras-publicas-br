import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ponytail: run_operation não é spyável em ESM (binding interno do módulo);
// dirige o installer real em diretórios temporários (teste de comportamento)
// e afirma o escopo via linha "scope: ..." das 7 linhas de resultado.
import { main } from "../src/features/plugin/cli.js";

const tempDirs: string[] = [];
const originalCwd = process.cwd();
const originalHome = process.env.HOME;
const originalUserProfile = process.env.USERPROFILE;

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "plugin-cli-"));
  tempDirs.push(dir);
  return dir;
}

function captureStreams(): { out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    out.push(String(chunk));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    err.push(String(chunk));
    return true;
  });
  return { out, err };
}

afterEach(() => {
  process.chdir(originalCwd);
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  if (originalUserProfile === undefined) delete process.env.USERPROFILE;
  else process.env.USERPROFILE = originalUserProfile;
  vi.restoreAllMocks();
});

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("plugin cli", () => {
  it("agent é obrigatório", async () => {
    captureStreams();
    expect(await main(["install"])).toBe(2);
  });

  it("escopo padrão é project", async () => {
    const tmp = mkTmp();
    mkdirSync(join(tmp, ".git"), { recursive: true });
    process.chdir(tmp);
    const { out } = captureStreams();

    expect(await main(["install", "--agent", "generic"])).toBe(0);
    expect(out.join("")).toContain("scope: project");
  });

  it("escopo user é repassado", async () => {
    const tmp = mkTmp();
    const home = join(tmp, "home");
    mkdirSync(home, { recursive: true });
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    process.chdir(mkTmp());
    const { out } = captureStreams();

    expect(await main(["uninstall", "--agent", "codex", "--scope", "user"])).toBe(0);
    expect(out.join("")).toContain("scope: user");
  });
});
