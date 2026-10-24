# zedkit — Agent Instructions

Public TypeScript monorepo (pnpm workspaces): small generic packages. See
[README.md](README.md) for the package index.

## Non-negotiables

- **Public repo.** No secrets, customer data, internal URLs, or private
  names/endpoints/domain terms from other projects. Check every ported file
  for them before committing.
- **No raw try/catch.** Use `tryCatch`/`tryCatchAsync` from
  `@zedkit/core` (sole exception: core's own implementation). Enforced by
  the `no-restricted-syntax` ban in [eslint.config.mjs](eslint.config.mjs).
- **No deep relative imports.** Inside a package use its `#*` subpath
  import; `../../*` and deeper are banned by `no-restricted-imports`.
- **Thin wrappers over mature packages.** Before writing a util, check
  whether a mature npm package already does it and wrap it thinly instead.
- **No empty packages.** A package exists only when real code backs it now.
- **Never commit build artifacts.** Before every commit and PR: run
  `git status` and `git diff --stat`, never `git add -A` blindly, and
  confirm no binaries, caches, build output, or files over 200KB are
  staged. CI enforces this via `scripts/check-no-artifacts.sh`; if you
  extend `.gitignore`, extend the script to match.
- **Do not publish to npm.** Changesets are prepared and dry-run in CI
  only; publishing is a later decision by the owner.

## Layout

- `packages/*` — one publishable package per usage domain, each with its
  own README, AGENTS.md, tests, and exports map (ESM + types).
- `.agents/skills` — vendored agent skills (single source of truth;
  `.claude/skills` and `.cursor/skills` symlink to it).
- `docs/extraction-map.md` — which upstream file each module replaces.

## How to work

- Small PRs from fresh `main`, never stacked. One package per PR.
- Each package PR updates `docs/extraction-map.md` and the root README
  package table, and adds a Changeset file.
- Review with `code-review` + `ponytail-review` before merge; merge only
  on green CI.
- New modules ship with vitest unit tests; deterministic, no network.

## Commands

```sh
pnpm install                # install (CI uses --frozen-lockfile)
pnpm typecheck               # turbo: tsc --noEmit everywhere
pnpm lint                   # turbo: eslint everywhere
pnpm build                  # turbo: tsc build everywhere
pnpm test                   # turbo: vitest run everywhere
pnpm changeset:status       # versioning dry-run (no publish)
bash scripts/check-no-artifacts.sh
```
