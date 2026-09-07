import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BIN = "dist/index.js";
const distReady = existsSync(BIN);

describe("scaffold", () => {
  it("expõe nome e versão do pacote", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.name).toBe("mcp-compras-publicas-br");
    expect(pkg.bin["mcp-compras-publicas-br"]).toBe(BIN);
  });

  // Regressão: o dispatcher cortava argv em slice(2) e perdia a operação do plugin
  // (`plugin install` morria com exit 2). Roda contra o bin real; exige npm run build.
  it.skipIf(!distReady)(
    "dispatcher preserva a operação do plugin no argv",
    () => {
      const help = spawnSync(process.execPath, [BIN, "plugin", "--help"], { encoding: "utf8" });
      expect(help.status).toBe(0);
      const invalid = spawnSync(process.execPath, [BIN, "plugin", "install", "--agent", "__nao__"], {
        encoding: "utf8",
      });
      expect(invalid.status).toBe(2);
      expect(invalid.stderr).toContain("invalid choice");
    }
  );
});
