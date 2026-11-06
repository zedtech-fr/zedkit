# AGENTS.md — @zedtech/zedkit-storage

1. Server-only S3 helpers; peers `@aws-sdk/client-s3` and
   `@aws-sdk/s3-request-presigner` at the app root.
2. Explicit credentials only — never use the default credential provider chain.
3. TypeScript strict, ESM, vitest with mocked clients (no network).
4. Every export in CATALOG.md; `pnpm catalog:check` after changes.
5. Definition of done: `pnpm --filter @zedtech/zedkit-storage typecheck &&
   lint && build && test` green.
