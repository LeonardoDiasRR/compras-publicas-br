# Contributing

## Adding a New Upstream Endpoint

Every new endpoint must follow this workflow. The upstream official specification is the source of truth; wrappers, scrapers, third-party clients, blogs, and existing MCP servers are not contracts.

1. **Discover the official specification.** Confirm the endpoint in the current official OpenAPI or API documentation for Compras.gov.br or PNCP. Verify the HTTP method, path, parameters, security requirements, response schema, and upstream base URL.
2. **Create an immutable snapshot.** Save the unmodified official specification under `specs/upstream/<provider>/<YYYY-MM-DD>.json`. Record or update the snapshot reference and OpenAPI version in `coverage/endpoints.yaml`.
3. **Classify the endpoint.** Add the endpoint to the catalog and classify it explicitly. Only a public, useful, operational `GET` belongs in the implemented coverage denominator. Record a documented exclusion reason for endpoints that are authenticated, non-GET, deprecated, unusable, or outside the project scope.
4. **Write the Portuguese name and description.** Give the endpoint a stable, clear Portuguese tool name and a Portuguese description based on the official semantics. Tool names must be unique, provider-prefixed, match `^(compras|pncp)_[a-z0-9_]+$`, and be no longer than 128 characters. Do not expose an opaque `operationId` as the user-facing name or invent behavior not present in the official contract.
5. **Implement the provider adapter.** Add or update the appropriate provider adapter so it uses the fixed upstream base URL, preserves the official path and parameter semantics, and adapts only provider-specific transport or pagination details.
6. **Implement the service path.** Route the operation through the shared consultation service for parameter validation, execution, provenance, and normalized responses. Do not duplicate HTTP policy or endpoint execution logic in the tool.
7. **Register the MCP tool.** Add the one-to-one read-only tool registration using the manifest entry, Portuguese name, Portuguese description, and validated parameters.
8. **Add the contract test.** Test the adapter, service, and tool contract with the upstream response shape and error behavior. Assert the method, fixed base URL, path, parameters, response envelope, and relevant provenance. Do not depend on live production for the normal test suite.
9. **Update the manifest.** Set the endpoint classification, implementation status, tool name, Portuguese description, parameters, response contract, and snapshot reference in `coverage/endpoints.yaml`. Keep the manifest and implementation one-to-one.
10. **Regenerate the documentation.** Regenerate the manifest-derived tool and coverage documents:
    ```bash
    uv run python -m src.features.catalogo.catalogo render-tools coverage/endpoints.yaml --output TOOLS.md
    uv run python -m src.features.catalogo.catalogo render-coverage coverage/endpoints.yaml --output ENDPOINT_COVERAGE.md
    ```
    Verify both generated documents:
    ```bash
    uv run python -m src.features.catalogo.catalogo --check-tools TOOLS.md coverage/endpoints.yaml
    uv run python -m src.features.catalogo.catalogo --check-coverage-doc ENDPOINT_COVERAGE.md coverage/endpoints.yaml
    ```
11. **Restore coverage to 100%.** Run the complete checks:
    ```bash
    uv run ruff check .
    uv run pyright
    uv run pytest -m 'not live' -q
    uv run python -m src.features.catalogo.catalogo --check coverage/endpoints.yaml
    rg -n '\.(post|put|patch|delete)\(' src/shared/http_readonly.py src/features/provedores
    uv build
    ```
    The read-only scan must produce no matches. A new public, useful `GET` must be implemented or explicitly classified with a documented exclusion. Do not consider the endpoint complete while the coverage gate reports anything below `100%`.

## Non-Negotiable Boundaries

- The MCP is strictly read-only. Never add or expose `POST`, `PUT`, `PATCH`, or `DELETE` operations.
- Never accept arbitrary URLs, hosts, or upstream base URLs from tool input. Provider origins are fixed in the provider adapters and enforced by the shared HTTP client.
- Never commit, embed, transmit, or log secrets, credentials, API keys, tokens, cookies, or other authentication material. Do not expose authenticated endpoints as public tools.
- Never bypass relative-path and traversal protections, or pass undocumented path or query parameters around catalog validation.
- Never mask upstream errors. Preserve the upstream status, error details, and provenance in the normalized error; do not replace failures with an empty result, a fabricated success, or a generic success message.
- Do not bypass the catalog, shared consultation service, provider adapter, or contract tests for a shortcut implementation.

## Completion Checklist

- [ ] Official specification located and verified.
- [ ] Unmodified dated snapshot stored and referenced.
- [ ] Endpoint classified with an explicit justification.
- [ ] Portuguese tool name and description added.
- [ ] Provider adapter and shared service path implemented.
- [ ] Read-only MCP tool registered.
- [ ] Contract tests cover success and upstream error behavior.
- [ ] `coverage/endpoints.yaml` updated.
- [ ] `TOOLS.md` and `ENDPOINT_COVERAGE.md` regenerated and verified.
- [ ] Full checks pass with coverage at `100%`.
