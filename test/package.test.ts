import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as {
  version: string;
  bin?: Record<string, string>;
  files?: string[];
};

// Equivalente TS de tests/test_plugin_package.py: console_scripts -> bin,
// importlib.resources -> artefatos em dist/, packaging.Version -> regex semver estável.
describe("pacagem do plugin", () => {
  it("entry point do console está registrado em bin", () => {
    expect(pkg.bin?.["mcp-compras-publicas-br"]).toBe("dist/index.js");
  });

  it("files inclui dist e version é semver estável", () => {
    expect(pkg.files).toContain("dist");
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  const distMissing =
    !existsSync("dist/index.js") ||
    !existsSync("dist/features/plugin/templates/skill.md");
  if (distMissing) {
    console.warn("[package.test] dist/ ausente — rode `npm run build` antes deste teste");
  }

  describe.skipIf(distMissing)("artefatos de dist", () => {
    it("dist/index.js existe com shebang", () => {
      const firstLine = readFileSync("dist/index.js", "utf8").split("\n", 1)[0];
      expect(firstLine.startsWith("#!")).toBe(true);
    });

    it("template skill.md está nos recursos do pacote", () => {
      const skill = readFileSync("dist/features/plugin/templates/skill.md", "utf8");
      expect(skill).toContain("managed-by: mcp-compras-publicas-br");
      for (const token of ["{{AGENT_ID}}", "{{AGENT_NAME}}", "{{SCOPE}}"]) {
        expect(skill).toContain(token);
      }
    });
  });
});
