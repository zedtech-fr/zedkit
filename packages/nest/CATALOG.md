# Catalog — @zedtech/zedkit-nest

- Keywords: nestjs, nest, bootstrap, typescript, api, validation, logging, openapi, swagger, throttling, health-check, graceful-shutdown
- Audience: Teams starting a production NestJS API who want secure defaults, not a blank schematic.
- Purpose: Boot a production-ready NestJS app from one factory call: validation, logging, docs, throttling, errors and shutdown included.
- Attribution: Original work by the same author.


## Bootstrap a Nest app

- Import: `@zedtech/zedkit-nest` — `createNestApp`, `NestBootstrapOptions`, `ThrottleOptions`, `DocsOptions`, `LoggerOptions`, `ValidationOptions`, `REQUEST_ID_HEADER`, `RequestIdInterceptor`
- Wraps: `@nestjs/platform-fastify`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/throttler`, `nestjs-pino`, `class-validator`
- Status: beta
- Short name: Bootstrap
- Audience: Teams starting a production NestJS API with secure defaults.
- Purpose: Boot a hardened Nest app (validation, logging, docs, throttling, errors, shutdown) from one factory call.
- When to use: For every new Nest service that needs production defaults on day one.
- When not to use: For an existing app with its own bootstrap — adopt single pieces (logger, filter) instead.
- See also: `Ship request logs without leaking credentials`, `Return uniform error bodies`

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
const app = await createNestApp({ module: AppModule, envSchema: AppEnv });
await app.listen(3000);
```

## Ship request logs without leaking credentials

- Import: `@zedtech/zedkit-nest` — `LoggerOptions`
- Wraps: `nestjs-pino`
- Status: beta
- Short name: Safe logs
- Audience: API developers who log requests but must never leak auth headers or cookies.
- Purpose: Request logging with auth headers and cookies redacted by default.
- When to use: Whenever request logs leave the process (files, collectors, consoles).
- When not to use: For full-fidelity debug of auth flows — reproduce locally with redaction off instead.
- See also: `Bootstrap a Nest app`, `Redact secrets before logging`

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
const app = await createNestApp({
  module: AppModule,
  logger: { level: "info" }, // default: auth header + cookies redacted
});
```

## Return uniform error bodies

- Import: `@zedtech/zedkit-nest` — `AllExceptionsFilter`, `ErrorBody`
- Wraps: `(none)`
- Status: beta
- Short name: Error bodies
- Audience: API developers who want one error shape for every failure.
- Purpose: A global exception filter that returns the same error body for all failures.
- When to use: As the last-resort error mapper in front of API clients.
- When not to use: For domain validation errors with field detail — return those from the handler instead.
- See also: `Bootstrap a Nest app`

```ts
import { AllExceptionsFilter } from "@zedtech/zedkit-nest";
// wired globally by createNestApp; reuse standalone:
app.useGlobalFilters(new AllExceptionsFilter());
```
