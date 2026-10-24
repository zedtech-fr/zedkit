# AGENTS.md — @zedkit/server

1. Server package: in-process rate limiting, secret redaction. Zero
   business logic, zero runtime dependencies.
2. TypeScript strict, ESM, Node 22, pnpm. Deps use `catalog:` only.
3. No raw `try`/`catch`: use `tryCatch`/`tryCatchAsync` from
   `@zedkit/core` (add a `workspace:*` dep if a module ever needs it).
4. Explicit named exports from `src/index.ts` (no `export *`, no default
   exports) — the catalog check verifies each one appears in CATALOG.md.
5. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `any`
   without a one-line reason. No skipped tests. Caps: <=60/function,
   complexity <=10.
6. Tests: vitest unit only, through the public interface. Deterministic;
   no network. Typecheck covers `src` and `tests`.
7. Every new export needs a CATALOG.md entry; regenerate `catalog.json`
   (`pnpm catalog:build` from the root).
8. Definition of done: `pnpm --filter @zedkit/server typecheck lint build test`
   green (each command separately), `pnpm catalog:check` green.
