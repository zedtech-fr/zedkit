# AGENTS.md — @zedtech/zedkit-i18n

1. Small typed-message helpers and a React context factory. No ICU or
   routing — consumers pass full catalogs from the composition root.
2. TypeScript strict, ESM, Node 22, pnpm. `./react` peers `react`;
   the main entry has no React dependency.
3. Explicit named exports per entry (`index`, `react`); each symbol in
   CATALOG.md.
4. No raw `try`/`catch`. No skipped tests.
5. Definition of done: `pnpm --filter @zedtech/zedkit-i18n typecheck &&
   lint && build && test` green, `pnpm catalog:check` green.
