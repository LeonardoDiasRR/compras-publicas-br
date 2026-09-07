import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { PluginError } from "../src/features/plugin/modelo.js";
import {
  PACKAGE_NAME,
  installedVersion,
  latestStableVersion,
  versionedCommand,
} from "../src/features/plugin/versoes.js";

const packageVersion = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

// ponytail: test_installed_version_reads_package metadata monkeypatchava importlib.metadata;
// sem equivalente no npm — installedVersion lê package.json, então verificamos o valor real.
describe("installedVersion", () => {
  it("lê a versão do pacote instalado (package.json)", () => {
    expect(installedVersion()).toMatch(/^\d+\.\d+\.\d+/);
    expect(installedVersion()).toBe(packageVersion);
  });
});

describe("versionedCommand", () => {
  it("fixa a release exata via npx", () => {
    expect(versionedCommand("0.1.0")).toEqual(["npx", "-y", `${PACKAGE_NAME}@0.1.0`]);
    expect(versionedCommand("1.2.3")).toEqual(["npx", "-y", "mcp-compras-publicas-br@1.2.3"]);
  });
});

describe("latestStableVersion", () => {
  // ponytail: PyPI releases-doc → npm dist-tags: a busca por pré-release/yanked vira
  // checagem única de dist-tags.latest (sem conceito de yanked/dev-release no npm).
  it("retorna o dist-tag latest estável", async () => {
    const payload = { "dist-tags": { latest: "1.2.3" } };
    await expect(latestStableVersion(async () => payload)).resolves.toBe("1.2.3");
  });

  it("rejeita quando o latest é pré-release", async () => {
    const payload = { "dist-tags": { latest: "2.0.0-beta.1" } };
    await expect(latestStableVersion(async () => payload)).rejects.toThrow(
      new PluginError("No stable package release was found"),
    );
  });

  // ponytail: drops test_latest_stable_version_skips_unavailable_stable_releases,
  // test_latest_stable_version_accepts_mixed_yanked_files e
  // test_latest_stable_version_skips_malformed_yanked_metadata — npm não tem yanked.

  it("falha quando o fetcher lança erro", async () => {
    await expect(
      latestStableVersion(async () => {
        throw new Error("network down");
      }),
    ).rejects.toThrow(/Could not fetch package releases/);
  });

  it.each([
    ["payload vazio", {}],
    ["sem dist-tags", { "dist-tags": {} }],
    ["latest ausente", { "dist-tags": { next: "1.0.0" } }],
    ["latest não-string", { "dist-tags": { latest: 42 } }],
    ["dist-tags não-objeto", { "dist-tags": "1.2.3" }],
    ["payload não-objeto", "not-an-object"],
    ["payload array", []],
    ["payload null", null],
  ])("rejeita payload inválido ou sem release estável: %s", async (_name, payload) => {
    await expect(latestStableVersion(async () => payload)).rejects.toThrow(PluginError);
  });
});
