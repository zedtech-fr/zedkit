# @zedkit/nest

Generic NestJS bootstrap factory. Original work by the same author.

`createNestApp({ module, envSchema, docs, ... })` wires only standard
pieces and returns the app ready to `listen()`:

- Fastify platform (`platform-fastify`) with exact raw bodies
  (`{ rawBody: true }`, proven by test) and a configurable body cap.
- Validated env (`@nestjs/config` + a class-validator schema per app;
  boot fails fast with one readable error).
- Request-id JSON logs (`nestjs-pino`): honors `x-request-id`,
  generates a UUID otherwise; one id across logs and error bodies.
- Strict global `ValidationPipe` (whitelist, forbid non-whitelisted,
  transform; implicit conversion off — see below).
- One global error shape: `{ code, message, requestId }` (+ status).
  4xx carries the safe message; 5xx never leaks internals.
- Optional global throttler (`@nestjs/throttler`, default 100/min;
  in-memory, single process — set `trustProxy` before running behind a
  proxy or every client shares one bucket).
- Generated OpenAPI (`@nestjs/swagger`), served as raw Fastify routes:
  public by design, guards do not apply. Shutdown hooks.

```ts
import "reflect-metadata";
import { createNestApp } from "@zedkit/nest";

const app = await createNestApp({
  module: AppModule,
  envSchema: AppEnv,
  docs: { title: "My API", version: "v1" },
});
await app.listen(3000);
```

Framework pieces are peer dependencies (one copy per app — required for
Nest DI). Install them alongside:

```sh
pnpm add @zedkit/nest @fastify/static @nestjs/common @nestjs/config \
  @nestjs/core @nestjs/platform-fastify @nestjs/swagger @nestjs/throttler \
  class-transformer class-validator fastify nestjs-pino pino pino-http \
  reflect-metadata
```

Rules (non-negotiable):

- Zero product names or logic.
- Numbers need explicit `@Type(() => Number)` (env ints, nested
  DTOs): implicit conversion relies on decorator metadata, which
  vitest can only emit via SWC — and the day one suite forgets SWC,
  implicit conversion silently diverges from `tsc`.
- Tests boot the factory with a product-free fixture domain and hit
  it over HTTP (supertest, ephemeral ports): validation, exact raw
  bytes, error shapes, throttling, request ids, docs, env failure.

Vitest transforms via SWC (`swc.vite()`, options inferred from
tsconfig): esbuild cannot emit decorator metadata, which would
silently disable the global `ValidationPipe` in tests. Never remove
it. Agent rules: [AGENTS.md](AGENTS.md)

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

Install: this package is framework integration (DI, decorators, peer
dependencies), not suitable for source-copying.

## Verify

```sh
pnpm --filter @zedkit/nest typecheck && pnpm --filter @zedkit/nest lint && pnpm --filter @zedkit/nest build && pnpm --filter @zedkit/nest test
```
