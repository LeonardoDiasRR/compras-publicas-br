import { afterAll, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  statSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  atomicWrite,
  loadDocument,
  mergeMcpEntry,
  removeMcpEntry,
} from "../src/features/plugin/armazenamento.js";
import { ConfigFormatError } from "../src/features/plugin/modelo.js";

const tempDirs: string[] = [];

function mkTmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "plugin-storage-"));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ponytail: deep equality via JSON; fixtures always build compared objects
// from the same literal key order, same as python `==` cases here.
function deepEq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type Doc = Record<string, unknown>;

const ENTRY: Doc = { command: "uvx", args: ["--from", "mcp-compras-publicas-br==0.1.0"] };

describe("load_document / merge_mcp_entry", () => {
  it("merge json preserva servidores não relacionados", () => {
    const dir = mkTmp();
    const path = join(dir, "mcp.json");
    writeFileSync(path, JSON.stringify({ mcpServers: { other: { command: "other" } } }), "utf-8");

    const document = loadDocument(path, "json") as Doc;
    const [merged, changed] = mergeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      ENTRY,
      (value: unknown) => deepEq(value, ENTRY),
    );

    expect(changed).toBe(true);
    expect((merged as Doc).mcpServers).toEqual({
      other: { command: "other" },
      "compras-publicas-br": ENTRY,
    });
    expect(((merged as Doc).mcpServers as Doc).other).toEqual({ command: "other" });
    expect(((merged as Doc).mcpServers as Doc)["compras-publicas-br"]).toEqual(ENTRY);
  });

  it("documento json5 carrega comentários e vírgulas finais", () => {
    const dir = mkTmp();
    const path = join(dir, "mcp.json5");
    writeFileSync(
      path,
      "{\n" +
        "  // Keep JSON5 syntax in the fixture.\n" +
        "  mcpServers: {\n" +
        '    example: { command: "uvx", args: ["--from", "pkg",], },\n' +
        "  },\n" +
        "}\n",
      "utf-8",
    );

    expect(loadDocument(path, "json5")).toEqual({
      mcpServers: { example: { command: "uvx", args: ["--from", "pkg"] } },
    });
  });

  it("documento toml carrega tabelas aninhadas", () => {
    const dir = mkTmp();
    const path = join(dir, "mcp.toml");
    writeFileSync(
      path,
      '[mcpServers.example]\ncommand = "uvx"\nargs = ["--from", "pkg"]\n',
      "utf-8",
    );

    expect(loadDocument(path, "toml")).toEqual({
      mcpServers: { example: { command: "uvx", args: ["--from", "pkg"] } },
    });
  });

  it.each([
    ["json5" as const, "{ mcpServers: }"],
    ["toml" as const, '[mcpServers.example\ncommand = "uvx"'],
  ])("json5/toml inválido lança sem alterar o arquivo (%s)", (format, content) => {
    const dir = mkTmp();
    const path = join(dir, `invalid.${format}`);
    writeFileSync(path, content, "utf-8");

    expect(() => loadDocument(path, format)).toThrow(ConfigFormatError);
    expect(readFileSync(path, "utf-8")).toBe(content);
  });
});

describe("merge_mcp_entry", () => {
  it("entrada existente não reconhecida não é sobrescrita", () => {
    const document: Doc = { mcpServers: { "compras-publicas-br": { command: "custom" } } };

    const [merged, changed] = mergeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      ENTRY,
      (value: unknown) => deepEq(value, ENTRY),
    );

    expect(merged).toEqual(document);
    expect(changed).toBe(false);
  });

  it("entrada existente reconhecida é substituída", () => {
    const current: Doc = { command: "old" };
    const entry: Doc = { command: "new", args: ["--from", "pkg"] };
    const document: Doc = { mcpServers: { "compras-publicas-br": current, other: {} } };

    const [merged, changed] = mergeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      entry,
      (value: unknown) => deepEq(value, current),
    );

    expect(changed).toBe(true);
    expect(((merged as Doc).mcpServers as Doc)["compras-publicas-br"]).toEqual(entry);
    expect(((merged as Doc).mcpServers as Doc).other).toEqual({});
  });

  it("mesclar a mesma entrada reconhecida é idempotente", () => {
    const entry: Doc = { command: "uvx", args: ["--from", "pkg"] };
    const document: Doc = { mcpServers: { "compras-publicas-br": entry, other: {} } };

    const [merged, changed] = mergeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      entry,
      (value: unknown) => deepEq(value, entry),
    );

    expect(changed).toBe(false);
    expect(merged).toEqual(document);
  });

  it("merge cria caminho de container ausente", () => {
    const document: Doc = { other: { keep: true } };
    const entry: Doc = { command: "uvx" };

    const [merged, changed] = mergeMcpEntry(
      document,
      ["settings", "mcpServers"],
      "compras-publicas-br",
      entry,
      (value: unknown) => deepEq(value, entry),
    );

    expect(changed).toBe(true);
    expect((merged as Doc).other).toEqual({ keep: true });
    expect(
      ((((merged as Doc).settings as Doc).mcpServers as Doc)["compras-publicas-br"]),
    ).toEqual(entry);
  });
});

describe("load_document / atomic_write", () => {
  it("json inválido lança sem alterar o arquivo", () => {
    const dir = mkTmp();
    const path = join(dir, "mcp.json");
    const original = "{invalid json";
    writeFileSync(path, original, "utf-8");

    expect(() => loadDocument(path, "json")).toThrow(ConfigFormatError);
    expect(readFileSync(path, "utf-8")).toBe(original);
  });

  it("atomic_write substitui o arquivo sem deixar arquivo temporário", () => {
    const dir = mkTmp();
    const path = join(dir, "config.json");
    atomicWrite(path, '{"ok": true}\n');

    expect(readFileSync(path, "utf-8")).toBe('{"ok": true}\n');
    expect(readdirSync(dir)).toEqual(["config.json"]);
  });

  // ponytail: python monkeypatchs os.replace; ES imports can't be spied, so
  // force a natural rename failure (target is a directory) instead — asserts
  // the same observable: error propagates and no temp file is left behind.
  it("atomic_write remove o arquivo temporário quando a substituição falha", () => {
    const dir = mkTmp();
    const path = join(dir, "config.json");
    mkdirSync(path);
    const before = readdirSync(dir);

    expect(() => atomicWrite(path, '{"ok": true}\n')).toThrow();

    expect(readdirSync(dir)).toEqual(before);
  });

  // ponytail: POSIX-only as in python (skipif sys.platform == "win32")
  const itPosix = process.platform === "win32" ? it.skip : it;
  itPosix("atomic_write preserva permissões de arquivo existente", () => {
    const dir = mkTmp();
    const path = join(dir, "config.json");
    writeFileSync(path, '{"old": true}\n', "utf-8");
    chmodSync(path, 0o600);

    atomicWrite(path, '{"ok": true}\n');

    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});

describe("remove_mcp_entry", () => {
  it("remove apenas a entrada correspondente", () => {
    const document: Doc = {
      mcpServers: { "compras-publicas-br": { command: "uvx" }, other: {} },
    };

    const [result, removed] = removeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      (value: unknown) => deepEq(value, { command: "uvx" }),
    );

    expect(removed).toBe(true);
    expect(result).toEqual({ mcpServers: { other: {} } });
  });

  it("entrada não reconhecida é preservada ao remover", () => {
    const document: Doc = {
      mcpServers: { "compras-publicas-br": { command: "custom" }, other: {} },
    };

    const [result, removed] = removeMcpEntry(
      document,
      ["mcpServers"],
      "compras-publicas-br",
      (value: unknown) => deepEq(value, { command: "uvx" }),
    );

    expect(removed).toBe(false);
    expect(result).toEqual(document);
  });
});
