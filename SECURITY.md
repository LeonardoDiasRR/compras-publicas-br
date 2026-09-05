# Security Policy

This project provides a read-only MCP server for public Brazilian procurement
APIs. This document describes security guarantees in the code and controls
required when the server is deployed remotely.

## Read-Only Guarantee

- Upstream adapters can issue only `GET` requests. They do not expose
  `POST`, `PUT`, `PATCH`, or `DELETE` methods.
- The query service rejects catalog operations whose method is not `GET`.
- The CI pipeline scans the HTTP client and provider adapters for mutation
  methods.
- MCP tools query and return data; they do not create, update, or delete
  upstream records.

## Upstream Network Boundary

The upstream origin is fixed and must use HTTPS on the standard port. The
production allowlist is:

- `https://dadosabertos.compras.gov.br`
- `https://pncp.gov.br` (including the configured `/api/pncp` base path)

The HTTP client rejects credentials embedded in a base URL, unsupported ports,
query strings, and fragments. Tools cannot receive an arbitrary URL, so user
input cannot select a different upstream origin.

## Path and Traversal Protection

Only origin-relative paths are accepted. The client rejects:

- absolute URLs and protocol-relative URLs;
- schemes, hosts, query strings, or fragments in the path argument;
- backslashes;
- `..` path segments, including percent-encoded or repeatedly encoded forms.

Path parameters are validated against the endpoint catalog and URL-encoded
before they are rendered. Query parameters are likewise limited to parameters
declared by the catalog and validated against their declared schemas.

## Credentials and Secrets

The supported upstream APIs are public and the application does not require
upstream credentials. Do not commit, embed, or transmit API keys, passwords,
cookies, bearer tokens, private keys, or other secrets. Endpoints that require
authentication are not treated as public usable operations.

Environment and deployment secrets, if a future integration requires them,
must be supplied through the deployment secret manager and must never be
placed in source code, manifests, URLs, logs, or test fixtures.

## Remote MCP Controls

STDIO is the default transport for local use. A Streamable HTTP deployment is
not safe to expose publicly unless the deployment provides all of the
following:

- TLS, with certificate validation and HTTP redirected or disabled;
- authentication and authorization at the MCP server or its trusted edge;
- rate limiting for clients and upstream requests;
- request and response payload limits, including the configured 25 MB maximum
  document size;
- bounded concurrency per client and per upstream provider;
- a restrictive CORS policy containing only explicitly required origins,
  methods, and headers, or CORS disabled when it is not needed.

The checked-in Docker Compose configuration is a localhost-only development
convenience. Its HTTP port mapping is not a production security boundary; do
not expose it directly to a network or use it as a public deployment. Any
remote deployment must place the MCP server behind the controls above before
making the service reachable by untrusted clients.

These controls belong to the remote deployment boundary. The upstream APIs
being public does not make an unauthenticated remote MCP server safe.

## Sensitive Data and Logging

Application and deployment logs must be structured and limited to an
allowlisted set of operational metadata such as request identifier, provider,
tool, endpoint identifier, duration, status, retry count, and cache outcome.
Redaction or hashing must happen before values are serialized to logs, and
log retention and access must be limited to what operations require.

Never log full request or response bodies, authorization headers, cookies,
tokens, credentials, private keys, or unredacted user-supplied parameters.
Redact or hash identifiers when they could contain personal or otherwise
sensitive information. Upstream error bodies are untrusted response content
and must never be logged wholesale; log only a bounded, redacted summary or
safe metadata such as status and a body hash. Error messages and traces must
follow the same rule and must not preserve full upstream bodies.

## Reporting a Vulnerability

Report suspected vulnerabilities privately through the repository's GitHub
Security Advisory form:

https://github.com/LeonardoDiasRR/compras-publicas-br/security/advisories/new

If that form is unavailable, use the maintainer's private contact method listed
on the repository owner's GitHub profile:

https://github.com/LeonardoDiasRR

Do not open a public issue or disclose the vulnerability publicly before
maintainers have had a reasonable opportunity to investigate and coordinate a
fix.

Include the affected version or commit, a concise impact description, precise
reproduction steps, and any relevant logs or proof of concept after removing
secrets and personal data. Reports should not include real credentials or
production data.

Maintainers will acknowledge valid private reports, assess their impact, and
coordinate disclosure timing with the reporter when applicable.
