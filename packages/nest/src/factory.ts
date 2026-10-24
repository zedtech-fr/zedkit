// Original work by the same author. Extraction adaptations vs the donor:
// - `envFilePath` option (default `[".env"]`) instead of a hardcoded
//   monorepo-relative lookup.
// - `trustProxy` passthrough so the documented proxy guidance works.
import "reflect-metadata";
import { Module, ValidationPipe, type Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_PIPE, NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { Logger as PinoLogger, LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import type { Http2ServerRequest } from "node:http2";
import type { IncomingMessage } from "node:http";
import { AllExceptionsFilter } from "./all-exceptions.filter.js";
import { validateEnv } from "./validate-env.js";

/** Incoming request-id header honored by the logger and error bodies. */
export const REQUEST_ID_HEADER = "x-request-id";

export interface ThrottleOptions {
  ttlMs: number;
  limit: number;
}

export interface DocsOptions {
  title: string;
  version: string;
  description?: string | undefined;
  /** Serve path for the UI and `<path>-json`. Defaults to `docs`. */
  path?: string | undefined;
}

export interface LoggerOptions {
  level?: string | undefined;
}

export interface NestBootstrapOptions {
  /** Root application module of the product app. */
  module: Type<object>;
  /**
   * class-validator decorated env schema. Validated at boot; boot fails
   * fast with a readable error when a declared variable is invalid.
   * Numbers need an explicit `@Type(() => Number)`: implicit conversion
   * relies on decorator metadata, which vitest/esbuild cannot emit.
   */
  envSchema?: Type<object> | undefined;
  /**
   * `.env` file lookup (ConfigModule passthrough). Defaults to `[".env"]`
   * (plus `process.env`, which always wins). Missing files are ignored.
   */
  envFilePath?: string[] | undefined;
  /**
   * Generated OpenAPI. Enabled by default: every app from this bootstrap
   * is API-first, so its contract is always browsable. Pass `false` for
   * apps without HTTP (workers).
   */
  docs?: DocsOptions | false | undefined;
  /**
   * Global IP-based coarse guard. Enabled by default at 100 req/min;
   * product apps add their own credential-scoped limits on top.
   */
  throttle?: ThrottleOptions | false | undefined;
  /** Populate `request.rawBody` with the exact bytes. Defaults to true. */
  rawBody?: boolean | undefined;
  /** Fastify body cap in bytes. Defaults to 1 MiB. */
  bodyLimit?: number | undefined;
  /**
   * Trust proxy headers (Fastify passthrough). Set this before running
   * behind a proxy or every client shares one throttle bucket.
   */
  trustProxy?: boolean | string | string[] | undefined;
  cors?: boolean | undefined;
  logger?: LoggerOptions | undefined;
}

const DEFAULT_THROTTLE: ThrottleOptions = { ttlMs: 60_000, limit: 100 };
const DEFAULT_BODY_LIMIT = 1024 * 1024;
const DEFAULT_DOCS: DocsOptions = {
  title: "API",
  version: "0.0.0",
  path: "docs",
};

function requestIdOf(req: IncomingMessage): string {
  const header = req.headers[REQUEST_ID_HEADER];
  if (typeof header === "string") {
    // Node joins repeated headers with ", "; the first value wins.
    const first = header.split(",")[0]?.trim();
    if (first) return first;
  }
  return randomUUID();
}

/**
 * Fastify assigns `request.id` (via its own `genReqId`) before pino-http
 * runs, so pino reuses it: logs, error bodies, and the wire id are one
 * value. Generating a second UUID here would split them apart.
 */
function pinoReqId(req: IncomingMessage): string {
  const existing = (req as { id?: unknown }).id;
  if (typeof existing === "string" && existing.length > 0) return existing;
  return requestIdOf(req);
}

/**
 * Generic Nest bootstrap shared by every app. Wires only standard pieces:
 * Fastify platform, validated env (`@nestjs/config`), request-id JSON logs
 * (`nestjs-pino`), strict global `ValidationPipe`, a global error-shape
 * filter, an optional global throttler, generated OpenAPI, and graceful
 * shutdown hooks. Returns the app ready to `listen()`; tests use it with
 * supertest without ever touching product code.
 */
export async function createNestApp(
  options: NestBootstrapOptions,
): Promise<NestFastifyApplication> {
  const throttle = options.throttle === undefined ? DEFAULT_THROTTLE : options.throttle;
  const schema = options.envSchema;

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        envFilePath: options.envFilePath ?? [".env"],
        ...(schema
          ? { validate: (config: Record<string, unknown>) => validateEnv(schema, config) }
          : {}),
      }),
      LoggerModule.forRoot({
        pinoHttp: {
          level: options.logger?.level ?? "info",
          genReqId: (req) => pinoReqId(req as IncomingMessage),
        },
      }),
      ...(throttle
        ? [ThrottlerModule.forRoot([{ ttl: throttle.ttlMs, limit: throttle.limit }])]
        : []),
      options.module,
    ],
    providers: [
      {
        provide: APP_PIPE,
        useValue: new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      },
      { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ...(throttle ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
    ],
  })
  class BootstrapRootModule {}

  const app = await NestFactory.create<NestFastifyApplication>(
    BootstrapRootModule,
    new FastifyAdapter({
      bodyLimit: options.bodyLimit ?? DEFAULT_BODY_LIMIT,
      genReqId: (req: IncomingMessage | Http2ServerRequest) =>
        requestIdOf(req as IncomingMessage),
      // exactOptionalPropertyTypes: only pass the key when set.
      ...(options.trustProxy === undefined ? {} : { trustProxy: options.trustProxy }),
    }),
    {
      rawBody: options.rawBody ?? true,
      bufferLogs: true,
      // Surface boot errors (e.g. invalid env) as rejections instead of
      // `process.abort()`: callers and tests can handle them, and an
      // unhandled rejection still crashes with the error printed.
      abortOnError: false,
    },
  );
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();
  if (options.cors) {
    app.enableCors();
  }
  const docs = options.docs === undefined ? DEFAULT_DOCS : options.docs;
  if (docs) {
    const builder = new DocumentBuilder()
      .setTitle(docs.title)
      .setVersion(docs.version);
    if (docs.description) {
      builder.setDescription(docs.description);
    }
    SwaggerModule.setup(
      docs.path ?? "docs",
      app,
      SwaggerModule.createDocument(app, builder.build()),
    );
  }
  return app;
}
