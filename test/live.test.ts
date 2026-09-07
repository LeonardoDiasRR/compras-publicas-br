import { expect, it } from "vitest";
import { ReadOnlyHttpClient } from "../src/shared/http_readonly.js";

const live = process.env.RUN_LIVE_TESTS === "1" ? it : it.skip;

live("pncp_modalidades_live", async () => {
  const client = new ReadOnlyHttpClient("https://pncp.gov.br/api/pncp", {
    maxRetries: 1,
    timeout: 5,
  });
  const response = await client.get("/v1/modalidades");

  expect(response).not.toBeNull();
});

live("compras_indicadores_consolidados_live", async () => {
  const client = new ReadOnlyHttpClient("https://dadosabertos.compras.gov.br", {
    maxRetries: 1,
    timeout: 5,
  });
  const response = await client.get(
    "/modulo-indicadores/1_consultarIndicadoresConsolidados"
  );

  expect(response).not.toBeNull();
});
