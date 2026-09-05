import pytest

from src.features.consultas.servico import normalize_cnpj, render_path


def test_normalize_cnpj_removes_punctuation_and_requires_fourteen_digits():
    assert normalize_cnpj("00.394.460/0001-41") == "00394460000141"
    with pytest.raises(ValueError, match="cnpj must contain 14 numeric digits"):
        normalize_cnpj("123")


def test_normalize_cnpj_rejects_non_digit_input():
    with pytest.raises(ValueError, match="cnpj must contain 14 numeric digits"):
        normalize_cnpj("abcdefghijklmn")


def test_normalize_cnpj_rejects_wrong_length():
    with pytest.raises(ValueError, match="cnpj must contain 14 numeric digits"):
        normalize_cnpj("123456789012345")


def test_render_path_renders_catalogued_path_parameters():
    assert render_path(
        "/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}",
        {"cnpj": "00394460000141", "ano": 2026, "sequencial": 3},
    ) == "/v1/orgaos/00394460000141/compras/2026/3"


def test_render_path_requires_all_placeholders():
    with pytest.raises(KeyError, match="ano"):
        render_path(
            "/v1/orgaos/{cnpj}/compras/{ano}",
            {"cnpj": "00394460000141"},
        )
