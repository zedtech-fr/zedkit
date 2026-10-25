# zedkit

[![ci](https://github.com/zedtech-fr/zedkit/actions/workflows/ci.yml/badge.svg)](https://github.com/zedtech-fr/zedkit/actions/workflows/ci.yml)

Open-source building blocks for modern apps: small, dependency-light TypeScript
packages. MIT licensed; see [LICENSE](LICENSE).

## Packages

| Package | What | Status |
|---|---|---|
| [`@zedkit/core`](packages/core/README.md) | `Result`, `tryCatch`, prefixed IDs | stable |
| [`@zedkit/server`](packages/server/README.md) | rate limiting, redaction, backoff, webhook signatures, pg-error codes | stable |
| [`@zedkit/nest`](packages/nest/README.md) | NestJS bootstrap factory | stable |
| [`@zedkit/ai`](packages/ai/README.md) | agent-agnostic AI setup: `AGENTS.md`, skills, subagents, commands, installer, validator | stable |

A package exists only when real, used code backs it — no placeholders.
Each package README records its origin ("original work by the same
author") and what it deliberately leaves out.

## Looking for something?

"I want X, what do you have to do it?" — search the
[catalog index](docs/catalog/README.md) by need (machine-readable:
[docs/catalog/catalog.json](docs/catalog/catalog.json)). Golden rule
(advice): reach every third-party library through a thin wrapper that
re-exports it, instead of importing it directly all over the code — see
[docs/golden-rule.md](docs/golden-rule.md).

Consumer projects: paste this into your agent instructions (canonical text:
`.agents/skills/use-zedkit/SKILL.md` — keep in sync):

<!-- use-zedkit-snippet: must match .agents/skills/use-zedkit/SKILL.md core rule -->

```md
Before writing any helper, check zedkit first, then npm, and wrap what
you adopt: search the zedkit catalog by need and import from zedkit if it
exists; otherwise adopt a mature npm package behind a thin wrapper;
otherwise propose adding it to zedkit with its domain.
```

## 5-minute quickstart

Prerequisites: Node ≥ 22 and pnpm 9.

The packages are not on npm yet, so install them from packed tarballs.
Build and pack once from a checkout:

```sh
git clone https://github.com/zedtech-fr/zedkit && cd zedkit
pnpm install && pnpm build
for p in ai core; do (cd packages/$p && pnpm pack --pack-destination /tmp/zedkit-pack); done
```

Then in your own repo:

```sh
npm install --no-save /tmp/zedkit-pack/*.tgz
npx zedkit-ai init . --provider cursor   # cursor, claude, codex, muse, all
# then ask your agent: "run the setup-ai skill"
npx zedkit-ai validate                   # must print: ok
```

With pnpm instead of npm, pin the unpacked core tarball first (pnpm
resolves each tarball's dependencies independently, so the sibling
tarball is invisible to it — this goes away once the packages publish):

```sh
mkdir -p /tmp/zedkit-core && tar -xzf /tmp/zedkit-pack/zedkit-core-*.tgz -C /tmp/zedkit-core
# package.json: { "pnpm": { "overrides": { "@zedkit/core": "file:/tmp/zedkit-core/package" } } }
pnpm add /tmp/zedkit-pack/zedkit-ai-0.1.0.tgz
./node_modules/.bin/zedkit-ai init . --provider cursor
./node_modules/.bin/zedkit-ai validate   # must print: ok
```

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
  row in `packages/ai/kit/THIRD_PARTY_NOTICES.md`.
