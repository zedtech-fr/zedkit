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
  use `tryCatch` from `@zedtech/zedkit-core`.
- Public repo: no secrets, no customer data, no internal URLs, no
  private names or domain terms from other projects. Third-party
  material needs its licence file plus a row in the package's
  `THIRD_PARTY_NOTICES.md`.
- Adding a helper? Read [docs/contributing.md](docs/contributing.md)
  first: generic only, one domain, tests, catalog entry, thin wrappers.

## Versioning (0.x, published)

Breaking changes are allowed but never silent:

1. Ship them as a `minor` changeset with a one-line migration note
   (`OldThing -> NewThing`).
2. Never remove outright: first mark the export `deprecated` in its
   package catalog status (name the replacement).
3. Consumers pin `~0.x.y` and bump deliberately; the catalog `Status`
   field is the promise — `alpha`/`beta` may change freely, `stable`
   follows semver strictly.

Label such PRs `breaking`: CI fails the PR unless it carries a
minor-or-major changeset with a migration note
(`scripts/check-breaking-changeset.sh`).
