# Catalog — @zedtech/zedkit-nest

- Keywords: nestjs, nest, bootstrap, typescript, api, validation, logging, openapi, swagger, throttling, health-check, graceful-shutdown
- Audience: Teams starting a production NestJS API who want secure defaults, not a blank schematic.
- Purpose: Boot a production-ready NestJS app from one factory call: validation, logging, docs, throttling, errors and shutdown included.
- Attribution: Original work by the same author.


## Bootstrap a Nest app

- Import: `@zedtech/zedkit-nest` — `createNestApp`, `NestBootstrapOptions`, `ThrottleOptions`, `DocsOptions`, `LoggerOptions`, `ValidationOptions`, `REQUEST_ID_HEADER`, `RequestIdInterceptor`
- Wraps: `@nestjs/platform-fastify`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/throttler`, `nestjs-pino`, `class-validator`
- Status: beta

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
const app = await createNestApp({ module: AppModule, envSchema: AppEnv });
await app.listen(3000);
```

## Ship request logs without leaking credentials

- Import: `@zedtech/zedkit-nest` — `LoggerOptions`
- Wraps: `nestjs-pino`
- Status: beta

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

```ts
import { AllExceptionsFilter } from "@zedtech/zedkit-nest";
// wired globally by createNestApp; reuse standalone:
app.useGlobalFilters(new AllExceptionsFilter());
```
