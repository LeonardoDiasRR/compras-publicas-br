import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("scaffold", () => {
  it("expõe nome e versão do pacote", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.name).toBe("mcp-compras-publicas-br");
    expect(pkg.bin["mcp-compras-publicas-br"]).toBe("dist/index.js");
  });
});
