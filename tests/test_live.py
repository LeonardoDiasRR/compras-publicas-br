import os

import pytest

from src.shared.http_readonly import ReadOnlyHttpClient

pytestmark = [
    pytest.mark.live,
    pytest.mark.skipif(
        os.getenv("RUN_LIVE_TESTS") != "1",
        reason="set RUN_LIVE_TESTS=1 to run live upstream probes",
    ),
]


async def test_pncp_modalidades_live() -> None:
    async with ReadOnlyHttpClient(
        "https://pncp.gov.br/api/pncp", max_retries=1, timeout=5
    ) as client:
        response = await client.get("/v1/modalidades")

    assert response is not None


async def test_compras_indicadores_consolidados_live() -> None:
    async with ReadOnlyHttpClient(
        "https://dadosabertos.compras.gov.br", max_retries=1, timeout=5
    ) as client:
        response = await client.get("/modulo-indicadores/1_consultarIndicadoresConsolidados")

    assert response is not None
