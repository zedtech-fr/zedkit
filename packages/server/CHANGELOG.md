# @zedtech/zedkit-server

## 0.3.1

### Patch Changes

- 7065895: `verifyWebhookSignatureHeader` fails closed when the secret is empty.

## 0.3.0

### Minor Changes

- 281bd29: Add `pgErrorRetryable` for worker retry policy on common transient Postgres SQLSTATE codes.

### Patch Changes

- 2b1e019: `MemoryRateLimiter.allow` fails closed when the key is empty or whitespace-only.

## 0.2.1

### Patch Changes

- a5f9902: Docs: getting started backend scenario after paths C–E (#301).
- 0155efe: Docs: getting started Path D with tested server-add snippet (#301).
- fda0f62: Docs: getting started troubleshooting row for bad env on server/nest paths (#301).

## 0.2.0

### Minor Changes

- 926b60b: Add `loadEnv` for zod-validated boot-time environment parsing.

### Patch Changes

- b4ceccb: README: npm-only install path with link to docs install-or-copy section.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- 0f3d592: Initial release: in-process rate limiting, secret redaction.
- c301c5e: Add retry backoff and webhook signatures.
