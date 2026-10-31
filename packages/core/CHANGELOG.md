# @zedtech/zedkit-core

## 0.2.2

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.2.1

### Patch Changes

- a810ef0: Docs: backend package table links to Quickstart paths C–E (#301).
- 867edd7: Docs: getting started Path C with tested core-add snippet (#301).
- 6cf1204: Docs: getting started Next steps tutorials match area table order (#301).

## 0.2.0

### Minor Changes

- f6df11a: Add error taxonomy (`DomainError`, `TransientError`, `PermanentError`, `classifyError`) and injectable `Clock` helpers.

### Patch Changes

- b4ceccb: README: npm-only install path with link to docs install-or-copy section.

## 0.1.3

### Patch Changes

- 4a1b579: docs: accurate npm descriptions — UI kit is not admin-only; core is not backend-only.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- 48b6f4a: Initial release: Result, tryCatch helpers, prefixed IDs.
