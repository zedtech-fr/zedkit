# AGENTS.md — @zedtech/zedkit-observability

1. Logger and Tracker ports plus React bindings. Zero runtime
   dependencies on the main entry; optional `./pino` and `./posthog`
   subpaths wrap peer deps at the composition root.
2. TypeScript strict, ESM, Node 22, pnpm. Peers and dev deps use
   `catalog:` pins.
3. No raw `try`/`catch`: use `tryCatch`/`tryCatchAsync` from
   `@zedtech/zedkit-core` if ever needed.
4. Explicit named exports per entry (`index`, `react`, `pino`,
   `posthog`) — each symbol appears in CATALOG.md.
5. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `any`
   without a one-line reason. No skipped tests.
6. Tests: vitest; jsdom for React hooks. Deterministic; no network.
7. Every new export needs a CATALOG.md entry; regenerate
   `catalog.json` (`pnpm catalog:build` from the root).
8. Definition of done: `pnpm --filter @zedtech/zedkit-observability typecheck && pnpm --filter @zedtech/zedkit-observability lint && pnpm --filter @zedtech/zedkit-observability build && pnpm --filter @zedtech/zedkit-observability test`
   green (each separately), `pnpm catalog:check` green.
