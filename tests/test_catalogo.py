from pathlib import Path

import pytest
from src.features.catalogo.catalogo import (
    classify_operations,
    compare_catalogs,
    load_openapi,
    render_coverage,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize(
    ("source", "snapshot", "expected_gets", "expected_public"),
    [
        ("compras", "specs/upstream/compras/2026-09-04.json", 73, 69),
        ("pncp", "specs/upstream/pncp/2026-09-04.json", 108, 100),
    ],
)
def test_snapshot_inventory_is_classified(source, snapshot, expected_gets, expected_public):
    operations = classify_operations(load_openapi(REPOSITORY_ROOT / snapshot), source)
    gets = [operation for operation in operations if operation.method == "GET"]
    public = [operation for operation in gets if operation.classification == "PUBLIC_USEFUL"]
    assert len(gets) == expected_gets
    assert len(public) == expected_public
    assert not [operation for operation in gets if operation.classification == "UNKNOWN"]


def test_bearer_security_excludes_a_get_from_public_coverage():
    spec = {"paths": {"/v1/usuarios/{id}": {"get": {"security": [{"bearerAuth": []}]}}}}
    operation = classify_operations(spec, "pncp")[0]
    assert operation.classification == "AUTHENTICATED"


def test_known_pncp_security_classifications_are_preserved():
    operations = classify_operations(
        load_openapi(REPOSITORY_ROOT / "specs/upstream/pncp/2026-09-04.json"), "pncp"
    )
    classifications = {operation.path: operation.classification for operation in operations}
    assert classifications["/v1/usuarios/{id}"] == "AUTHENTICATED"
    assert classifications["/v1/modalidades"] == "PUBLIC_USEFUL"


def test_diff_reports_a_new_path_and_coverage_requires_every_public_tool():
    previous = [
        {"id": "pncp.GET./v1/removido", "method": "GET", "path": "/v1/removido"},
        {"id": "pncp.GET./v1/alterado", "method": "GET", "path": "/v1/antigo"},
    ]
    current = [
        {"id": "pncp.GET./v1/adicionado", "method": "GET", "path": "/v1/adicionado"},
        {"id": "pncp.GET./v1/alterado", "method": "GET", "path": "/v1/novo"},
    ]
    diff = compare_catalogs(previous, current)
    assert diff.added == [current[0]]
    assert diff.removed == [previous[0]]
    assert diff.changed == [current[1]]
    report = render_coverage(
        [{"classification": "PUBLIC_USEFUL", "implemented": False, "tool": None}]
    )
    assert report.public_useful == 1
    assert report.implemented == 0
    assert report.ratio == 0.0


def test_render_coverage_reports_full_coverage():
    report = render_coverage(
        [
            {
                "classification": "PUBLIC_USEFUL",
                "implemented": True,
                "tool": "pncp_listar_modalidades",
            }
        ]
    )
    assert report.public_useful == 1
    assert report.implemented == 1
    assert report.ratio == 1.0
