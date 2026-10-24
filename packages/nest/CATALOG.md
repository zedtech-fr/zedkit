# Catalog — @zedkit/nest

## Bootstrap a Nest app

- Import: `@zedkit/nest` — `createNestApp`, `NestBootstrapOptions`, `ThrottleOptions`, `DocsOptions`, `LoggerOptions`, `ValidationOptions`, `REQUEST_ID_HEADER`, `RequestIdInterceptor`
- Wraps: `@nestjs/platform-fastify`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/throttler`, `nestjs-pino`, `class-validator`
- Status: stable

```ts
import { createNestApp } from "@zedkit/nest";
const app = await createNestApp({ module: AppModule, envSchema: AppEnv });
await app.listen(3000);
```

## Ship request logs without leaking credentials

- Import: `@zedkit/nest` — `LoggerOptions`
- Wraps: `nestjs-pino`
- Status: stable

```ts
import { createNestApp } from "@zedkit/nest";
const app = await createNestApp({
  module: AppModule,
  logger: { level: "info" }, // default: auth header + cookies redacted
});
```

## Return uniform error bodies

- Import: `@zedkit/nest` — `AllExceptionsFilter`, `ErrorBody`
- Wraps: `(none)`
- Status: stable

```ts
import { AllExceptionsFilter } from "@zedkit/nest";
// wired globally by createNestApp; reuse standalone:
app.useGlobalFilters(new AllExceptionsFilter());
```
