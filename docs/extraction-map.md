# Extraction map

Which upstream file each zedkit module replaces, so consumers can switch to
the published packages later. Upstream keeps its own copies; nothing here
depends on zedkit until a package is published and adopted explicitly.

## Ported

| zedkit module | Replaces | Notes |
|---|---|---|
| `@zedkit/core` (see #4) | `zedbridge/packages/zedkit/src/result.ts`, `src/try-catch.ts` (themselves ported from the `zedos/packages/utils-js/try-catch` reference) | verbatim port, `@zedkit/core` import paths |
| `@zedkit/core` ids (see #4) | mechanism from `zedbridge/packages/contracts/src/ids.ts` | generalized: no domain prefixes; takes any caller-supplied prefix |
| `@zedkit/server` rate-limit (see #5) | `zedbridge/packages/zedkit/src/rate-limit.ts` | verbatim port |
| `@zedkit/server` redaction (see #5) | `redactValue` from `zedbridge/apps/api/src/lib/logger.ts` | verbatim except the private key-material pattern, which is dropped (value withheld) |

## Deliberately left out

| Upstream file | Reason |
|---|---|
| `zedbridge/packages/zedkit/src/token-secret.ts` | realtime token secret: derived with a project-specific HKDF info string |
| `zedbridge/packages/zedkit/src/endpoint-url.ts` | SSRF policy tied to the project's delivery rules and internal docs |
| `zedbridge/packages/contracts/src/naming.ts` | event-type naming rules: project domain terms |
| `zedbridge` prefixed-ID kinds (values withheld) | project domain terms; zedkit takes generic prefixes instead |
| private key pattern in `redactValue` (value withheld) | private key prefix; dropped from the port |
| `zedbridge/apps/api/src/lib/logger.ts` logger | hand-rolled logger; a thin wrapper over a mature package (e.g. pino) is preferred if ever needed |
| `zedbridge` test helpers (`apps/*/tests/helpers.ts`) | app-specific (DB, app config, wire protocol); nothing generic to extract |
| Nest / AI-stream / React / testing packages | no real generic code exists for these domains now; no placeholders |

## Licence notes

- zedkit is MIT ([LICENSE](../LICENSE)).
- The `result` / `try-catch` code originates from the same owner's
  `zedos/packages/utils-js/try-catch` reference (no separate licence file;
  same ownership) via the verbatim `zedbridge` port.
- Vendored agent skills and their licences are listed in
  `.agents/THIRD_PARTY_NOTICES.md` (landing with #3).
