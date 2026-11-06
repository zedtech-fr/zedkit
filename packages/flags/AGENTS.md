# AGENTS.md — @zedtech/zedkit-flags

1. Thin wrapper over OpenFeature server, web, and React SDKs (peers at the app root).
2. TypeScript strict, ESM, vitest with in-memory providers (no network).
3. Every export in CATALOG.md; `pnpm catalog:check` after changes.
4. Docs live preview: `Read flags in React` → `FlagsDemo` in `apps/docs`.
5. Definition of done: `pnpm --filter @zedtech/zedkit-flags typecheck &&
   lint && build && test` green.
