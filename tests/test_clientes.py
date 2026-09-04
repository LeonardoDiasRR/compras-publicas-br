from src.features.provedores.clientes import ComprasClient, PncpClient


def test_provider_clients_use_only_their_fixed_official_origins():
    assert ComprasClient.base_url == "https://dadosabertos.compras.gov.br"
    assert PncpClient.base_url == "https://pncp.gov.br/api/pncp"


def test_provider_client_normalizes_known_pagination_without_inventing_totals():
    page = PncpClient.normalize_page({"data": [{"id": 1}], "totalRegistros": 1})
    assert page["items"] == [{"id": 1}]
    assert page["pagination"]["total_items"] == 1
    assert "total_pages" not in page["pagination"]


def test_provider_client_normalizes_list_payload_without_inventing_totals():
    page = PncpClient.normalize_page([{"id": 1}])
    assert page["items"] == [{"id": 1}]
    assert "total_items" not in page["pagination"]
    assert "total_pages" not in page["pagination"]


def test_provider_client_normalizes_object_without_total_registros_without_inventing_totals():
    page = PncpClient.normalize_page({"data": [{"id": 1}]})
    assert page["items"] == [{"id": 1}]
    assert "total_items" not in page["pagination"]
    assert "total_pages" not in page["pagination"]
