from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal, cast
from urllib.request import Request, urlopen

import yaml

from src.features.catalogo.models import CoverageReport, Operation

DEFAULT_OFFICIAL_URLS = {
    "compras": "https://dadosabertos.compras.gov.br/v3/api-docs",
    "pncp": "https://pncp.gov.br/pncp-api/v3/api-docs",
}
TOOL_NAME_OVERRIDES_VERSION = 1
TOOL_NAME_OVERRIDES = {
    "compras.GET./modulo-indicadores/1_consultarIndicadoresConsolidados": (
        "compras_consultar_indicadores_consolidados"
    ),
    "pncp.GET./v1/modalidades": "pncp_listar_modalidades",
}
TOOL_NAME_RE = re.compile(r"^(compras|pncp)_[a-z0-9_]+$")
_NON_ATOMIC_TOOLS: tuple[tuple[str, str, str, str], ...] = (
    (
        "listar_capacidades_mcp",
        "Lista as fontes, domínios, cobertura, quantidade de ferramentas atômicas "
        "e versão do catálogo MCP.",
        "nenhum.",
        "consulta metadados carregados do manifesto e não faz alterações nas fontes "
        "ou no catálogo.",
    ),
    (
        "verificar_saude_fontes",
        "Executa probes públicos leves e informa se as fontes Compras.gov.br e PNCP "
        "estão operacionais ou indisponíveis.",
        "nenhum.",
        "faz apenas requisições GET catalogadas para "
        "`/modulo-indicadores/1_consultarIndicadoresConsolidados` e `/v1/modalidades`.",
    ),
    (
        "pncp_obter_contratacao_completa",
        "Consulta, em conjunto, os recursos públicos relacionados a uma contratação no PNCP.",
        "`cnpj` (string), `ano` (inteiro) e `sequencial_contratacao` (inteiro).",
        "agrega consultas GET dos recursos da contratação e não cria, altera ou exclui dados.",
    ),
    (
        "pncp_obter_ata_completa",
        "Consulta, em conjunto, os recursos públicos relacionados a uma ata de registro "
        "de preços no PNCP.",
        "`cnpj` (string), `ano` (inteiro), `sequencial_contratacao` (inteiro) e "
        "`sequencial_ata` (inteiro).",
        "agrega consultas GET dos recursos da ata e não cria, altera ou exclui dados.",
    ),
    (
        "pncp_obter_contrato_completo",
        "Consulta, em conjunto, os recursos públicos relacionados a um contrato no PNCP.",
        "`cnpj` (string), `ano` (inteiro) e `sequencial_contrato` (inteiro).",
        "agrega consultas GET dos recursos do contrato e não cria, altera ou exclui dados.",
    ),
    (
        "buscar_compras_publicas",
        "Pesquisa compras públicas nas fontes catalogadas, no Compras.gov.br, no PNCP ou em ambas.",
        "`texto` (string), `orgao`, `uasg`, `cnpj`, `modalidade`, `data_inicio`, `data_fim`, "
        "`codigo_material`, `codigo_servico` e `fonte` (`compras`, `pncp` ou `todas`).",
        "executa apenas consultas GET catalogadas, sem deduplicar ou modificar resultados, "
        "registros ou fontes.",
    ),
)
_NON_ATOMIC_TOOL_NAMES = {name for name, *_ in _NON_ATOMIC_TOOLS}
CURATION_FIELDS = {"classification", "implemented", "tool", "exclusion"}
UNORDERED_LIST_FIELDS = {"enum", "required"}
CLASSIFICATIONS = {
    "PUBLIC_USEFUL",
    "PUBLIC_NOT_USEFUL",
    "AUTHENTICATED",
    "DEPRECATED",
    "BROKEN_UPSTREAM",
    "INTERNAL",
    "UNKNOWN",
}
ChangeType = Literal[
    "response_changed",
    "security_changed",
    "deprecated_changed",
    "parameter_added",
    "parameter_removed",
    "parameter_required_changed",
    "parameter_type_changed",
    "description_changed",
    "source_version_changed",
]
ChangeImpact = Literal["breaking", "non_breaking", "documentation_only"]
CHANGE_TYPES: tuple[ChangeType, ...] = (
    "response_changed",
    "security_changed",
    "deprecated_changed",
    "parameter_added",
    "parameter_removed",
    "parameter_required_changed",
    "parameter_type_changed",
    "description_changed",
    "source_version_changed",
)
CHANGE_IMPACTS: tuple[ChangeImpact, ...] = (
    "breaking",
    "non_breaking",
    "documentation_only",
)


@dataclass(frozen=True)
class CatalogChange:
    operation_id: str
    change_type: ChangeType
    impact: ChangeImpact
    before: Any = None
    after: Any = None

    @property
    def kind(self) -> ChangeType:
        return self.change_type

    @property
    def classification(self) -> ChangeImpact:
        return self.impact

    @property
    def type(self) -> ChangeType:
        return self.change_type

    @property
    def severity(self) -> ChangeImpact:
        return self.impact

    @property
    def id(self) -> str:
        return self.operation_id


@dataclass(frozen=True)
class CatalogDiff:
    added: list[dict[str, Any]]
    removed: list[dict[str, Any]]
    changed: list[dict[str, Any]]
    changes: list[CatalogChange] = field(default_factory=lambda: list[CatalogChange]())

    @property
    def typed_changes(self) -> list[CatalogChange]:
        return self.changes

    @property
    def semantic_changes(self) -> list[CatalogChange]:
        return self.changes

    @property
    def semantic(self) -> list[CatalogChange]:
        return self.changes


SemanticChange = CatalogChange


def load_openapi(path: Path) -> dict[str, Any]:
    """Load an OpenAPI JSON or YAML document from a local snapshot."""
    text = path.read_text(encoding="utf-8")
    document: Any = (
        yaml.safe_load(text) if path.suffix.lower() in {".yaml", ".yml"} else json.loads(text)
    )
    document_mapping = cast(dict[str, Any], document) if isinstance(document, dict) else None
    if document_mapping is None or not isinstance(document_mapping.get("paths"), dict):
        raise ValueError(f"{path} is not an OpenAPI document with a paths object")
    return document_mapping


def _pointer(document: dict[str, Any], reference: str) -> Any:
    if not reference.startswith("#/"):
        raise ValueError(f"only local OpenAPI references are supported: {reference}")
    value: Any = document
    for part in reference[2:].split("/"):
        key = part.replace("~1", "/").replace("~0", "~")
        current = cast(dict[str, Any], value) if isinstance(value, dict) else None
        if current is None or key not in current:
            raise ValueError(f"unresolved OpenAPI reference: {reference}")
        value = current[key]
    return value


def _resolve(value: Any, document: dict[str, Any], stack: tuple[str, ...] = ()) -> Any:
    if isinstance(value, dict):
        mapping = cast(dict[str, Any], value)
        reference = mapping.get("$ref")
        if isinstance(reference, str):
            if not reference.startswith("#/"):
                return mapping
            if reference in stack:
                raise ValueError(f"cyclic OpenAPI reference: {reference}")
            resolved = _resolve(_pointer(document, reference), document, (*stack, reference))
            if len(mapping) == 1:
                return resolved
            if isinstance(resolved, dict):
                resolved_mapping = cast(dict[str, Any], resolved)
                merged = dict(resolved_mapping)
                merged.update(
                    {
                        key: _resolve(item, document, stack)
                        for key, item in mapping.items()
                        if key != "$ref"
                    }
                )
                return merged
            return resolved
        return {key: _resolve(item, document, stack) for key, item in mapping.items()}
    if isinstance(value, list):
        items = cast(list[Any], value)
        return [_resolve(item, document, stack) for item in items]
    return value


def _contains_external_ref(value: Any) -> bool:
    if isinstance(value, dict):
        mapping = cast(dict[Any, Any], value)
        reference = mapping.get("$ref")
        if isinstance(reference, str) and not reference.startswith("#/"):
            return True
        return any(_contains_external_ref(item) for item in mapping.values())
    if isinstance(value, list):
        return any(_contains_external_ref(item) for item in cast(list[Any], value))
    return False


def _is_external_ref(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    reference = cast(dict[Any, Any], value).get("$ref")
    return isinstance(reference, str) and not reference.startswith("#/")


def _security_classification(
    security: Any, document: dict[str, Any]
) -> tuple[list[dict[str, list[str]]], str]:
    if security is None:
        return [], "UNKNOWN"
    if _contains_external_ref(security):
        return [], "UNKNOWN"
    try:
        resolved_security = _resolve(security, document)
    except ValueError:
        return [], "UNKNOWN"
    if not isinstance(resolved_security, list):
        return [], "UNKNOWN"
    security_requirements = cast(list[Any], resolved_security)
    normalized: list[dict[str, list[str]]] = []
    components = document.get("components", {})
    components = cast(dict[str, Any], components) if isinstance(components, dict) else {}
    schemes = components.get("securitySchemes", {})
    known_schemes = cast(dict[str, Any], schemes) if isinstance(schemes, dict) else {}
    resolved_schemes: dict[str, Any] = {}
    for requirement in security_requirements:
        if not isinstance(requirement, dict):
            return [], "UNKNOWN"
        requirement = cast(dict[Any, Any], requirement)
        normalized_requirement: dict[str, list[str]] = {}
        for name, scopes in requirement.items():
            if not isinstance(name, str) or not isinstance(scopes, list):
                return [], "UNKNOWN"
            scopes = cast(list[Any], scopes)
            if not all(isinstance(scope, str) for scope in scopes):
                return [], "UNKNOWN"
            scope_names = cast(list[str], scopes)
            if name in known_schemes and _contains_external_ref(known_schemes[name]):
                return [], "UNKNOWN"
            try:
                scheme = _resolve(known_schemes[name], document) if name in known_schemes else None
            except ValueError:
                return [], "UNKNOWN"
            if not isinstance(scheme, dict):
                if name not in known_schemes and name.lower() == "bearerauth":
                    normalized_requirement[name] = sorted(scope_names)
                    continue
                return [], "UNKNOWN"
            resolved_schemes[name] = scheme
            normalized_requirement[name] = sorted(scope_names)
        normalized_requirement = {
            name: normalized_requirement[name] for name in sorted(normalized_requirement)
        }
        normalized.append(normalized_requirement)
    normalized.sort(key=lambda item: json.dumps(item, sort_keys=True))
    if not normalized:
        return [], "PUBLIC_USEFUL"
    if any(not requirement for requirement in normalized):
        return normalized, "PUBLIC_USEFUL"
    for requirement in normalized:
        for name in requirement:
            scheme = (
                resolved_schemes[name]
                if name in known_schemes
                else {"type": "http", "scheme": "bearer"}
            )
            if isinstance(scheme, dict):
                scheme_mapping = cast(dict[str, Any], scheme)
                is_bearer = (
                    str(scheme_mapping.get("type", "")).lower() == "http"
                    and str(scheme_mapping.get("scheme", "")).lower() == "bearer"
                )
            else:
                is_bearer = False
            if is_bearer or name.lower() == "bearerauth":
                return normalized, "AUTHENTICATED"
            scheme_mapping = cast(dict[str, Any], scheme) if isinstance(scheme, dict) else {}
            if str(scheme_mapping.get("type", "")).lower() in {
                "apikey",
                "oauth2",
                "openidconnect",
                "mutualtls",
            }:
                return normalized, "AUTHENTICATED"
            if str(scheme_mapping.get("type", "")).lower() == "http":
                return normalized, "AUTHENTICATED"
    return normalized, "UNKNOWN"


def _operation_parameters(
    path_item: dict[str, Any], operation: dict[str, Any], document: dict[str, Any]
) -> list[dict[str, Any]]:
    parameters: list[dict[str, Any]] = []
    path_parameters = cast(list[Any], path_item.get("parameters", []))
    operation_parameters = cast(list[Any], operation.get("parameters", []))
    for raw in [*path_parameters, *operation_parameters]:
        resolved = _resolve(raw, document)
        if not isinstance(resolved, dict):
            raise ValueError("OpenAPI parameter must resolve to an object")
        resolved = cast(dict[str, Any], resolved)
        if "$ref" in resolved:
            raise ValueError("unresolved OpenAPI parameter reference")
        parameters = [
            old
            for old in parameters
            if (old.get("name"), old.get("in")) != (resolved.get("name"), resolved.get("in"))
        ]
        parameters.append(resolved)
    return parameters


def classify_operations(spec: dict[str, Any], provider: str) -> list[Operation]:
    if provider not in {"compras", "pncp"}:
        raise ValueError(f"unsupported provider: {provider}")
    operations: list[Operation] = []
    paths_value = spec.get("paths", {})
    paths = cast(dict[str, Any], paths_value) if isinstance(paths_value, dict) else {}
    root_security = spec.get("security", [])
    provider_name = cast(Literal["compras", "pncp"], provider)
    for path in sorted(paths):
        raw_path_value = paths[path]
        if _is_external_ref(raw_path_value):
            raise ValueError(f"external OpenAPI path-item reference cannot be resolved: {path}")
        raw_path_item = _resolve(raw_path_value, spec)
        if not isinstance(raw_path_item, dict):
            raise ValueError(f"OpenAPI path item is not an object: {path}")
        if _contains_external_ref(raw_path_item):
            raise ValueError(f"external OpenAPI path-item reference cannot be resolved: {path}")
        raw_path_item = cast(dict[str, Any], raw_path_item)
        for method in sorted(raw_path_item):
            if method.lower() != "get":
                continue
            raw_operation_value = raw_path_item[method]
            if _is_external_ref(raw_operation_value):
                raise ValueError(f"external OpenAPI GET reference cannot be resolved: {path}")
            raw_operation = _resolve(raw_operation_value, spec)
            if not isinstance(raw_operation, dict):
                raise ValueError(f"OpenAPI GET operation is not an object: {path}")
            if _contains_external_ref(raw_operation):
                raise ValueError(f"external OpenAPI GET reference cannot be resolved: {path}")
            raw_operation = cast(dict[str, Any], raw_operation)
            security = raw_operation["security"] if "security" in raw_operation else root_security
            normalized_security, classification = _security_classification(security, spec)
            parameters = _operation_parameters(raw_path_item, raw_operation, spec)
            description = raw_operation.get("summary") or raw_operation.get("description") or path
            if not isinstance(description, str):
                description = path
            operation = Operation(
                id=f"{provider}.GET.{path}",
                provider=provider_name,
                method="GET",
                path=path,
                security=normalized_security,
                parameters=parameters,
                description=description,
                classification=cast(Any, classification),
            )
            if operation.model_extra is not None:
                operation.model_extra["responses"] = _resolve(
                    raw_operation.get("responses", {}), spec
                )
                operation.model_extra["deprecated"] = bool(raw_operation.get("deprecated", False))
                components = spec.get("components", {})
                components_mapping = (
                    cast(dict[str, Any], components) if isinstance(components, dict) else {}
                )
                schemes_value = components_mapping.get("securitySchemes", {})
                schemes = (
                    cast(dict[str, Any], schemes_value) if isinstance(schemes_value, dict) else {}
                )
                security_schemes: dict[str, Any] = {}
                for requirement in normalized_security:
                    for name in requirement:
                        if name not in schemes:
                            continue
                        try:
                            security_schemes[name] = _resolve(schemes[name], spec)
                        except ValueError:
                            security_schemes = {}
                            break
                    if not security_schemes and requirement:
                        break
                operation.model_extra["security_schemes"] = security_schemes
                operation.model_extra["operation_metadata"] = {
                    key: _resolve(value, spec)
                    for key, value in raw_operation.items()
                    if key
                    not in {
                        "summary",
                        "description",
                        "parameters",
                        "security",
                        "responses",
                        "deprecated",
                    }
                }
            operations.append(operation)
    return operations


def _canonical(
    value: Any,
    *,
    ignore_descriptions: bool = False,
    ignore_curation: bool = False,
) -> Any:
    if isinstance(value, dict):
        mapping = cast(dict[str, Any], value)
        normalized: dict[str, Any] = {}
        for key in sorted(mapping):
            if ignore_descriptions and key in {"description", "summary"}:
                continue
            if ignore_curation and key in CURATION_FIELDS:
                continue
            child = _canonical(
                mapping[key],
                ignore_descriptions=ignore_descriptions,
                ignore_curation=ignore_curation,
            )
            if isinstance(child, list) and key in UNORDERED_LIST_FIELDS:
                child = sorted(
                    cast(list[Any], child), key=lambda item: json.dumps(item, sort_keys=True)
                )
            normalized[key] = child
        return normalized
    if isinstance(value, list):
        items = cast(list[Any], value)
        return [
            _canonical(
                item,
                ignore_descriptions=ignore_descriptions,
                ignore_curation=ignore_curation,
            )
            for item in items
        ]
    return value


def _parameters_by_key(value: Any) -> dict[tuple[Any, Any], dict[str, Any]]:
    if not isinstance(value, list):
        return {}
    parameters = cast(list[Any], value)
    result: dict[tuple[Any, Any], dict[str, Any]] = {}
    for parameter in parameters:
        if isinstance(parameter, dict):
            normalized = cast(dict[str, Any], parameter)
            result[(normalized.get("name"), normalized.get("in"))] = normalized
    return result


def _canonical_parameters(value: Any) -> dict[str, Any]:
    parameters = _parameters_by_key(value)
    return {
        f"{key[0]}:{key[1]}": _canonical(parameter, ignore_descriptions=True, ignore_curation=True)
        for key, parameter in sorted(parameters.items(), key=lambda item: str(item[0]))
    }


def _canonical_security(value: Any) -> Any:
    if not isinstance(value, list):
        return _canonical(value)
    requirements = cast(list[Any], value)
    normalized: list[Any] = []
    for requirement in requirements:
        if isinstance(requirement, dict):
            raw_requirement = cast(dict[Any, Any], requirement)
            normalized_requirement: dict[str, Any] = {}
            for name, scopes in sorted(raw_requirement.items(), key=lambda item: str(item[0])):
                normalized_requirement[str(name)] = (
                    sorted(cast(list[Any], scopes), key=str) if isinstance(scopes, list) else scopes
                )
            normalized.append(_canonical(normalized_requirement, ignore_curation=True))
        else:
            normalized.append(_canonical(requirement))
    if any(isinstance(requirement, dict) and not requirement for requirement in normalized):
        return []
    return sorted(normalized, key=lambda item: json.dumps(item, sort_keys=True))


def _upstream_contract(value: dict[str, Any]) -> dict[str, Any]:
    contract = {
        key: item
        for key, item in value.items()
        if key not in CURATION_FIELDS and key not in {"description", "summary"}
    }
    contract["parameters"] = _canonical_parameters(value.get("parameters", []))
    contract["security"] = _canonical_security(value.get("security", []))
    contract["responses"] = _canonical(value.get("responses", {}), ignore_descriptions=True)
    contract["deprecated"] = bool(value.get("deprecated", False))
    return cast(
        dict[str, Any],
        _canonical(contract, ignore_descriptions=True, ignore_curation=True),
    )


def _change_impact(change_type: ChangeType, before: Any, after: Any) -> ChangeImpact:
    if change_type == "deprecated_changed":
        return "documentation_only"
    if change_type == "description_changed":
        return "documentation_only"
    if change_type == "parameter_added":
        parameter = cast(dict[str, Any], after) if isinstance(after, dict) else {}
        return "breaking" if parameter.get("required") else "non_breaking"
    if change_type in {
        "parameter_removed",
        "parameter_type_changed",
        "parameter_required_changed",
    }:
        return "breaking"
    if change_type == "security_changed":
        before_security = _canonical_security(before)
        after_security = _canonical_security(after)
        return "non_breaking" if before_security and not after_security else "breaking"
    if change_type == "response_changed":
        if not isinstance(before, dict) or not isinstance(after, dict):
            return "breaking"
        old_responses = cast(dict[str, Any], before)
        new_responses = cast(dict[str, Any], after)
        if set(old_responses) - set(new_responses):
            return "breaking"
        for status in set(old_responses) & set(new_responses):
            if _canonical(old_responses[status], ignore_descriptions=True) != _canonical(
                new_responses[status], ignore_descriptions=True
            ):
                return "breaking"
        return "non_breaking"
    return "documentation_only"


def _parameter_type_signature(schema: Any) -> Any:
    if not isinstance(schema, dict):
        return schema
    schema_mapping = cast(dict[str, Any], schema)
    return {key: schema_mapping[key] for key in ("$ref", "type", "format") if key in schema_mapping}


def _description_projection(value: Any) -> Any:
    if isinstance(value, dict):
        projection: dict[str, Any] = {}
        mapping = cast(dict[Any, Any], value)
        for raw_key, item in mapping.items():
            key = str(raw_key)
            child = _description_projection(item)
            if key in {"description", "summary"} or child is not None:
                projection[key] = child if child is not None else item
        return projection or None
    if isinstance(value, list):
        items = [_description_projection(item) for item in cast(list[Any], value)]
        return items if any(item is not None for item in items) else None
    return None


def _semantic_changes(old: dict[str, Any], new: dict[str, Any]) -> list[CatalogChange]:
    operation_id = str(new.get("id", old.get("id", "")))
    changes: list[CatalogChange] = []
    old_descriptions = _description_projection(old)
    new_descriptions = _description_projection(new)
    if old_descriptions != new_descriptions:
        changes.append(
            CatalogChange(
                operation_id,
                "description_changed",
                "documentation_only",
                before=old_descriptions,
                after=new_descriptions,
            )
        )
    old_parameters = _parameters_by_key(old.get("parameters"))
    new_parameters = _parameters_by_key(new.get("parameters"))
    for key in sorted(new_parameters.keys() - old_parameters.keys(), key=str):
        parameter = new_parameters[key]
        changes.append(
            CatalogChange(
                operation_id,
                "parameter_added",
                _change_impact("parameter_added", None, parameter),
                after=parameter,
            )
        )
    for key in sorted(old_parameters.keys() - new_parameters.keys(), key=str):
        parameter = old_parameters[key]
        changes.append(
            CatalogChange(
                operation_id,
                "parameter_removed",
                _change_impact("parameter_removed", parameter, None),
                before=parameter,
            )
        )
    for key in sorted(old_parameters.keys() & new_parameters.keys(), key=str):
        old_required = bool(old_parameters[key].get("required", False))
        new_required = bool(new_parameters[key].get("required", False))
        if old_required != new_required:
            changes.append(
                CatalogChange(
                    operation_id,
                    "parameter_required_changed",
                    "breaking" if new_required else "non_breaking",
                    before=old_required,
                    after=new_required,
                )
            )
        old_schema = old_parameters[key].get("schema", {})
        new_schema = new_parameters[key].get("schema", {})
        old_type = _parameter_type_signature(old_schema)
        new_type = _parameter_type_signature(new_schema)
        if old_type != new_type:
            changes.append(
                CatalogChange(
                    operation_id,
                    "parameter_type_changed",
                    "breaking",
                    before=old_type,
                    after=new_type,
                )
            )

    old_security = old.get("security", [])
    new_security = new.get("security", [])
    if _canonical_security(old_security) != _canonical_security(new_security):
        changes.append(
            CatalogChange(
                operation_id,
                "security_changed",
                _change_impact("security_changed", old_security, new_security),
                before=old_security,
                after=new_security,
            )
        )

    old_deprecated = bool(old.get("deprecated", False))
    new_deprecated = bool(new.get("deprecated", False))
    if old_deprecated != new_deprecated:
        changes.append(
            CatalogChange(
                operation_id,
                "deprecated_changed",
                "documentation_only",
                before=old_deprecated,
                after=new_deprecated,
            )
        )

    old_responses = old.get("responses", {})
    new_responses = new.get("responses", {})
    if _canonical(old_responses, ignore_descriptions=True) != _canonical(
        new_responses, ignore_descriptions=True
    ):
        changes.append(
            CatalogChange(
                operation_id,
                "response_changed",
                _change_impact("response_changed", old_responses, new_responses),
                before=old_responses,
                after=new_responses,
            )
        )
    return changes


def _source_version_changes(
    previous: dict[str, Any] | None, current: dict[str, Any] | None
) -> list[CatalogChange]:
    old_sources = previous if isinstance(previous, dict) else {}
    new_sources = current if isinstance(current, dict) else {}
    changes: list[CatalogChange] = []
    for provider in sorted(set(old_sources) | set(new_sources)):
        old_value = old_sources.get(provider)
        new_value = new_sources.get(provider)
        old_mapping = cast(dict[str, Any], old_value) if isinstance(old_value, dict) else {}
        new_mapping = cast(dict[str, Any], new_value) if isinstance(new_value, dict) else {}
        before = {
            "openapi": old_mapping.get("openapi"),
        }
        after = {
            "openapi": new_mapping.get("openapi"),
        }
        if before != after:
            changes.append(
                CatalogChange(
                    f"source_version.{provider}",
                    "source_version_changed",
                    "documentation_only",
                    before=before,
                    after=after,
                )
            )
    return changes


def compare_catalogs(
    previous: list[dict[str, Any]],
    current: list[dict[str, Any]],
    *,
    previous_source_version: dict[str, Any] | None = None,
    current_source_version: dict[str, Any] | None = None,
) -> CatalogDiff:
    old = {item["id"]: item for item in previous}
    new = {item["id"]: item for item in current}
    changes = _source_version_changes(previous_source_version, current_source_version)
    changes.extend(
        change
        for item in current
        if item["id"] in old
        for change in _semantic_changes(old[item["id"]], item)
    )
    return CatalogDiff(
        added=[item for item in current if item["id"] not in old],
        removed=[item for item in previous if item["id"] not in new],
        changed=[
            item
            for item in current
            if item["id"] in old and _upstream_contract(item) != _upstream_contract(old[item["id"]])
        ],
        changes=changes,
    )


def render_coverage(endpoints: list[dict[str, Any]]) -> CoverageReport:
    public = [item for item in endpoints if item.get("classification") == "PUBLIC_USEFUL"]
    implemented = [item for item in public if item.get("implemented") and item.get("tool")]
    return CoverageReport(
        public_useful=len(public),
        implemented=len(implemented),
        ratio=len(implemented) / len(public) if public else 1.0,
    )


def _words(path: str) -> list[str]:
    replacements = {
        "órgãos": "orgaos",
        "órgão": "orgao",
        "unidades": "unidades",
        "contratações": "contratacoes",
        "contratação": "contratacao",
        "compras": "compras",
        "ata": "ata",
        "atas": "atas",
        "contratos": "contratos",
        "contrato": "contrato",
        "itens": "itens",
        "item": "item",
    }
    result: list[str] = []
    for segment in path.split("/"):
        if not segment or segment.startswith("{"):
            continue
        segment = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", segment)
        for word in re.split(r"[^A-Za-z0-9]+", segment):
            word = replacements.get(word.lower(), word.lower())
            if word and word not in {"v1", "v2", "api"}:
                result.append(word)
    return result or ["consulta"]


def _suggested_tool_name(operation: dict[str, Any]) -> str:
    provider = str(operation["provider"])
    words = _words(str(operation["path"]))
    action = "listar" if not re.search(r"\{[^}]+\}", str(operation["path"])) else "obter"
    return f"{provider}_{action}_{'_'.join(words)}"


def _manifest_entry(operation: Operation, tool: str | None) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "id": operation.id,
        "provider": operation.provider,
        "method": operation.method,
        "path": operation.path,
        "classification": operation.classification,
        "implemented": tool is not None,
        "tool": tool,
        "description": operation.description,
        "security": operation.security,
        "parameters": operation.parameters,
    }
    if operation.classification == "AUTHENTICATED":
        entry["implemented"] = False
        entry["tool"] = None
        entry["exclusion"] = {"reason": "authentication_required"}
    elif operation.classification == "UNKNOWN":
        entry["implemented"] = False
        entry["tool"] = None
        entry["exclusion"] = {"reason": "security_metadata_unresolved"}
    elif operation.classification == "PUBLIC_USEFUL" and tool is None:
        entry["exclusion"] = {
            "reason": "tool_mapping_review_required",
            "suggested_tool": _suggested_tool_name(operation.model_dump(mode="json")),
        }
    extra = operation.model_dump(mode="json")
    for key in ("responses", "deprecated", "security_schemes", "operation_metadata"):
        if key in extra:
            entry[key] = extra[key]
    return entry


def _manifest_from_specs(
    specs: dict[str, dict[str, Any]], sources: dict[str, str]
) -> dict[str, Any]:
    all_operations: list[Operation] = []
    source_version: dict[str, Any] = {}
    for provider in ("compras", "pncp"):
        spec = specs[provider]
        all_operations.extend(classify_operations(spec, provider))
        source_version[provider] = {
            "snapshot": sources[provider],
            "openapi": spec.get("openapi", "unknown"),
        }
    endpoints: list[dict[str, Any]] = []
    for operation in all_operations:
        tool = TOOL_NAME_OVERRIDES.get(operation.id)
        endpoints.append(_manifest_entry(operation, tool))
    return {
        "catalog_version": 1,
        "tool_name_overrides_version": TOOL_NAME_OVERRIDES_VERSION,
        "source_version": source_version,
        "endpoints": endpoints,
    }


def _read_manifest(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    value_mapping = cast(dict[str, Any], value) if isinstance(value, dict) else None
    if value_mapping is None or not isinstance(value_mapping.get("endpoints"), list):
        raise ValueError(f"{path} must contain an endpoints list")
    return value_mapping


def _validate_manifest(manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    endpoints_value = manifest.get("endpoints")
    if not isinstance(endpoints_value, list):
        return ["manifest.endpoints must be a list"]
    endpoints = cast(list[Any], endpoints_value)
    ids: set[str] = set()
    tools: set[str] = set()
    required = {"id", "provider", "method", "path", "classification", "implemented"}
    for index, endpoint in enumerate(endpoints):
        if not isinstance(endpoint, dict):
            errors.append(f"endpoints[{index}] must be an object")
            continue
        endpoint = cast(dict[str, Any], endpoint)
        missing = required - endpoint.keys()
        if missing:
            errors.append(
                f"endpoints[{index}] missing explicit fields: {', '.join(sorted(missing))}"
            )
        endpoint_id = endpoint.get("id")
        if not isinstance(endpoint_id, str) or not endpoint_id.strip():
            errors.append(f"endpoints[{index}] id must be a non-empty string")
        if isinstance(endpoint_id, str) and endpoint_id in ids:
            errors.append(f"duplicate endpoint id: {endpoint_id}")
        if isinstance(endpoint_id, str):
            ids.add(endpoint_id)
        provider = endpoint.get("provider")
        if not isinstance(provider, str) or provider not in {"compras", "pncp"}:
            errors.append(f"invalid provider: {endpoint_id}")
        if endpoint.get("method") != "GET":
            errors.append(f"manifest only supports GET operations: {endpoint_id}")
        path = endpoint.get("path")
        if not isinstance(path, str) or not path.strip():
            errors.append(f"endpoint path must be a non-empty string: {endpoint_id}")
        if isinstance(provider, str) and provider in {"compras", "pncp"} and isinstance(path, str):
            expected_id = f"{provider}.GET.{path}"
            if endpoint_id != expected_id:
                errors.append(f"id must be {expected_id}: {endpoint_id}")
        description = endpoint.get("description")
        if not isinstance(description, str) or not description.strip():
            errors.append(f"endpoint description must be non-empty: {endpoint_id}")
        parameters = endpoint.get("parameters")
        if not isinstance(parameters, list):
            errors.append(f"endpoint parameters must be a list: {endpoint_id}")
        else:
            parameter_values = cast(list[Any], parameters)
            if not all(isinstance(parameter, dict) for parameter in parameter_values):
                errors.append(f"endpoint parameters must contain objects: {endpoint_id}")
            parameter_keys: set[tuple[str, str]] = set()
            for parameter in parameter_values:
                if not isinstance(parameter, dict):
                    continue
                parameter_mapping = cast(dict[str, Any], parameter)
                parameter_name = parameter_mapping.get("name")
                if not isinstance(parameter_name, str) or not parameter_name.strip():
                    errors.append(f"parameter name must be non-empty: {endpoint_id}")
                location = parameter_mapping.get("in")
                if not isinstance(location, str) or location not in {
                    "path",
                    "query",
                    "header",
                    "cookie",
                }:
                    errors.append(f"parameter location is invalid: {endpoint_id}")
                if "schema" in parameter_mapping and not isinstance(
                    parameter_mapping["schema"], dict
                ):
                    errors.append(f"parameter schema must be an object: {endpoint_id}")
                if "required" in parameter_mapping and not isinstance(
                    parameter_mapping["required"], bool
                ):
                    errors.append(f"parameter required must be boolean: {endpoint_id}")
                if isinstance(parameter_name, str) and isinstance(location, str):
                    key = (parameter_name, location)
                    if key in parameter_keys:
                        errors.append(f"duplicate parameter: {endpoint_id}: {key}")
                    parameter_keys.add(key)
                if "description" in parameter_mapping and not isinstance(
                    parameter_mapping["description"], str
                ):
                    errors.append(f"parameter description must be a string: {endpoint_id}")
        security = endpoint.get("security")
        if not isinstance(security, list):
            errors.append(f"endpoint security must be a list: {endpoint_id}")
        else:
            security_values = cast(list[Any], security)
            for requirement in security_values:
                if not isinstance(requirement, dict):
                    errors.append(f"security requirements must be objects: {endpoint_id}")
                    continue
                for scheme_name, scopes in cast(dict[Any, Any], requirement).items():
                    if (
                        not isinstance(scheme_name, str)
                        or not scheme_name.strip()
                        or not isinstance(scopes, list)
                    ):
                        errors.append(f"security requirement shape is invalid: {endpoint_id}")
                    elif not all(isinstance(scope, str) for scope in cast(list[Any], scopes)):
                        errors.append(f"security scopes must be strings: {endpoint_id}")
        if not isinstance(endpoint.get("implemented"), bool):
            errors.append(f"endpoint implemented must be boolean: {endpoint_id}")
        classification = endpoint.get("classification")
        if not isinstance(classification, str) or classification not in CLASSIFICATIONS:
            errors.append(f"invalid classification: {endpoint_id}")
        if classification == "PUBLIC_USEFUL":
            tool = endpoint.get("tool")
            if endpoint.get("implemented") is True:
                if not isinstance(tool, str) or not TOOL_NAME_RE.fullmatch(tool):
                    errors.append(f"public endpoint lacks a valid implemented tool: {endpoint_id}")
                elif not tool.startswith(f"{provider}_"):
                    errors.append(f"tool prefix does not match provider: {endpoint_id}")
                elif tool in tools:
                    errors.append(f"duplicate tool: {tool}")
                else:
                    tools.add(tool)
            elif endpoint.get("implemented") is False:
                if tool is not None:
                    errors.append(
                        f"endpoint with implemented=false must not have a tool: {endpoint_id}"
                    )
                exclusion = endpoint.get("exclusion")
                exclusion_mapping = (
                    cast(dict[str, Any], exclusion) if isinstance(exclusion, dict) else None
                )
                if (
                    exclusion_mapping is None
                    or not str(exclusion_mapping.get("reason", "")).strip()
                ):
                    errors.append(f"public review exclusion is required: {endpoint_id}")
            else:
                errors.append(f"public endpoint lacks a valid implemented tool: {endpoint_id}")
        else:
            if endpoint.get("implemented") is not False:
                errors.append(f"non-public endpoint must not be implemented: {endpoint_id}")
            if endpoint.get("tool") is not None:
                errors.append(f"non-public endpoint must not have a tool: {endpoint_id}")
        if classification == "AUTHENTICATED":
            exclusion = endpoint.get("exclusion")
            exclusion_mapping = (
                cast(dict[str, Any], exclusion) if isinstance(exclusion, dict) else None
            )
            if (
                exclusion_mapping is None
                or exclusion_mapping.get("reason") != "authentication_required"
            ):
                errors.append(
                    f"authenticated endpoint needs authentication exclusion: {endpoint_id}"
                )
        elif classification == "UNKNOWN":
            errors.append(f"unknown classification: {endpoint_id}")
        elif (
            isinstance(classification, str)
            and classification in CLASSIFICATIONS
            and classification != "PUBLIC_USEFUL"
        ):
            exclusion = endpoint.get("exclusion")
            exclusion_mapping = (
                cast(dict[str, Any], exclusion) if isinstance(exclusion, dict) else None
            )
            if exclusion_mapping is None or not str(exclusion_mapping.get("reason", "")).strip():
                errors.append(f"excluded endpoint needs a reason: {endpoint_id}")
    return errors


def _manifest_endpoints(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    value = manifest.get("endpoints")
    if not isinstance(value, list):
        raise ValueError("manifest endpoints must contain only objects")
    items = cast(list[Any], value)
    if not all(isinstance(item, dict) for item in items):
        raise ValueError("manifest endpoints must contain only objects")
    return [cast(dict[str, Any], item) for item in items]


def _snapshot_for_provider(
    manifest: dict[str, Any], manifest_path: Path, provider: str, explicit: Path | None
) -> tuple[Path | str | None, str | None]:
    source_version = manifest.get("source_version")
    if not isinstance(source_version, dict):
        return None, "manifest requires source_version for compras and pncp"
    source_mapping = cast(dict[str, Any], source_version)
    provider_source = source_mapping.get(provider)
    if not isinstance(provider_source, dict):
        return None, f"source_version missing provider: {provider}"
    provider_mapping = cast(dict[str, Any], provider_source)
    openapi = provider_mapping.get("openapi")
    if not isinstance(openapi, str) or not re.fullmatch(r"3\.(?:0|1)(?:\.\d+)?", openapi):
        return None, f"source_version.{provider}.openapi must be a non-empty 3.x version"
    snapshot = provider_mapping.get("snapshot")
    if not isinstance(snapshot, str) or not snapshot.strip():
        return (
            None,
            f"source_version.{provider}.snapshot must be a local path or fixed official URL",
        )
    if snapshot.startswith(("http://", "https://")):
        if snapshot != DEFAULT_OFFICIAL_URLS[provider]:
            return None, f"source_version.{provider}.snapshot must use its fixed official URL"
        return snapshot, None
    candidate = explicit or Path(snapshot)
    if not candidate.exists():
        candidate = manifest_path.parent / candidate
    return candidate, None


def _check_source_completeness(
    manifest: dict[str, Any], manifest_path: Path, compras: Path | None, pncp: Path | None
) -> list[str]:
    errors: list[str] = []
    endpoints = _manifest_endpoints(manifest)
    source_version_value = manifest.get("source_version")
    source_version = (
        cast(dict[str, Any], source_version_value) if isinstance(source_version_value, dict) else {}
    )
    for provider, explicit in (("compras", compras), ("pncp", pncp)):
        snapshot, source_error = _snapshot_for_provider(manifest, manifest_path, provider, explicit)
        if source_error is not None:
            errors.append(source_error)
            continue
        if snapshot is None:
            continue
        if isinstance(snapshot, str):
            source_document = _official_spec(snapshot)
        else:
            if not snapshot.exists():
                errors.append(f"snapshot not found for {provider}: {snapshot}")
                continue
            source_document = load_openapi(snapshot)
        provider_source = source_version.get(provider)
        provider_mapping = cast(dict[str, Any], provider_source)
        expected_openapi = provider_mapping.get("openapi")
        loaded_openapi = source_document.get("openapi")
        if loaded_openapi != expected_openapi:
            errors.append(
                f"source_version.{provider}.openapi does not match snapshot: "
                f"{expected_openapi!r} != {loaded_openapi!r}"
            )
        if not isinstance(loaded_openapi, str) or not re.fullmatch(
            r"3\.(?:0|1)(?:\.\d+)?", loaded_openapi
        ):
            errors.append(f"snapshot openapi is not supported for {provider}: {loaded_openapi!r}")
        if loaded_openapi != expected_openapi or not isinstance(loaded_openapi, str):
            continue
        discovered = classify_operations(source_document, provider)
        for operation in discovered:
            if operation.classification == "UNKNOWN":
                errors.append(f"unknown security classification: {operation.id}")
        discovered_by_id = {
            operation.id: _upstream_contract(operation.model_dump(mode="json"))
            for operation in discovered
        }
        discovered_classifications = {
            operation.id: operation.classification for operation in discovered
        }
        manifest_by_id = {
            str(endpoint.get("id")): _upstream_contract(endpoint)
            for endpoint in endpoints
            if endpoint.get("provider") == provider
        }
        manifest_endpoints_by_id = {
            str(endpoint.get("id")): endpoint
            for endpoint in endpoints
            if endpoint.get("provider") == provider
        }
        for endpoint_id in sorted(discovered_by_id.keys() - manifest_by_id.keys()):
            errors.append(f"missing manifest endpoint: {endpoint_id}")
        for endpoint_id in sorted(manifest_by_id.keys() - discovered_by_id.keys()):
            errors.append(f"extra manifest endpoint: {endpoint_id}")
        for endpoint_id in sorted(discovered_by_id.keys() & manifest_by_id.keys()):
            discovered_contract = discovered_by_id[endpoint_id]
            manifest_contract = manifest_by_id[endpoint_id]
            manifest_endpoint = manifest_endpoints_by_id[endpoint_id]
            discovered_classification = discovered_classifications[endpoint_id]
            manifest_classification = manifest_endpoint.get("classification")
            if discovered_classification != manifest_classification:
                errors.append(
                    f"classification mismatch: {endpoint_id}: "
                    f"{manifest_classification!r} -> {discovered_classification!r}"
                )
            if discovered_classification == "AUTHENTICATED":
                if manifest_classification != "AUTHENTICATED":
                    errors.append(
                        f"authenticated endpoint must remain AUTHENTICATED: {endpoint_id}"
                    )
                if manifest_endpoint.get("implemented") is not False:
                    errors.append(
                        f"authenticated endpoint must remain unimplemented: {endpoint_id}"
                    )
                exclusion = manifest_endpoint.get("exclusion")
                exclusion_mapping = (
                    cast(dict[str, Any], exclusion) if isinstance(exclusion, dict) else None
                )
                if (
                    exclusion_mapping is None
                    or exclusion_mapping.get("reason") != "authentication_required"
                ):
                    errors.append(
                        f"authenticated endpoint needs authentication exclusion: {endpoint_id}"
                    )
            if discovered_contract["path"] != manifest_contract["path"]:
                errors.append(
                    f"changed operation path: {endpoint_id}: "
                    f"{manifest_contract['path']} -> {discovered_contract['path']}"
                )
            elif discovered_contract != manifest_contract:
                errors.append(f"changed upstream contract: {endpoint_id}")
    return errors


def _write_yaml(value: Any, output: Path | None) -> None:
    text = yaml.safe_dump(value, allow_unicode=True, sort_keys=False)
    if output is None:
        sys.stdout.write(text)
    else:
        output.write_text(text, encoding="utf-8")


def _write_text(text: str, output: Path | None) -> None:
    if output is None:
        sys.stdout.write(text)
    else:
        output.write_text(text, encoding="utf-8")


def _official_spec(url: str) -> dict[str, Any]:
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=60) as response:  # noqa: S310 - URL is a fixed CLI input.
        value: Any = json.load(response)
    value_mapping = cast(dict[str, Any], value) if isinstance(value, dict) else None
    if value_mapping is None or not isinstance(value_mapping.get("paths"), dict):
        raise ValueError(f"official URL did not return an OpenAPI paths object: {url}")
    return value_mapping


def _load_source(path: Path | None, provider: str, official: bool) -> tuple[dict[str, Any], str]:
    if official:
        source_url = DEFAULT_OFFICIAL_URLS[provider]
        return _official_spec(source_url), source_url
    if path is None:
        raise ValueError(f"--{provider} is required unless --official is used")
    source_path = Path(path)
    return load_openapi(source_path), str(path)


def _format_diff(diff: CatalogDiff) -> str:
    lines = [f"added={len(diff.added)} removed={len(diff.removed)} changed={len(diff.changed)}"]
    for label, items in (
        ("ADDED", diff.added),
        ("REMOVED", diff.removed),
        ("CHANGED", diff.changed),
    ):
        lines.extend(
            f"{label}: {item.get('method', 'GET')} {item.get('path', item.get('id', ''))}"
            for item in items
        )
    for change in diff.typed_changes:
        lines.append(f"SEMANTIC: {change.change_type} {change.impact} {change.operation_id}")
    return "\n".join(lines)


def _check_manifest(path: Path, compras: Path | None = None, pncp: Path | None = None) -> int:
    manifest = _read_manifest(path)
    errors = _validate_manifest(manifest)
    if not errors:
        errors.extend(_check_source_completeness(manifest, path, compras, pncp))
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    endpoints = _manifest_endpoints(manifest)
    report = render_coverage(endpoints)
    by_provider: dict[str, list[dict[str, Any]]] = {}
    for endpoint in endpoints:
        by_provider.setdefault(str(endpoint.get("provider")), []).append(endpoint)
    for provider in ("compras", "pncp"):
        provider_report = render_coverage(by_provider.get(provider, []))
        label = "Compras.gov.br" if provider == "compras" else "PNCP"
        print(f"{label}: {provider_report.ratio:.1%}")
    print(f"overall={report.ratio}")
    print(f"Unmapped public useful GET endpoints: {report.public_useful - report.implemented}")
    return 0 if report.ratio == 1.0 else 1


def _render_tools(path: Path, output: Path | None) -> int:
    manifest = _read_manifest(path)
    errors = _validate_manifest(manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    _write_text(_tools_markdown(manifest), output)
    return 0


def _tools_markdown(manifest: dict[str, Any]) -> str:
    endpoints = _manifest_endpoints(manifest)
    lines = ["# Ferramentas", "", "Ferramentas atômicas geradas a partir do manifesto.", ""]
    for endpoint in endpoints:
        if (
            endpoint.get("classification") != "PUBLIC_USEFUL"
            or endpoint.get("implemented") is not True
        ):
            continue
        description = " ".join(str(endpoint["description"]).split())
        lines.extend(
            [
                f"## `{endpoint['tool']}`",
                "",
                f"- Provedor: `{endpoint['provider']}`",
                f"- Endpoint: `{endpoint['method']} {endpoint['path']}`",
                f"- Descrição: {description}",
                "",
                "### Parâmetros",
            ]
        )
        for parameter in endpoint.get("parameters", []):
            parameter = cast(dict[str, Any], parameter)
            name = parameter.get("name", "")
            location = parameter.get("in", "")
            required = "obrigatório" if parameter.get("required", False) else "opcional"
            schema = json.dumps(
                parameter.get("schema", {}),
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            parameter_description = " ".join(str(parameter.get("description", "")).split())
            lines.append(
                f"- `{name}` (`{location}`, {required}): schema: {schema}; "
                f"descrição: {parameter_description}"
            )
        lines.extend(
            [
                "",
            ]
        )
    lines.extend(
        [
            "## Ferramentas semânticas e diagnóstico",
            "",
            "Ferramentas compostas e de diagnóstico que realizam somente consultas de leitura "
            "nas fontes oficiais.",
            "",
        ]
    )
    for name, description, parameters, behavior in _NON_ATOMIC_TOOLS:
        lines.extend(
            [
                f"### `{name}`",
                "",
                f"- Descrição: {description}",
                f"- Argumentos principais: {parameters}",
                f"- Comportamento somente leitura: {behavior}",
                "",
            ]
        )
    return "\n".join(lines)


def _coverage_markdown(manifest: dict[str, Any]) -> str:
    endpoints = _manifest_endpoints(manifest)
    lines = [
        "# Cobertura de endpoints",
        "",
        "| API | GET oficiais | Públicos úteis | Implementados | Cobertura |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for provider, label in (("compras", "Compras.gov.br"), ("pncp", "PNCP")):
        provider_endpoints = [
            endpoint for endpoint in endpoints if endpoint.get("provider") == provider
        ]
        report = render_coverage(provider_endpoints)
        lines.append(
            f"| {label} | {len(provider_endpoints)} | {report.public_useful} | "
            f"{report.implemented} | {report.ratio:.1%} |"
        )
    report = render_coverage(endpoints)
    lines.extend(
        [
            f"| **Total** | **{len(endpoints)}** | **{report.public_useful}** | "
            f"**{report.implemented}** | **{report.ratio:.1%}** |",
            "",
            "## Endpoints",
            "",
        ]
    )
    for endpoint in endpoints:
        if endpoint.get("classification") == "AUTHENTICATED":
            lines.append(
                f"- `AUTH` {endpoint.get('method')} {endpoint.get('path')}"
                " | Excluído: authentication_required"
            )
            continue
        marker = "OK" if endpoint.get("implemented") else "PENDING"
        lines.append(f"- `{marker}` {endpoint.get('method')} {endpoint.get('path')}")
    return "\n".join(lines) + "\n"


def _render_coverage(path: Path, output: Path | None) -> int:
    manifest = _read_manifest(path)
    errors = _validate_manifest(manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    _write_text(_coverage_markdown(manifest), output)
    return 0


def _parse_tools_document(document: str) -> tuple[dict[str, dict[str, Any]], list[str]]:
    parsed: dict[str, dict[str, Any]] = {}
    errors: list[str] = []
    semantic_section_seen = False
    blocks = re.split(r"(?m)^##\s+", document)
    for index, block in enumerate(blocks[1:], start=1):
        lines = block.splitlines()
        if lines and lines[0] == "Ferramentas semânticas e diagnóstico":
            if semantic_section_seen:
                errors.append("duplicate semantic tools section")
            semantic_section_seen = True
            semantic_blocks = re.split(r"(?m)^###\s+", "\n".join(lines[2:]))
            for semantic_index, semantic_block in enumerate(semantic_blocks[1:], start=1):
                semantic_lines = semantic_block.splitlines()
                name_match = (
                    re.fullmatch(r"`([^`]+)`", semantic_lines[0])
                    if semantic_lines
                    else None
                )
                if name_match is None:
                    errors.append(f"malformed semantic tool heading at block {semantic_index}")
                    continue
                name = name_match.group(1)
                if name not in _NON_ATOMIC_TOOL_NAMES:
                    errors.append(f"unknown semantic tool: {name}")
                    continue
                if name in parsed:
                    errors.append(f"duplicate tool block: {name}")
                description_match = next(
                    (
                        re.fullmatch(r"- Descrição: (.*)", line)
                        for line in semantic_lines[2:]
                        if line.startswith("- Descrição: ")
                    ),
                    None,
                )
                parameters_match = next(
                    (
                        re.fullmatch(r"- Argumentos principais: (.*)", line)
                        for line in semantic_lines[2:]
                        if line.startswith("- Argumentos principais: ")
                    ),
                    None,
                )
                if description_match is None or not description_match.group(1).strip():
                    errors.append(f"semantic tool description must be non-empty: {name}")
                    continue
                if parameters_match is None or not parameters_match.group(1).strip():
                    errors.append(f"semantic tool parameters must be non-empty: {name}")
                    continue
                parsed[name] = {
                    "description": " ".join(description_match.group(1).split()),
                    "parameters": " ".join(parameters_match.group(1).split()),
                }
            continue
        name_match = re.fullmatch(r"`((?:compras|pncp)_[a-z0-9_]+)`", lines[0]) if lines else None
        if name_match is None:
            errors.append(f"malformed tool heading at block {index}")
            continue
        name = name_match.group(1)
        if name in parsed:
            errors.append(f"duplicate tool block: {name}")
        provider_match = (
            re.fullmatch(r"- Provedor: `([^`]+)`", lines[2]) if len(lines) > 2 else None
        )
        endpoint_match = (
            re.fullmatch(r"- Endpoint: `(GET) (.+)`", lines[3]) if len(lines) > 3 else None
        )
        description_match = (
            re.fullmatch(r"- Descrição: (.*)", lines[4]) if len(lines) > 4 else None
        )
        if not provider_match or not endpoint_match or not description_match:
            errors.append(f"malformed metadata for tool: {name}")
            continue
        parameters: list[dict[str, Any]] = []
        if len(lines) < 6 or lines[6] != "### Parâmetros":
            errors.append(f"missing parameter section for tool: {name}")
            continue
        parameter_names: set[tuple[str, str]] = set()
        for line in lines[7:]:
            if not line:
                continue
            parameter_match = re.fullmatch(
                r"- `([^`]+)` \(`([^`]+)`, (obrigatório|opcional)\): "
                r"schema: (.+); descrição: (.*)",
                line,
            )
            if parameter_match is None:
                errors.append(f"malformed parameter for tool: {name}")
                continue
            try:
                schema = json.loads(parameter_match.group(4))
            except json.JSONDecodeError:
                errors.append(f"invalid parameter schema for tool: {name}")
                continue
            if not isinstance(schema, dict):
                errors.append(f"parameter schema must be an object for tool: {name}")
                continue
            parameter_key = (parameter_match.group(1), parameter_match.group(2))
            if parameter_key in parameter_names:
                errors.append(f"duplicate parameter for tool: {name}: {parameter_key}")
            parameter_names.add(parameter_key)
            parameters.append(
                {
                    "name": parameter_match.group(1),
                    "in": parameter_match.group(2),
                    "required": parameter_match.group(3) == "obrigatório",
                    "schema": schema,
                    "description": parameter_match.group(5),
                }
            )
        parsed[name] = {
            "provider": provider_match.group(1),
            "method": endpoint_match.group(1),
            "path": endpoint_match.group(2),
            "description": " ".join(description_match.group(1).split()),
            "parameters": parameters,
        }
    if not semantic_section_seen:
        errors.append("missing semantic tools section")
    for name in _NON_ATOMIC_TOOL_NAMES:
        if name not in parsed:
            errors.append(f"missing semantic tool: {name}")
    return parsed, errors


def _check_tools(tools_path: Path, manifest_path: Path) -> int:
    manifest = _read_manifest(manifest_path)
    errors = _validate_manifest(manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    expected = {
        str(endpoint["tool"]): {
            "provider": endpoint["provider"],
            "method": endpoint["method"],
            "path": endpoint["path"],
            "description": " ".join(str(endpoint["description"]).split()),
            "parameters": [
                {
                    "name": parameter["name"],
                    "in": parameter["in"],
                    "required": bool(parameter.get("required", False)),
                    "schema": parameter.get("schema", {}),
                    "description": " ".join(str(parameter.get("description", "")).split()),
                }
                for parameter in endpoint.get("parameters", [])
            ],
        }
        for endpoint in _manifest_endpoints(manifest)
        if endpoint.get("classification") == "PUBLIC_USEFUL" and endpoint.get("implemented") is True
    }
    expected.update(
        {
            name: {"description": description, "parameters": parameters}
            for name, description, parameters, _behavior in _NON_ATOMIC_TOOLS
        }
    )
    actual_text = tools_path.read_text(encoding="utf-8")
    actual, parse_errors = _parse_tools_document(actual_text)
    if parse_errors or actual != expected or actual_text != _tools_markdown(manifest):
        print(
            f"tools document differs: expected={len(expected)} actual={len(actual)} "
            f"errors={len(parse_errors)}",
            file=sys.stderr,
        )
        return 1
    print(f"tools document is current: {tools_path} ({len(expected)} tools)")
    return 0


def _check_coverage_doc(manifest_path: Path, document_path: Path) -> int:
    manifest = _read_manifest(manifest_path)
    errors = _validate_manifest(manifest)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    expected = _coverage_markdown(manifest)
    actual = document_path.read_text(encoding="utf-8") if document_path.exists() else ""
    if actual != expected:
        print(f"coverage document differs: {document_path}", file=sys.stderr)
        return 1
    print(f"coverage document is current: {document_path}")
    return 0


def _check_pair(
    values: list[str] | None, default_document: str, default_manifest: str
) -> tuple[Path, Path]:
    if not values:
        return Path(default_document), Path(default_manifest)
    if len(values) == 1:
        candidate = Path(values[0])
        return (
            (candidate, Path(default_manifest))
            if candidate.suffix.lower() == ".md"
            else (Path(default_document), candidate)
        )
    return Path(values[0]), Path(values[1])


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Descobre e compara contratos oficiais")
    checks = parser.add_mutually_exclusive_group()
    checks.add_argument("--check", metavar="MANIFEST")
    checks.add_argument("--check-tools", nargs="*", metavar="PATH")
    checks.add_argument("--check-coverage-doc", nargs="*", metavar="PATH")
    parser.add_argument("--coverage-doc", default="ENDPOINT_COVERAGE.md", metavar="PATH")
    subparsers = parser.add_subparsers(dest="command")
    discover = subparsers.add_parser("discover", help="descobre endpoints e gera manifesto YAML")
    discover.add_argument("--compras", type=Path, metavar="SNAPSHOT")
    discover.add_argument("--pncp", type=Path, metavar="SNAPSHOT")
    discover.add_argument("--official", action="store_true")
    discover.add_argument("--compare", type=Path)
    discover.add_argument("--fail-on-diff", action="store_true")
    discover.add_argument("--output", type=Path)
    for name in ("render-tools", "render-coverage"):
        command = subparsers.add_parser(name)
        command.add_argument("manifest", type=Path)
        command.add_argument("--output", type=Path)
        if name == "render-coverage":
            command.add_argument("--coverage-doc", dest="render_coverage_doc", type=Path)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        check_modes = sum(
            value is not None
            for value in (
                getattr(args, "check", None),
                getattr(args, "check_tools", None),
                getattr(args, "check_coverage_doc", None),
            )
        )
        if args.command in {"render-tools", "render-coverage"} and check_modes:
            raise ValueError("check modes cannot be combined with a render command")
        if args.command == "discover":
            if check_modes:
                raise ValueError("check modes cannot be combined with discover")
            if args.fail_on_diff and args.compare is None:
                raise ValueError("--fail-on-diff requires --compare")
            if args.official and (args.compras is not None or args.pncp is not None):
                raise ValueError("--official cannot be combined with local snapshot paths")
            specs: dict[str, dict[str, Any]] = {}
            sources: dict[str, str] = {}
            for provider in ("compras", "pncp"):
                path = getattr(args, provider)
                specs[provider], sources[provider] = _load_source(path, provider, args.official)
            manifest = _manifest_from_specs(specs, sources)
            if args.compare:
                previous = _read_manifest(args.compare)
                diff = compare_catalogs(
                    previous["endpoints"],
                    manifest["endpoints"],
                    previous_source_version=previous.get("source_version"),
                    current_source_version=manifest.get("source_version"),
                )
                print(_format_diff(diff))
                if args.fail_on_diff and (
                    diff.added or diff.removed or diff.changed or diff.changes
                ):
                    return 1
            if args.output:
                _write_yaml(manifest, args.output)
            elif not args.compare:
                _write_yaml(manifest, None)
            return 0
        if args.command == "render-tools":
            return _render_tools(args.manifest, args.output)
        if args.command == "render-coverage":
            output = args.output or args.render_coverage_doc or Path(args.coverage_doc)
            return _render_coverage(args.manifest, output)
        check_modes = sum(
            value is not None
            for value in (
                getattr(args, "check", None),
                getattr(args, "check_tools", None),
                getattr(args, "check_coverage_doc", None),
            )
        )
        if check_modes > 1:
            raise ValueError("only one check mode is allowed")
        if args.check:
            return _check_manifest(Path(args.check))
        if args.check_tools is not None:
            tools_path, manifest_path = _check_pair(
                args.check_tools, "TOOLS.md", "coverage/endpoints.yaml"
            )
            return _check_tools(tools_path, manifest_path)
        if args.check_coverage_doc is not None:
            document_path, manifest_path = _check_pair(
                args.check_coverage_doc, args.coverage_doc, "coverage/endpoints.yaml"
            )
            return _check_coverage_doc(manifest_path, document_path)
        _parser().print_help()
        return 0
    except (OSError, ValueError, KeyError, TypeError, yaml.YAMLError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
