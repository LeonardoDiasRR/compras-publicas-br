import { describe, expect, it } from "vitest";
import { ComprasClient, PncpClient } from "../src/features/provedores/clientes.js";

describe("clientes", () => {
  it("provider_clients_use_only_their_fixed_official_origins", async () => {
    expect(ComprasClient.baseUrl).toBe("https://dadosabertos.compras.gov.br");
    expect(PncpClient.baseUrl).toBe("https://pncp.gov.br/api/pncp");
  });

  it("provider_client_normalizes_known_pagination_without_inventing_totals", async () => {
    const page = PncpClient.normalizePage({ data: [{ id: 1 }], totalRegistros: 1 });
    expect(page.items).toEqual([{ id: 1 }]);
    expect(page.pagination["total_items"]).toBe(1);
    expect(page.pagination).not.toHaveProperty("total_pages");
  });

  it("provider_client_normalizes_list_payload_without_inventing_totals", async () => {
    const page = PncpClient.normalizePage([{ id: 1 }]);
    expect(page.items).toEqual([{ id: 1 }]);
    expect(page.pagination).not.toHaveProperty("total_items");
    expect(page.pagination).not.toHaveProperty("total_pages");
  });

  it("provider_client_normalizes_object_without_total_registros_without_inventing_totals", async () => {
    const page = PncpClient.normalizePage({ data: [{ id: 1 }] });
    expect(page.items).toEqual([{ id: 1 }]);
    expect(page.pagination).not.toHaveProperty("total_items");
    expect(page.pagination).not.toHaveProperty("total_pages");
  });

  // ponytail: python nunca testou client() nem max_document_bytes; nada a portar aqui.
});
