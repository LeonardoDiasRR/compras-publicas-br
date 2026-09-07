import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyOperations,
  compareCatalogs,
  loadOpenapi,
  renderCoverage,
} from "../src/features/catalogo/catalogo.js";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("catalogo", () => {
  it.each([
    ["compras", "specs/upstream/compras/2026-09-04.json", 73, 69],
    ["pncp", "specs/upstream/pncp/2026-09-04.json", 108, 100],
  ] as const)(
    "snapshot_inventory_is_classified [%s]",
    (source, snapshot, expectedGets, expectedPublic) => {
      const operations = classifyOperations(
        loadOpenapi(path.join(REPOSITORY_ROOT, snapshot)),
        source,
      );
      const gets = operations.filter((operation) => operation.method === "GET");
      const publicUseful = gets.filter(
        (operation) => operation.classification === "PUBLIC_USEFUL",
      );
      expect(gets).toHaveLength(expectedGets);
      expect(publicUseful).toHaveLength(expectedPublic);
      expect(gets.filter((operation) => operation.classification === "UNKNOWN")).toEqual([]);
    },
  );

  it("bearer_security_excludes_a_get_from_public_coverage", () => {
    const spec = { paths: { "/v1/usuarios/{id}": { get: { security: [{ bearerAuth: [] }] } } } };
    const operation = classifyOperations(spec, "pncp")[0];
    expect(operation.classification).toBe("AUTHENTICATED");
  });

  it("known_pncp_security_classifications_are_preserved", () => {
    const operations = classifyOperations(
      loadOpenapi(path.join(REPOSITORY_ROOT, "specs/upstream/pncp/2026-09-04.json")),
      "pncp",
    );
    const classifications = new Map(operations.map((o) => [o.path, o.classification]));
    expect(classifications.get("/v1/usuarios/{id}")).toBe("AUTHENTICATED");
    expect(classifications.get("/v1/modalidades")).toBe("PUBLIC_USEFUL");
  });

  it("diff_reports_a_new_path_and_coverage_requires_every_public_tool", () => {
    const previous = [
      { id: "pncp.GET./v1/removido", method: "GET", path: "/v1/removido" },
      { id: "pncp.GET./v1/alterado", method: "GET", path: "/v1/antigo" },
    ];
    const current = [
      { id: "pncp.GET./v1/adicionado", method: "GET", path: "/v1/adicionado" },
      { id: "pncp.GET./v1/alterado", method: "GET", path: "/v1/novo" },
    ];
    const diff = compareCatalogs(previous, current);
    expect(diff.added).toEqual([current[0]]);
    expect(diff.removed).toEqual([previous[0]]);
    expect(diff.changed).toEqual([current[1]]);
    const report = renderCoverage([
      { classification: "PUBLIC_USEFUL", implemented: false, tool: null },
    ]);
    expect(report.public_useful).toBe(1);
    expect(report.implemented).toBe(0);
    expect(report.ratio).toBe(0.0);
  });

  it("render_coverage_reports_full_coverage", () => {
    const report = renderCoverage([
      {
        classification: "PUBLIC_USEFUL",
        implemented: true,
        tool: "pncp_listar_modalidades",
      },
    ]);
    expect(report.public_useful).toBe(1);
    expect(report.implemented).toBe(1);
    expect(report.ratio).toBe(1.0);
  });
});
