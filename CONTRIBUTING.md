# Contributing to zedkit

Setup: Node ≥ 22, pnpm 9, then `pnpm install`.

```sh
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

Rules:

- Small PRs from fresh `main`, one package per PR, never stacked.
- Each PR adds a Changeset file (`.changeset/<name>.md`); CI runs
  typecheck, lint, test, build, and the public-safety checks.
- Merge on green CI (squash). No force-push to `main`.
- TypeScript strict, ESM + types, vitest. Raw `try`/`catch` is banned —
  use `tryCatch` from `@zedkit/core`.
- Public repo: no secrets, no customer data, no internal URLs, no
  private names or domain terms from other projects. Third-party
  material needs its licence file plus a row in the package's
  `THIRD_PARTY_NOTICES.md`.
- Adding a helper? Read [docs/contributing.md](docs/contributing.md)
  first: generic only, one domain, tests, catalog entry, thin wrappers.
