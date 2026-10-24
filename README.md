# zedkit

Open-source building blocks for modern apps: small, dependency-light TypeScript
packages. MIT licensed; see [LICENSE](LICENSE).

## Packages

| Package | What | Status |
|---|---|---|
| `@zedkit/core` | `Result`, `tryCatch`, prefixed IDs | landing in #4 |
| `@zedkit/server` | rate limiting, secret redaction | landing in #5 |

A package exists only when real, used code backs it — no placeholders.
Each package README records its origin ("original work by the same
author") and what it deliberately leaves out.

## Tooling

- pnpm workspaces with a pinned `packageManager` and a shared `catalog`
- Turbo pipelines: `typecheck`, `lint`, `build`, `test`
- TypeScript strict, ESM + types, vitest, ESLint (raw `try`/`catch` is banned;
  use `tryCatch` from `@zedkit/core`)
- Changesets for versioning (dry-run only — publishing is a later decision)

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

## Public repo rules

- No secrets, no customer data, no internal URLs.
- No private names, endpoints, or domain terms from other projects.
- Third-party material (e.g. vendored skills) requires its licence file and a
  row in `.agents/THIRD_PARTY_NOTICES.md`.
