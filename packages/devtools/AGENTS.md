# AGENTS.md — @zedtech/zedkit-devtools

1. Dev-only UI; peers `@zedtech/zedkit-ui` and `@zedtech/zedkit-flags` at the app root.
2. TypeScript strict, ESM; vitest + `node:test` on `devtoolsEnabled`.
3. Every export in CATALOG.md; `pnpm catalog:check` after changes.
4. Definition of done: `pnpm --filter @zedtech/zedkit-devtools typecheck &&
   lint && build && test` green.
