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

## Plugin Installer Controls

The plugin installer accepts only a supported agent adapter and the `project` or
`user` scope. Project targets stay below the detected project root, and user
targets stay below the user home directory; arbitrary destination paths are not
accepted.

The installer rejects traversal segments and any resolved target outside the
selected scope. It merges only the `compras-publicas-br` entry, preserves other
configuration, and never overwrites an unrecognized entry or an unmanaged
skill. Configuration and skill changes are written atomically.

Generic `.agent` configuration entries carry the exact package and schema
metadata marker `managedBy: {package: mcp-compras-publicas-br, schemaVersion: 1}`.
Native adapters recognize ownership only through their documented exact native
entry shape and pinned command. They do not add or accept `managedBy` or any
other unknown field in non-generic formats. This includes Hermes Agent, whose
fixed compatibility target is `.hermes/config.json5`; its native entry must
match the documented JSON5 shape and the exact stable
`mcp-compras-publicas-br==<version>` pin. Managed skills must carry the
`managed-by: mcp-compras-publicas-br; format: 1` marker. Install, update, and
uninstall act on existing data only when the applicable marker or native
signature and the expected entry shape confirm ownership.

Configuration is treated as data. The installer never executes commands,
arguments, hooks, or other values read from an existing configuration; it emits
only the fixed `uvx` command for this package. The emitted command always pins
an exact stable package version as
`mcp-compras-publicas-br==<version>`.

Installer output and logs must not contain configuration contents, credentials,
tokens, or other secrets. Paths and warnings must be limited to the operational
information needed to report the result.

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

An HTTP MCP endpoint bound only to localhost is a local transport choice, not a
write path: it remains subject to the upstream `GET`-only boundary. It does not
need the public remote controls above unless it is exposed beyond the local
machine.

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
