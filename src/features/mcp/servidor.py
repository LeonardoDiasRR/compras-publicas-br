from __future__ import annotations

import argparse
import json
import re
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any, cast

import yaml
from fastmcp import FastMCP
from fastmcp.tools.function_tool import FunctionTool

from src.features.catalogo.models import Operation
from src.features.consultas.servico import QueryService

DEFAULT_MANIFEST = Path("coverage/endpoints.yaml")
_SOURCES = ("compras", "pncp")
_SEARCH_NAMES = {
    "texto",
    "termo",
    "objeto",
    "descricao",
    "palavra",
    "keyword",
    "q",
}
_IDENTIFIER_NAMES = (
    "numeroControlePNCP",
    "numeroControlePncp",
    "numeroControlePncpCompra",
    "numero_controle_pncp",
    "idCompra",
    "id_compra",
)
_PAGE_NAMES = {"pagina", "page"}
_PAGE_SIZE_NAMES = {"tamanhoPagina", "tamanho_pagina", "pageSize", "page_size"}
_TOKEN_NAMES = {
    "pageToken",
    "page_token",
    "cursor",
    "cursorToken",
    "continuationToken",
    "nextToken",
    "token",
}


def _load_manifest(path: Path | None) -> dict[str, Any]:
    if path is None:
        return {"endpoints": []}
    value: Any = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain an endpoints list")
    manifest = cast(dict[str, Any], value)
    if not isinstance(manifest.get("endpoints"), list):
        raise ValueError(f"{path} must contain an endpoints list")
    return manifest


def _endpoints(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    return [cast(dict[str, Any], item) for item in cast(list[Any], manifest["endpoints"])]


def openapi_parameters_to_json_schema(
    parameters: list[dict[str, Any]],
) -> dict[str, Any]:
    properties: dict[str, Any] = {}
    required: list[str] = []
    for parameter in parameters:
        name = parameter.get("name")
        if not isinstance(name, str) or parameter.get("in") not in {"path", "query"}:
            continue
        raw_schema = parameter.get("schema", {"type": "string"})
        schema = dict(cast(dict[str, Any], raw_schema)) if isinstance(raw_schema, dict) else {
            "type": "string"
        }
        if isinstance(parameter.get("description"), str) and "description" not in schema:
            schema["description"] = parameter["description"]
        if "example" in parameter and "example" not in schema:
            schema["example"] = parameter["example"]
        properties[name] = schema
        if parameter.get("required") is True:
            required.append(name)
    parameter_names = set(properties)
    has_page = bool(parameter_names & _PAGE_NAMES)
    has_page_size = bool(parameter_names & _PAGE_SIZE_NAMES)
    has_pagination = has_page or has_page_size or bool(parameter_names & _TOKEN_NAMES)
    if has_page:
        page_schema = next(
            (
                dict(cast(dict[str, Any], properties[name]))
                for name in _PAGE_NAMES
                if isinstance(properties.get(name), dict)
            ),
            {"type": "integer", "description": "Número da página."},
        )
        for name in _PAGE_NAMES:
            properties.setdefault(name, dict(page_schema))
    if has_page_size:
        page_size_schema = next(
            (
                dict(cast(dict[str, Any], properties[name]))
                for name in _PAGE_SIZE_NAMES
                if isinstance(properties.get(name), dict)
            ),
            {"type": "integer", "description": "Quantidade de registros por página."},
        )
        for name in _PAGE_SIZE_NAMES:
            properties.setdefault(name, dict(page_size_schema))
    properties.setdefault(
        "formato",
        {
            "type": "string",
            "enum": ["normalizado", "original"],
            "default": "normalizado",
            "description": "Formato da resposta: normalizado ou payload original.",
        },
    )
    if has_pagination:
        properties.setdefault(
            "limite_resultados",
            {
                "type": "integer",
                "minimum": 1,
                "description": "Limite máximo de resultados agregados.",
            },
        )
    if has_page or bool(parameter_names & _TOKEN_NAMES):
        properties.setdefault(
            "auto_paginar",
            {
                "type": "boolean",
                "default": False,
                "description": "Percorre as páginas seguintes enquanto houver próxima página.",
            },
        )
    return {
        "type": "object",
        "properties": properties,
        "required": required,
        "additionalProperties": False,
    }


def _eligible(endpoint: dict[str, Any]) -> bool:
    return endpoint.get("classification") == "PUBLIC_USEFUL" and endpoint.get("implemented") is True


def _operations(
    endpoints: list[dict[str, Any]],
    predicate: Callable[[dict[str, Any]], bool] | None = None,
) -> list[Operation]:
    selected = [endpoint for endpoint in endpoints if _eligible(endpoint)]
    if predicate is not None:
        selected = [endpoint for endpoint in selected if predicate(endpoint)]
    return [Operation.model_validate(endpoint) for endpoint in selected]


def _add_atomic_tool(server: FastMCP, service: QueryService, operation: Operation) -> None:
    if not operation.tool:
        raise ValueError(f"implemented public endpoint has no tool name: {operation.id}")
    _validate_tool_name(operation.tool)

    async def consultar(**arguments: Any) -> dict[str, Any]:
        return (await service.execute(operation, arguments)).model_dump(mode="json")

    server.add_tool(
        FunctionTool(
            fn=consultar,
            name=operation.tool,
            description=operation.description,
            parameters=openapi_parameters_to_json_schema(operation.parameters),
        )
    )


def _validate_tool_name(name: str) -> None:
    if len(name) > 128:
        raise ValueError(f"MCP tool name exceeds the maximum length of 128 characters: {name!r}")


def _add_function_tool(server: FastMCP, name: str, function: Callable[..., Any]) -> None:
    _validate_tool_name(name)
    server.add_tool(FunctionTool.from_function(function, name=name))


def _json_value(value: Any) -> Any:
    return json.loads(json.dumps(value, ensure_ascii=False, default=str))


def _snapshot_metadata(manifest: dict[str, Any]) -> dict[str, Any]:
    value = manifest.get("source_version")
    sources = cast(dict[str, Any], value) if isinstance(value, dict) else {}
    snapshots: dict[str, Any] = {}
    for source in _SOURCES:
        source_value = sources.get(source)
        if isinstance(source_value, dict):
            source_mapping = cast(dict[str, Any], source_value)
            snapshots[source] = source_mapping.get("snapshot")
    return snapshots


def _last_snapshot(manifest: dict[str, Any]) -> str | None:
    result: list[str] = []
    for _source, snapshot in _snapshot_metadata(manifest).items():
        match = re.search(r"\d{4}-\d{2}-\d{2}", str(snapshot))
        if match:
            result.append(match.group(0))
    return max(result) if result else None


def _domain_names(endpoints: list[dict[str, Any]], provider: str) -> list[str]:
    domains: set[str] = set()
    for endpoint in endpoints:
        if endpoint.get("provider") != provider:
            continue
        metadata_value = endpoint.get("operation_metadata")
        metadata = cast(dict[str, Any], metadata_value) if isinstance(metadata_value, dict) else {}
        tags_value = metadata.get("tags")
        tags = cast(list[Any], tags_value) if isinstance(tags_value, list) else []
        domains.update(str(tag) for tag in tags if str(tag).strip())
        path_parts = [part for part in str(endpoint.get("path", "")).split("/") if part]
        if path_parts:
            domain = (
                path_parts[1]
                if path_parts[0].startswith("v") and len(path_parts) > 1
                else path_parts[0]
            )
            domains.add(domain)
    return sorted(domains)


def _coverage(endpoints: list[dict[str, Any]], provider: str | None = None) -> dict[str, Any]:
    selected = [
        endpoint
        for endpoint in endpoints
        if provider is None or endpoint.get("provider") == provider
    ]
    public = [
        endpoint for endpoint in selected if endpoint.get("classification") == "PUBLIC_USEFUL"
    ]
    implemented = [endpoint for endpoint in public if endpoint.get("implemented") is True]
    ratio = len(implemented) / len(public) if public else 1.0
    return {
        "provider": provider,
        "public_endpoints": len(public),
        "implemented_endpoints": len(implemented),
        "coverage": ratio,
    }


def _path_matches(endpoint: dict[str, Any], pattern: str) -> bool:
    return (
        endpoint.get("provider") == "pncp"
        and re.match(pattern, str(endpoint.get("path", ""))) is not None
    )


def _required_parameters_available(endpoint: dict[str, Any], names: set[str]) -> bool:
    parameters_value = endpoint.get("parameters", [])
    parameters = cast(list[Any], parameters_value) if isinstance(parameters_value, list) else []
    return all(
        not isinstance(parameter, dict)
        or not cast(dict[str, Any], parameter).get("required", False)
        or cast(dict[str, Any], parameter).get("name") in names
        for parameter in parameters
    )


def _search_candidate(endpoint: dict[str, Any]) -> bool:
    parameters_value = endpoint.get("parameters", [])
    parameters = (
        cast(list[Any], parameters_value) if isinstance(parameters_value, list) else []
    )
    return any(
        isinstance(parameter, dict)
        and str(cast(dict[str, Any], parameter).get("name", "")).lower() in _SEARCH_NAMES
        for parameter in parameters
    )


def _search_arguments(
    texto: str,
    orgao: str | None,
    uasg: int | None,
    cnpj: str | None,
    modalidade: int | None,
    data_inicio: str | None,
    data_fim: str | None,
    codigo_material: int | None,
    codigo_servico: int | None,
) -> dict[str, Any]:
    return {
        "texto": texto,
        "termo": texto,
        "objeto": texto,
        "descricao": texto,
        "palavra": texto,
        "keyword": texto,
        "q": texto,
        "orgao": orgao,
        "uasg": uasg,
        "cnpj": cnpj,
        "modalidade": modalidade,
        "data_inicio": data_inicio,
        "dataInicio": data_inicio,
        "data_publicacao_min": data_inicio,
        "data_fim": data_fim,
        "dataFim": data_fim,
        "data_publicacao_max": data_fim,
        "codigo_material": codigo_material,
        "codigoMaterial": codigo_material,
        "codigo_servico": codigo_servico,
        "codigoServico": codigo_servico,
    }


def _records(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, Mapping):
        mapping = cast(Mapping[str, Any], value)
        data = mapping.get("data")
        if isinstance(data, list):
            data_items = cast(list[Any], data)
            return [cast(dict[str, Any], item) for item in data_items if isinstance(item, dict)]
        if isinstance(data, dict):
            return [cast(dict[str, Any], data)]
    return []


def _with_overlap_marker(results: dict[str, Any]) -> dict[str, Any]:
    seen: dict[str, list[dict[str, str]]] = {}
    for tool, value in results.items():
        if not isinstance(value, dict):
            continue
        result = cast(dict[str, Any], value)
        source = str(result.get("source", ""))
        for record in _records(value):
            for identifier in _IDENTIFIER_NAMES:
                raw_id = record.get(identifier)
                if raw_id is not None and str(raw_id).strip():
                    seen.setdefault(str(raw_id), []).append({"source": source, "tool": tool})
                    break
    references = [
        reference
        for refs in seen.values()
        if len({item["source"] for item in refs}) > 1
        for reference in refs
    ]
    if references:
        results["possible_same_record"] = True
        results["references"] = references
    return results


def _register_composites(
    server: FastMCP,
    service: QueryService,
    endpoints: list[dict[str, Any]],
    atomic_names: set[str],
) -> None:
    def add(name: str, fn: Any) -> None:
        if name not in atomic_names:
            _add_function_tool(server, name, cast(Callable[..., Any], fn))

    contract_operations = _operations(
        endpoints,
        lambda endpoint: _path_matches(
            endpoint,
            r"^/v1/orgaos/\{cnpj\}/compras/\{(?:ano|anoCompra)\}/\{(?:sequencial|sequencialCompra)\}(?:/|$)",
        )
        and _required_parameters_available(
            endpoint, {"cnpj", "ano", "anoCompra", "sequencial", "sequencialCompra"}
        ),
    )
    if contract_operations:

        async def pncp_obter_contratacao_completa(
            cnpj: str, ano: int, sequencial_contratacao: int
        ) -> dict[str, Any]:
            """Consulta os recursos públicos relacionados a uma contratação PNCP."""
            return await service.execute_many(
                contract_operations,
                {
                    "cnpj": cnpj,
                    "ano": ano,
                    "anoCompra": ano,
                    "sequencial": sequencial_contratacao,
                    "sequencialCompra": sequencial_contratacao,
                },
            )

        add("pncp_obter_contratacao_completa", pncp_obter_contratacao_completa)

    ata_operations = _operations(
        endpoints,
        lambda endpoint: _path_matches(
            endpoint,
            r"^/v1/orgaos/\{cnpj\}/compras/\{(?:ano|anoCompra)\}/\{(?:sequencial|sequencialCompra)\}/atas/\{sequencialAta\}(?:/|$)",
        )
        and _required_parameters_available(
            endpoint,
            {"cnpj", "ano", "anoCompra", "sequencial", "sequencialCompra", "sequencialAta"},
        ),
    )
    if ata_operations:

        async def pncp_obter_ata_completa(
            cnpj: str, ano: int, sequencial_contratacao: int, sequencial_ata: int
        ) -> dict[str, Any]:
            """Consulta os recursos públicos relacionados a uma ata PNCP."""
            return await service.execute_many(
                ata_operations,
                {
                    "cnpj": cnpj,
                    "ano": ano,
                    "anoCompra": ano,
                    "sequencial": sequencial_contratacao,
                    "sequencialCompra": sequencial_contratacao,
                    "sequencialAta": sequencial_ata,
                },
            )

        add("pncp_obter_ata_completa", pncp_obter_ata_completa)

    contrato_operations = _operations(
        endpoints,
        lambda endpoint: _path_matches(
            endpoint,
            r"^/v1/orgaos/\{cnpj\}/contratos/\{(?:ano|anoContratacao)\}/\{(?:sequencial|sequencialContrato)\}(?:/|$)",
        )
        and _required_parameters_available(
            endpoint, {"cnpj", "ano", "anoContratacao", "sequencial", "sequencialContrato"}
        ),
    )
    if contrato_operations:

        async def pncp_obter_contrato_completo(
            cnpj: str, ano: int, sequencial_contrato: int
        ) -> dict[str, Any]:
            """Consulta os recursos públicos relacionados a um contrato PNCP."""
            return await service.execute_many(
                contrato_operations,
                {
                    "cnpj": cnpj,
                    "ano": ano,
                    "anoContratacao": ano,
                    "sequencial": sequencial_contrato,
                    "sequencialContrato": sequencial_contrato,
                },
            )

        add("pncp_obter_contrato_completo", pncp_obter_contrato_completo)

    search_operations = _operations(
        endpoints,
        lambda endpoint: _search_candidate(endpoint)
        and _required_parameters_available(
            endpoint,
            {
                "texto",
                "termo",
                "objeto",
                "descricao",
                "palavra",
                "keyword",
                "q",
                "orgao",
                "uasg",
                "cnpj",
                "modalidade",
                "data_inicio",
                "dataInicio",
                "data_publicacao_min",
                "data_fim",
                "dataFim",
                "data_publicacao_max",
                "codigo_material",
                "codigoMaterial",
                "codigo_servico",
                "codigoServico",
            },
        ),
    )
    if search_operations:

        async def buscar_compras_publicas(
            texto: str,
            orgao: str | None = None,
            uasg: int | None = None,
            cnpj: str | None = None,
            modalidade: int | None = None,
            data_inicio: str | None = None,
            data_fim: str | None = None,
            codigo_material: int | None = None,
            codigo_servico: int | None = None,
            fonte: str = "todas",
        ) -> dict[str, Any]:
            """Pesquisa compras públicas nas fontes catalogadas sem deduplicar resultados."""
            if fonte not in {"compras", "pncp", "todas"}:
                raise ValueError("fonte must be compras, pncp or todas")
            selected = [
                operation
                for operation in search_operations
                if fonte == "todas" or operation.provider == fonte
            ]
            results = await service.execute_many(
                selected,
                _search_arguments(
                    texto,
                    orgao,
                    uasg,
                    cnpj,
                    modalidade,
                    data_inicio,
                    data_fim,
                    codigo_material,
                    codigo_servico,
                ),
            )
            return _with_overlap_marker(results)

        add("buscar_compras_publicas", buscar_compras_publicas)


def build_server(manifest_path: Path | None) -> FastMCP:
    manifest = _load_manifest(manifest_path)
    endpoints = _endpoints(manifest)
    service = QueryService()
    server = FastMCP("MCP Compras Públicas Brasil")
    operations = _operations(endpoints)
    for operation in operations:
        _add_atomic_tool(server, service, operation)
    atomic_names = {operation.tool for operation in operations if operation.tool}

    def listar_capacidades_mcp() -> dict[str, Any]:
        """Retorna fontes, domínios, cobertura e versão do catálogo MCP."""
        return _json_value(
            {
                "sources": list(_SOURCES),
                "domains": {
                    source: _domain_names(endpoints, source) for source in _SOURCES
                },
                "atomic_tools": len(operations),
                "endpoints": len(endpoints),
                "version": manifest.get("catalog_version"),
                "last_snapshot": _last_snapshot(manifest),
            }
        )
    _add_function_tool(server, "listar_capacidades_mcp", listar_capacidades_mcp)

    async def verificar_saude_fontes() -> dict[str, str]:
        """Executa probes públicos leves catalogados e informa a saúde de cada fonte."""
        probes = {
            "compras": "/modulo-indicadores/1_consultarIndicadoresConsolidados",
            "pncp": "/v1/modalidades",
        }
        statuses: dict[str, str] = {}
        for source, path in probes.items():
            candidates = _operations(
                endpoints,
                lambda endpoint, source=source, path=path: endpoint.get("provider") == source
                and endpoint.get("path") == path,
            )
            if not candidates:
                statuses[source] = "unavailable"
                continue
            try:
                await service.execute(candidates[0], {})
            except Exception:
                statuses[source] = "unavailable"
            else:
                statuses[source] = "operational"
        return statuses
    _add_function_tool(server, "verificar_saude_fontes", verificar_saude_fontes)

    def mcp_coverage() -> dict[str, Any]:
        """Expõe a cobertura atômica geral e por fonte, incluindo o total público."""
        overall = _coverage(endpoints)
        result = {source: _coverage(endpoints, source) for source in _SOURCES}
        result["overall"] = {
            "coverage": overall["coverage"],
            "public_endpoints": overall["public_endpoints"],
            "implemented_endpoints": overall["implemented_endpoints"],
        }
        result["public_endpoints"] = overall["public_endpoints"]
        return _json_value(result)
    server.resource("mcp://coverage")(mcp_coverage)

    def compras_coverage() -> dict[str, Any]:
        """Expõe a cobertura dos endpoints públicos úteis do Compras.gov.br."""
        return _json_value(_coverage(endpoints, "compras"))
    server.resource("compras://coverage")(compras_coverage)

    def compras_providers() -> dict[str, Any]:
        """Expõe as fontes catalogadas, seus snapshots e quantidades de endpoints."""
        return _json_value(
            {
                source: {
                    "snapshot": _snapshot_metadata(manifest).get(source),
                    "endpoints": len([e for e in endpoints if e.get("provider") == source]),
                }
                for source in _SOURCES
            }
        )
    server.resource("compras://providers")(compras_providers)

    def compras_endpoints() -> list[dict[str, Any]]:
        """Expõe o manifesto de endpoints catalogados em formato JSON."""
        return _json_value(endpoints)
    server.resource("compras://endpoints")(compras_endpoints)

    def compras_domains() -> dict[str, Any]:
        """Expõe os domínios identificados no catálogo do Compras.gov.br."""
        return _json_value({"provider": "compras", "domains": _domain_names(endpoints, "compras")})
    server.resource("compras://domains")(compras_domains)

    def pncp_domains() -> dict[str, Any]:
        """Expõe os domínios identificados no catálogo do PNCP."""
        return _json_value({"provider": "pncp", "domains": _domain_names(endpoints, "pncp")})
    server.resource("pncp://domains")(pncp_domains)

    def pncp_api_version() -> dict[str, Any]:
        """Expõe a versão OpenAPI e o snapshot catalogado do PNCP."""
        source_version = manifest.get("source_version")
        source = (
            cast(dict[str, Any], source_version).get("pncp")
            if isinstance(source_version, dict)
            else None
        )
        return _json_value(source if isinstance(source, dict) else {})
    server.resource("pncp://api-version")(pncp_api_version)

    _register_composites(server, service, endpoints, atomic_names)
    return server


def main() -> None:
    parser = argparse.ArgumentParser(description="Servidor MCP somente leitura de compras públicas")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--transport", choices=["stdio", "http"], default="stdio")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = build_server(args.manifest)
    if args.transport == "http":
        server.run(transport="http", port=args.port)
    else:
        server.run(transport="stdio")


if __name__ == "__main__":
    main()
