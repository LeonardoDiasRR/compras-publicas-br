# Architecture

MCP Compras Públicas Brasil is a read-only MCP server over the official
Compras.gov.br and PNCP public APIs. The request path is mandatory:

```text
MCP tool -> QueryService -> provider adapter -> ReadOnlyHttpClient -> official API
```

No MCP tool may call HTTP directly. The `QueryService` is the only service
boundary between tool handlers and providers, and providers are the only
boundary that selects an upstream API. This keeps parameter validation,
pagination, caching, error normalization, and provenance consistent for every
endpoint.

## Components

### MCP server

`src/features/mcp/servidor.py` builds the FastMCP server from
`coverage/endpoints.yaml`:

- Each implemented `PUBLIC_USEFUL` GET is registered as one atomic tool.
- Tool names and JSON input schemas come from the reviewed manifest and
  resolved OpenAPI parameters.
- Diagnostic tools use the service layer when they probe an upstream source.
- The server contains no arbitrary URL input and no write operation.

### QueryService

`src/features/consultas/servico.py` validates catalogued arguments, normalizes
identifiers such as CNPJ, renders only the catalogued path parameters, and
separates path values from query values. It selects `ComprasClient` or
`PncpClient`, invokes the shared HTTP client, normalizes the provider response,
and returns the MCP response envelope.

Pagination is opt-in through documented parameters. `auto_paginar` follows a
next-page or next-token signal supplied by the upstream response and stops at
`limite_resultados` and configured safety limits. The service rejects
undocumented arguments and unsupported required parameter locations.

### Provider adapters

`ComprasClient` and `PncpClient` provide the provider-specific facade used by
the service. They normalize provider pagination and item containers without
inventing totals or changing the raw response when `formato=original` is
requested.

Runtime origins are fixed in the adapters:

| Provider | Runtime API origin |
| --- | --- |
| Compras.gov.br | `https://dadosabertos.compras.gov.br` |
| PNCP | `https://pncp.gov.br/api/pncp` |

The PNCP OpenAPI discovery URL is intentionally different from its runtime API
origin. A base URL is never derived from an OpenAPI document or accepted from
an MCP caller.

### ReadOnlyHttpClient

`src/shared/http_readonly.py` is the single outbound HTTP boundary. It exposes
`get()` only and enforces:

- HTTPS and an allowlisted official hostname;
- relative paths only, with no scheme, host, query, fragment, traversal, or
  backslash escape in the path;
- streamed response reading with the configured document-size limit;
- no `POST`, `PUT`, `PATCH`, or `DELETE` surface.

The client retries timeouts, network failures, and transient upstream statuses
(`429`, `502`, `503`, `504`) with bounded exponential backoff and jitter. A
`404` is not retried.

## Contract Discovery And Coverage

The official OpenAPI documents are the source of endpoint inventory. Immutable
snapshots are versioned at:

```text
specs/upstream/compras/YYYY-MM-DD.json
specs/upstream/pncp/YYYY-MM-DD.json
```

The discovery URLs are:

```text
https://dadosabertos.compras.gov.br/v3/api-docs
https://pncp.gov.br/pncp-api/v3/api-docs
```

`coverage/endpoints.yaml` is the reviewed, versioned mapping from every
discovered GET operation to its implementation decision. It records the
snapshot and OpenAPI version, provider, method, path, security, parameters,
description, classification, implementation state, and stable Portuguese
tool name. Public useful operations must have `implemented: true` and a unique
tool name matching `^(compras|pncp)_[a-z0-9_]+$`. Authenticated or otherwise
excluded operations remain explicit and must include an exclusion reason.

The catalog command supports three distinct steps:

1. **Discover:** load a local snapshot or fetch the fixed official discovery
   URL, resolve local OpenAPI references, and normalize GET operations.
2. **Compare:** compare the discovered catalog with the reviewed manifest and
   report added, removed, and changed operations, including semantic changes
   such as security, required parameters, types, responses, and descriptions.
3. **Check:** reject missing or extra manifest entries, changed upstream
   contracts, unresolved security classification, incomplete public coverage,
   invalid tool names, and inconsistent authenticated exclusions.

The manifest is not generated at server startup. A change to an upstream
contract first requires discovery, review, explicit classification, stable
naming, and an updated manifest.

## CI Gates

Pull-request CI runs:

```text
uv run ruff check .
uv run pyright
uv run pytest -m "not live" -q
uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
uv build
```

It also scans the HTTP boundary and provider adapters for write-method calls.
The manifest check ensures that no public useful GET is left without a named
implementation mapping.

The scheduled `Upstream Drift` workflow fetches both fixed official OpenAPI
URLs and runs:

```text
uv run python -m src.features.catalogo.catalogo discover \
  --official --compare coverage/endpoints.yaml --fail-on-diff
```

Any contract drift is therefore visible as a CI failure instead of silently
changing the MCP surface. Live production probes are opt-in and are not part
of the default test gate.

## Atomic And Composite Tools

### Atomic tools

Atomic tools preserve the one-tool-to-one-catalogued-GET relationship. They
accept only the parameters documented for that operation and delegate directly
to `QueryService`. Atomic coverage is the compatibility and completeness
contract: every public useful GET must be represented independently, even when
there is also a more convenient composite tool.

### Composite tools

Composite tools are convenience views over multiple atomic operations. Current
examples include complete PNCP contracting, minutes, and contract views, plus
federated public purchasing search. They select only eligible manifest-backed
operations and call `QueryService.execute_many`; they do not perform HTTP
themselves, replace atomic tools, or reduce coverage requirements.

Composite results remain keyed by the underlying tool or operation identifier.
Federated search does not silently deduplicate records; when identifiers
overlap across sources it adds a possible-same-record marker and references so
the caller can decide how to reconcile them.

## Resources

Resources expose read-only catalog and capability metadata, not arbitrary
upstream data access:

| URI | Content |
| --- | --- |
| `mcp://coverage` | Overall and per-provider public coverage |
| `compras://coverage` | Compras.gov.br coverage |
| `compras://providers` | Providers, snapshots, and endpoint counts |
| `compras://endpoints` | Loaded endpoint manifest |
| `compras://domains` | Compras.gov.br catalogued domains |
| `pncp://domains` | PNCP catalogued domains |
| `pncp://api-version` | PNCP OpenAPI version and snapshot metadata |

Resource handlers read the loaded manifest and snapshot metadata. They do not
introduce another HTTP path around `QueryService`.

## Transports

The executable server supports:

- `stdio` for local MCP clients and the default invocation;
- `http` for a streamable HTTP deployment, with the configured port (default
  `8000`).

Transport changes the MCP connection mechanism only. It does not change the
tool registry, provider origins, read-only guarantees, or query flow.

## Caching

Caching is an in-memory bounded `TtlCache`, local to the server process. Public
responses are eligible when they are not bounded document/file content and do
not contain an incomplete `content_returned: false` result. Set
`CACHE_ENABLED=false` to bypass it.

The key is a SHA-256 digest of the provider, operation ID, rendered path, and
sorted query/options. This prevents equivalent requests from sharing entries
across providers or endpoint contracts. Default TTL categories are:

| Category | TTL |
| --- | ---: |
| Domains and historical data | 86400 seconds |
| Catalog data | 3600 seconds |
| Recent or uncategorized data | 300 seconds |

The cache has a maximum of 4096 entries and evicts an existing entry when it is
full. It is not a cross-process or durable cache.

## Errors And Safety Limits

Input and transport failures are kept distinct from valid empty results. The
HTTP boundary normalizes failures as `UpstreamError` kinds including
`NOT_FOUND`, `UPSTREAM_RATE_LIMIT`, `UPSTREAM_UNAVAILABLE`,
`UPSTREAM_BAD_REQUEST`, `UPSTREAM_SCHEMA_CHANGED`, `UPSTREAM_TIMEOUT`, and
`DOCUMENT_TOO_LARGE`.

JSON content is parsed only for JSON media types. Invalid JSON is reported as
an upstream schema change; non-JSON text and CSV are returned unchanged. A
document that exceeds `MAX_DOCUMENT_BYTES` is not read into the response. The
service returns a bounded marker with `download_available: true`,
`content_returned: false`, and `reason: file_size_limit`.

## Provenance

Every atomic query returns an `McpResponse` envelope:

```json
{
  "source": "pncp",
  "endpoint": "/v1/modalidades",
  "query": {},
  "data": [],
  "metadata": {
    "retrieved_at": "2026-09-05T00:00:00+00:00",
    "pagination": {}
  }
}
```

`source` identifies the provider, `endpoint` identifies the catalogued HTTP
path, `query` records the effective non-path query, and `retrieved_at` records
when the response was assembled. Pagination metadata contains only fields
observed or normalized from the upstream response. Composite tools preserve
these envelopes for each constituent operation.
