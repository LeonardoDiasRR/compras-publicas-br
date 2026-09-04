import copy
import hashlib
import json
import math
import re
import unicodedata
from collections.abc import Callable, Mapping
from datetime import UTC, date, datetime
from string import Formatter
from typing import Any, cast
from urllib.parse import quote

from src.features.catalogo.models import McpResponse, Operation
from src.features.provedores.clientes import ComprasClient, PncpClient
from src.shared.http_readonly import UpstreamError
from src.shared.runtime import Settings, TtlCache

_DEFAULT_RESULT_LIMIT = 100
_DEFAULT_MAX_PAGE = 10_000
_DEFAULT_MAX_PAGE_SIZE = 1_000
_PAGINATION_ALIASES = {
    "hasNext": "has_next",
    "has_next": "has_next",
    "nextPage": "next_page",
    "next_page": "next_page",
    "proximaPagina": "next_page",
    "proxima_pagina": "next_page",
    "next": "next",
    "nextToken": "next_token",
    "next_token": "next_token",
}
_TOKEN_PARAMETER_NAMES = (
    "pageToken",
    "page_token",
    "cursor",
    "cursorToken",
    "continuationToken",
    "nextToken",
    "token",
)
_FORMAT_VALUES = {"normalizado", "original"}


def normalize_cnpj(value: str) -> str:
    raw_value: Any = value
    if not isinstance(raw_value, str):
        raise ValueError("cnpj must contain 14 numeric digits")
    normalized = "".join(
        character
        for character in raw_value
        if not character.isspace() and not unicodedata.category(character).startswith("P")
    )
    if not re.fullmatch(r"[0-9]{14}", normalized):
        raise ValueError("cnpj must contain 14 numeric digits")
    return normalized


def render_path(template: str, values: dict[str, Any]) -> str:
    rendered: list[str] = []
    for literal, field_name, format_spec, conversion in Formatter().parse(template):
        rendered.append(literal)
        if field_name is None:
            continue
        if field_name not in values:
            raise KeyError(f"missing path parameter: {field_name}")
        value = values[field_name]
        if conversion == "r":
            value = repr(value)
        elif conversion == "s":
            value = str(value)
        elif conversion == "a":
            value = ascii(value)
        if format_spec:
            value = format(value, format_spec)
        rendered.append(quote(str(value), safe=""))
    return "".join(rendered)


class QueryService:
    def __init__(
        self,
        settings: Any | None = None,
        cache: Any | None = None,
        compras_factory: Callable[..., Any] | None = None,
        pncp_factory: Callable[..., Any] | None = None,
        max_page: int | None = None,
        max_page_size: int | None = None,
        max_results: int | None = None,
        max_document_bytes: int | None = None,
    ) -> None:
        self.settings = settings if settings is not None else Settings()  # pyright: ignore[reportCallIssue]
        self.cache = cache if cache is not None else TtlCache()
        self._factories: dict[str, Callable[..., Any]] = {
            "compras": compras_factory or ComprasClient,
            "pncp": pncp_factory or PncpClient,
        }
        self.max_page = self._configured_limit(
            max_page, ("max_page", "max_pagina"), _DEFAULT_MAX_PAGE, "max_page"
        )
        self.max_page_size = self._configured_limit(
            max_page_size,
            ("max_page_size", "max_tamanho_pagina"),
            _DEFAULT_MAX_PAGE_SIZE,
            "max_page_size",
        )
        self.max_results = self._configured_limit(
            max_results,
            ("max_results", "max_resultados", "max_limite_resultados"),
            _DEFAULT_RESULT_LIMIT,
            "max_results",
        )
        self.max_document_bytes = self._configured_limit(
            max_document_bytes,
            ("max_document_bytes",),
            25_000_000,
            "max_document_bytes",
        )

    def _setting_int(self, names: tuple[str, ...], default: int) -> int:
        for name in names:
            value = getattr(self.settings, name, None)
            if isinstance(value, int) and not isinstance(value, bool):
                return value
        return default

    def _configured_limit(
        self,
        explicit: int | None,
        names: tuple[str, ...],
        default: int,
        label: str,
    ) -> int:
        value: Any = explicit if explicit is not None else self._setting_int(names, default)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise ValueError(f"{label} must be a positive integer")
        return value

    async def execute(self, operation: Operation, arguments: dict[str, Any]) -> McpResponse:
        if operation.method != "GET":
            raise ValueError("only GET operations are supported")

        self._validate_supported_parameters(operation)
        parameters = self._parameters(operation)
        resolved_arguments = self._resolve_arguments(arguments, parameters)
        self._check_required(resolved_arguments, parameters)

        formato = resolved_arguments.pop("formato", "normalizado")
        if formato not in _FORMAT_VALUES:
            raise ValueError("formato must be one of: normalizado, original")
        auto_paginar = resolved_arguments.pop("auto_paginar", False)
        if not isinstance(auto_paginar, bool):
            raise ValueError("auto_paginar must be a boolean")

        page_name = self._find_parameter(parameters, ("pagina", "page"))
        page_size_name = self._find_parameter(
            parameters, ("tamanhoPagina", "tamanho_pagina", "pageSize", "page_size")
        )
        token_name = self._find_parameter(parameters, _TOKEN_PARAMETER_NAMES)
        limit_requested = resolved_arguments.pop("limite_resultados", None)
        is_list_operation = (
            page_name is not None or page_size_name is not None or token_name is not None
        )
        if "auto_paginar" in arguments and page_name is None and token_name is None:
            raise ValueError("auto_paginar requires a documented query pagination parameter")
        if (
            (limit_requested is not None or "limite_resultados" in arguments)
            and not is_list_operation
        ):
            raise ValueError("limite_resultados requires a documented pagination parameter")
        if is_list_operation:
            limit = self._validate_limit(limit_requested)
        elif limit_requested is not None:
            limit = self.max_results
        else:
            limit = None

        path_values: dict[str, Any] = {}
        query: dict[str, Any] = {}
        for name, value in resolved_arguments.items():
            parameter = parameters[name]
            if value is None:
                if parameter.get("required", False):
                    raise ValueError(f"parameter {name} is required")
                continue
            value = self._normalize_parameter(name, value)
            self._validate_parameter(name, value, parameter)
            if parameter.get("in") == "path":
                path_values[name] = value
            elif parameter.get("in") == "query":
                query[name] = value
            else:
                raise ValueError(f"unsupported parameter location for {name}")

        if page_name is not None and page_name in query:
            self._validate_page_value(query[page_name], page_name, self.max_page)
        if page_size_name is not None and page_size_name in query:
            self._validate_page_value(query[page_size_name], page_size_name, self.max_page_size)
        if auto_paginar and page_name is not None and page_name not in query:
            query[page_name] = 1
        if formato == "original":
            if auto_paginar:
                raise ValueError("formato=original cannot be combined with auto_paginar")
            if limit_requested is not None:
                raise ValueError("formato=original cannot be combined with limite_resultados")

        path = render_path(operation.path, path_values)
        cache_key = self._cache_key(operation, path, query, formato, bool(auto_paginar), limit)
        cache_allowed = (
            self._cache_enabled()
            and self._is_public(operation)
            and not self._is_bounded_content(operation)
        )
        if cache_allowed:
            cached = self.cache.get(cache_key)
            if cached is not None:
                cached_copy = copy.deepcopy(cached)
                if isinstance(cached_copy, McpResponse):
                    if self._cacheable_response(operation, cached_copy):
                        return cached_copy
                else:
                    cached_response = McpResponse.model_validate(cached_copy)
                    if self._cacheable_response(operation, cached_response):
                        return cached_response

        adapter = self._factories[operation.provider]()
        normalize_page = getattr(adapter, "normalize_page", None)
        if not callable(normalize_page):
            raise TypeError("provider adapter must expose normalize_page")

        first_payload: Any = None
        payload_seen = False
        normalized_items: list[Any] = []
        items_are_lists = False
        pagination: dict[str, Any] = {}
        current_query = dict(query)
        visited_positions: set[tuple[str, str]] = set()

        try:
            async with adapter.client(max_document_bytes=self.max_document_bytes) as client:
                while True:
                    position = self._position(current_query, page_name, token_name)
                    if position in visited_positions:
                        raise ValueError("pagination did not make forward progress")
                    visited_positions.add(position)
                    payload = await client.get(path, params=current_query)
                    if not payload_seen:
                        first_payload = payload
                        payload_seen = True
                    if (
                        self._is_bounded_content(operation)
                        and self._content_size(payload) > self.max_document_bytes
                    ):
                        return self._file_size_response(operation, query)
                    page = cast(Mapping[str, Any], normalize_page(payload))
                    items = page.get("items")
                    page_pagination = self._pagination(payload, page.get("pagination"))
                    pagination.update(page_pagination)
                    if isinstance(items, list):
                        items_are_lists = True
                        normalized_items.extend(cast(list[Any], items))
                    elif not normalized_items:
                        normalized_items = [items]

                    if not auto_paginar or not isinstance(items, list):
                        break
                    if limit is not None and len(normalized_items) >= limit:
                        break
                    next_position = self._next_position(
                        page_pagination, current_query, page_name, token_name
                    )
                    if next_position is None:
                        break
                    if next_position in visited_positions:
                        raise ValueError("pagination did not make forward progress")
                    if position[0] == "page" and next_position[0] == "page":
                        if int(next_position[1]) <= int(position[1]):
                            raise ValueError("pagination page must make forward progress")
                    if next_position[0] == "page":
                        if page_name is None:
                            raise ValueError(
                                "upstream returned a page without a query page parameter"
                            )
                        next_page = int(next_position[1])
                        self._validate_page_value(next_page, page_name, self.max_page)
                        current_query[page_name] = next_page
                    else:
                        if token_name is None:
                            raise ValueError(
                                "upstream returned a token without a query token parameter"
                            )
                        current_query[token_name] = next_position[1]
        except UpstreamError as error:
            if error.kind != "DOCUMENT_TOO_LARGE" or not self._is_bounded_content(operation):
                raise
            return self._file_size_response(operation, query)

        data: Any
        if formato == "original":
            data = first_payload
        elif items_are_lists:
            data = normalized_items
        else:
            data = normalized_items[0] if normalized_items else None
        if formato != "original" and limit is not None and isinstance(data, list):
            data = cast(list[Any], data)[:limit]

        response = self._response(operation, query, data, pagination)
        if cache_allowed and self._cacheable_response(operation, response):
            self.cache.put(cache_key, copy.deepcopy(response), self._cache_ttl(operation))
        return response

    async def execute_many(
        self, operations: list[Operation], arguments: dict[str, Any]
    ) -> dict[str, Any]:
        results: dict[str, Any] = {}
        for operation in operations:
            self._validate_supported_parameters(operation)
            parameters = self._parameters(operation)
            allowed = set(parameters)
            allowed.update(
                alias
                for alias in (
                    "page",
                    "page_size",
                    "pageSize",
                    "tamanhoPagina",
                    "pagina",
                    "tamanho_pagina",
                )
                if self._resolve_name(alias, parameters) is not None
            )
            allowed.update({"formato", "auto_paginar", "limite_resultados"})
            filtered = {key: value for key, value in arguments.items() if key in allowed}
            response = await self.execute(operation, filtered)
            results[operation.tool or operation.id] = response.model_dump(mode="json")
        return results

    @staticmethod
    def _parameters(operation: Operation) -> dict[str, dict[str, Any]]:
        parameters: dict[str, dict[str, Any]] = {}
        for raw_parameter in operation.parameters:
            name = raw_parameter.get("name")
            location = raw_parameter.get("in")
            if isinstance(name, str) and location in {"path", "query"}:
                parameters[name] = dict(raw_parameter)
        return parameters

    @staticmethod
    def _validate_supported_parameters(operation: Operation) -> None:
        for parameter in operation.parameters:
            location = parameter.get("in")
            if location not in {"path", "query"} and parameter.get("required", False):
                name = parameter.get("name", "<unnamed>")
                raise ValueError(
                    f"unsupported required parameter {name!r} in location {location!r}"
                )

    def _resolve_arguments(
        self, arguments: dict[str, Any], parameters: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        resolved: dict[str, Any] = {}
        for name, value in arguments.items():
            if name in {"formato", "auto_paginar", "limite_resultados"}:
                resolved[name] = value
                continue
            actual_name = self._resolve_name(name, parameters)
            if actual_name is None:
                raise ValueError(f"unknown parameter: {name}")
            resolved[actual_name] = value
        return resolved

    @staticmethod
    def _resolve_name(name: str, parameters: dict[str, dict[str, Any]]) -> str | None:
        if name in parameters:
            return name
        aliases = {
            "pagina": ("page",),
            "page": ("pagina",),
            "tamanho_pagina": ("tamanhoPagina", "pageSize", "page_size"),
            "tamanhoPagina": ("tamanho_pagina", "pageSize", "page_size"),
            "pageSize": ("tamanhoPagina", "tamanho_pagina", "page_size"),
            "page_size": ("pageSize", "tamanhoPagina", "tamanho_pagina"),
        }
        return next(
            (
                candidate
                for candidate in aliases.get(name, ())
                if candidate in parameters and parameters[candidate].get("in") == "query"
            ),
            None,
        )

    @staticmethod
    def _check_required(
        arguments: dict[str, Any], parameters: dict[str, dict[str, Any]]
    ) -> None:
        for name, parameter in parameters.items():
            if parameter.get("required", False) and (
                name not in arguments or arguments[name] is None
            ):
                raise ValueError(f"missing required parameter: {name}")

    @staticmethod
    def _find_parameter(
        parameters: dict[str, dict[str, Any]], names: tuple[str, ...]
    ) -> str | None:
        return next(
            (
                name
                for name in names
                if name in parameters and parameters[name].get("in") == "query"
            ),
            None,
        )

    @staticmethod
    def _normalize_parameter(name: str, value: Any) -> Any:
        lowered = name.lower()
        if "cnpj" in lowered and "cpf" not in lowered:
            return normalize_cnpj(value)
        return value

    def _validate_parameter(self, name: str, value: Any, parameter: dict[str, Any]) -> None:
        schema_value = parameter.get("schema", {})
        schema = cast(dict[str, Any], schema_value) if isinstance(schema_value, Mapping) else {}
        expected_type = schema.get("type")
        if isinstance(expected_type, list):
            expected_types = cast(list[Any], expected_type)
        else:
            expected_types = [expected_type] if expected_type is not None else []
        if expected_types and not any(
            self._matches_type(value, type_name) for type_name in expected_types
        ):
            expected = ", ".join(str(type_name) for type_name in expected_types)
            raise ValueError(f"parameter {name} must have type {expected}")

        enum = schema.get("enum")
        if isinstance(enum, list) and value not in enum:
            raise ValueError(f"parameter {name} must be one of {enum}")
        self._validate_format(name, value, schema.get("format"))
        pattern = schema.get("pattern")
        if (
            isinstance(pattern, str)
            and isinstance(value, str)
            and re.search(pattern, value) is None
        ):
            raise ValueError(f"parameter {name} has an invalid format")
        if isinstance(value, str):
            minimum_length = schema.get("minLength")
            maximum_length = schema.get("maxLength")
            if isinstance(minimum_length, int) and len(value) < minimum_length:
                raise ValueError(f"parameter {name} is shorter than {minimum_length} characters")
            if isinstance(maximum_length, int) and len(value) > maximum_length:
                raise ValueError(f"parameter {name} is longer than {maximum_length} characters")
        self._validate_bounds(name, value, schema)

    @staticmethod
    def _matches_type(value: Any, type_name: Any) -> bool:
        if type_name == "string":
            return isinstance(value, str)
        if type_name == "integer":
            return isinstance(value, int) and not isinstance(value, bool)
        if type_name == "number":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        if type_name == "boolean":
            return isinstance(value, bool)
        if type_name == "array":
            return isinstance(value, list)
        if type_name == "object":
            return isinstance(value, Mapping)
        if type_name == "null":
            return value is None
        return True

    @staticmethod
    def _validate_format(name: str, value: Any, format_name: Any) -> None:
        if not isinstance(format_name, str):
            return
        if format_name in {"int32", "int64"}:
            if not isinstance(value, int) or isinstance(value, bool):
                raise ValueError(f"parameter {name} must be an integer")
            bits = 32 if format_name == "int32" else 64
            if not -(2 ** (bits - 1)) <= value <= 2 ** (bits - 1) - 1:
                raise ValueError(f"parameter {name} is outside {format_name} range")
        elif format_name == "date":
            if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                raise ValueError(f"parameter {name} must be a date")
            try:
                date.fromisoformat(value)
            except ValueError as error:
                raise ValueError(f"parameter {name} must be a date") from error
        elif format_name == "date-time":
            if not isinstance(value, str) or not re.fullmatch(
                r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})",
                value,
            ):
                raise ValueError(f"parameter {name} must be a date-time")
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError as error:
                raise ValueError(f"parameter {name} must be a date-time") from error

    @staticmethod
    def _validate_bounds(name: str, value: Any, schema: dict[str, Any]) -> None:
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            return
        if not math.isfinite(float(value)):
            raise ValueError(f"parameter {name} must be finite")
        minimum = schema.get("minimum")
        if isinstance(minimum, (int, float)) and not isinstance(minimum, bool) and value < minimum:
            raise ValueError(f"parameter {name} exceeds minimum {minimum}")
        maximum = schema.get("maximum")
        if isinstance(maximum, (int, float)) and not isinstance(maximum, bool) and value > maximum:
            raise ValueError(f"parameter {name} exceeds maximum {maximum}")
        exclusive_minimum = schema.get("exclusiveMinimum")
        if exclusive_minimum is True and isinstance(minimum, (int, float)):
            if value <= minimum:
                raise ValueError(f"parameter {name} must be greater than {minimum}")
        elif (
            isinstance(exclusive_minimum, (int, float))
            and not isinstance(exclusive_minimum, bool)
            and value <= exclusive_minimum
        ):
            raise ValueError(f"parameter {name} must be greater than {exclusive_minimum}")
        exclusive_maximum = schema.get("exclusiveMaximum")
        if exclusive_maximum is True and isinstance(maximum, (int, float)):
            if value >= maximum:
                raise ValueError(f"parameter {name} must be less than {maximum}")
        elif (
            isinstance(exclusive_maximum, (int, float))
            and not isinstance(exclusive_maximum, bool)
            and value >= exclusive_maximum
        ):
            raise ValueError(f"parameter {name} must be less than {exclusive_maximum}")

    @staticmethod
    def _validate_page_value(value: Any, name: str, maximum: int) -> None:
        if not isinstance(value, int) or isinstance(value, bool) or value < 1:
            raise ValueError(f"parameter {name} must be a positive integer")
        if value > maximum:
            raise ValueError(f"parameter {name} must be at most {maximum}")

    def _validate_limit(self, value: Any) -> int:
        if value is None:
            if _DEFAULT_RESULT_LIMIT > self.max_results:
                raise ValueError("max_results must be at least 100 for the default limit")
            return _DEFAULT_RESULT_LIMIT
        self._validate_page_value(value, "limite_resultados", self.max_results)
        return value

    @staticmethod
    def _pagination(payload: Any, normalized: Any) -> dict[str, Any]:
        result: dict[str, Any] = (
            dict(cast(Mapping[str, Any], normalized)) if isinstance(normalized, Mapping) else {}
        )
        if isinstance(payload, Mapping):
            for upstream_name, normalized_name in _PAGINATION_ALIASES.items():
                if upstream_name in payload and normalized_name not in result:
                    result[normalized_name] = payload[upstream_name]
        return result

    @staticmethod
    def _position(
        query: dict[str, Any], page_name: str | None, token_name: str | None
    ) -> tuple[str, str]:
        if token_name is not None and token_name in query:
            return ("token", str(query[token_name]))
        if page_name is not None and page_name in query:
            return ("page", str(query[page_name]))
        return ("initial", "")

    @staticmethod
    def _next_position(
        pagination: dict[str, Any],
        query: dict[str, Any],
        page_name: str | None,
        token_name: str | None,
    ) -> tuple[str, str] | None:
        current_page = query.get(page_name) if page_name is not None else None
        current = (
            current_page
            if isinstance(current_page, int) and not isinstance(current_page, bool)
            else 1
        )
        for key in ("next_page", "next_token", "next"):
            if key not in pagination or pagination[key] is None or pagination[key] is False:
                continue
            if pagination[key] == "":
                continue
            value = pagination[key]
            if key == "next_token":
                if token_name is None:
                    raise ValueError("upstream returned a token without a query token parameter")
                if isinstance(value, bool) or not isinstance(value, (str, int)):
                    raise ValueError("upstream returned an invalid next token")
                return ("token", str(value))
            if isinstance(value, str):
                try:
                    value = int(value)
                except ValueError:
                    if token_name is None:
                        raise ValueError(
                            "upstream returned a non-numeric page without a query token parameter"
                        ) from None
                    return ("token", value)
            elif not isinstance(value, int) or isinstance(value, bool):
                raise ValueError("upstream returned an invalid next page")
            if page_name is None:
                raise ValueError("upstream returned a page without a query page parameter")
            return ("page", str(value))
        if "has_next" in pagination:
            has_next = pagination["has_next"]
            if not isinstance(has_next, bool) or not has_next:
                return None
            if page_name is not None:
                return ("page", str(current + 1))
            raise ValueError("upstream pagination did not provide a next token")
        total_pages = pagination.get("total_pages")
        if (
            page_name is not None
            and isinstance(total_pages, int)
            and total_pages > current
        ):
            return ("page", str(current + 1))
        return None

    def _cache_key(
        self,
        operation: Operation,
        path: str,
        query: dict[str, Any],
        formato: str,
        auto_paginar: bool,
        limit: int | None,
    ) -> str:
        cache_query = {
            "query": query,
            "formato": formato,
            "auto_paginar": auto_paginar,
            "limite_resultados": limit,
        }
        material = json.dumps(
            [operation.provider, operation.id, path, cache_query],
            ensure_ascii=True,
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        )
        return hashlib.sha256(material.encode("utf-8")).hexdigest()

    def _cache_enabled(self) -> bool:
        value = getattr(self.settings, "cache_enabled", True)
        if isinstance(value, str):
            return value.lower() not in {"0", "false", "no", "off"}
        return bool(value)

    @staticmethod
    def _is_public(operation: Operation) -> bool:
        return operation.classification == "PUBLIC_USEFUL"

    @staticmethod
    def _contains_unreturned_content(value: Any) -> bool:
        if isinstance(value, Mapping):
            mapping = cast(Mapping[str, Any], value)
            if mapping.get("content_returned") is False:
                return True
            return any(QueryService._contains_unreturned_content(item) for item in mapping.values())
        if isinstance(value, list):
            return any(
                QueryService._contains_unreturned_content(item) for item in cast(list[Any], value)
            )
        return False

    @staticmethod
    def _cacheable_response(operation: Operation, response: McpResponse) -> bool:
        return (
            QueryService._is_public(operation)
            and not QueryService._is_bounded_content(operation)
            and not QueryService._contains_unreturned_content(response.data)
        )

    def _cache_ttl(self, operation: Operation) -> int:
        extra = operation.model_extra or {}
        category = str(extra.get("cache_category", extra.get("category", ""))).lower()
        path = operation.path.lower()
        if not category:
            if "dominio" in path or "domain" in path:
                category = "domains"
            elif any(
                marker in path
                for marker in ("catalog", "modalidade", "modulo-material", "modulo-servico")
            ):
                category = "catalog"
            elif "histor" in path:
                category = "historical"
            else:
                category = "recent"
        names = {
            "domain": "cache_domains_ttl",
            "domains": "cache_domains_ttl",
            "catalog": "cache_catalog_ttl",
            "recent": "cache_recent_ttl",
            "historical": "cache_historical_ttl",
        }
        return self._setting_int((names.get(category, "cache_recent_ttl"),), 300)

    @staticmethod
    def _is_bounded_content(operation: Operation) -> bool:
        path = operation.path.lower()
        if any(
            word in path
            for word in (
                "/arquivo",
                "/document",
                "/download",
                "/imagem",
                "csv",
            )
        ):
            return True
        extra = operation.model_extra or {}
        responses = extra.get("responses")
        if not isinstance(responses, Mapping):
            return False
        response_values = cast(Mapping[Any, Any], responses).values()
        for raw_response in response_values:
            if not isinstance(raw_response, Mapping):
                continue
            response = cast(Mapping[str, Any], raw_response)
            content = response.get("content")
            if isinstance(content, Mapping) and any(
                str(content_type).startswith(
                    (
                        "application/pdf",
                        "application/octet-stream",
                        "application/zip",
                        "application/vnd.",
                        "image/",
                        "text/csv",
                        "text/plain",
                    )
                )
                for content_type in cast(Mapping[Any, Any], content)
            ):
                return True
        return False

    @staticmethod
    def _content_size(payload: Any) -> int:
        if isinstance(payload, (bytes, bytearray)):
            return len(payload)
        if isinstance(payload, str):
            return len(payload.encode("utf-8"))
        if isinstance(payload, Mapping):
            for key in ("content", "body"):
                if key in payload:
                    return QueryService._content_size(payload[key])
        return 0

    @staticmethod
    def _file_size_response(operation: Operation, query: dict[str, Any]) -> McpResponse:
        return QueryService._response(
            operation,
            query,
            {
                "download_available": True,
                "content_returned": False,
                "reason": "file_size_limit",
            },
            {},
        )

    @staticmethod
    def _response(
        operation: Operation, query: dict[str, Any], data: Any, pagination: dict[str, Any]
    ) -> McpResponse:
        return McpResponse(
            source=operation.provider,
            endpoint=operation.path,
            query=query,
            data=data,
            metadata={"retrieved_at": datetime.now(UTC).isoformat(), "pagination": pagination},
        )
