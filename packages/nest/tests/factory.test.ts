import "reflect-metadata";
import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { FastifyReply } from "fastify";
import { describe, expect, it, onTestFinished } from "vitest";
import request from "supertest";
import { createHash } from "node:crypto";
import http from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AllExceptionsFilter, type ErrorBody } from "../src/index.js";
import { FixtureEnv } from "./fixtures/inventory.module.js";
import { boot } from "./helpers.js";

function saveEnv(name: string): void {
  const previous = process.env[name];
  onTestFinished(() => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  });
}

describe("createNestApp", () => {
  it("boots and serves the app module", async () => {
    const { url } = await boot();
    const created = await request(url)
      .post("/items")
      .send({ name: "widget", quantity: 3 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "widget", quantity: 3 });
    const listed = await request(url).get("/items");
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
  });

  it("validates DTOs and returns a structured 400", async () => {
    const { url } = await boot();
    const res = await request(url).post("/items").send({ name: "", extra: 1 });
    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("invalid_input");
    expect(typeof body.message).toBe("string");
    expect(typeof body.requestId).toBe("string");
  });

  it("passes unknown DTO fields through when validation is relaxed", async () => {
    const { url } = await boot({ validation: { whitelist: false, forbidNonWhitelisted: false } });
    const created = await request(url).post("/items").send({ name: "widget", quantity: 3, extra: 1 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "widget", quantity: 3 });
    // Relaxed shape, still validated: constraint violations keep failing.
    const bad = await request(url).post("/items").send({ name: "", quantity: 1 });
    expect(bad.status).toBe(400);
  });

  it("exposes the exact raw bytes alongside the parsed body", async () => {
    const { url } = await boot();
    // Odd spacing and key order: the hash must cover these exact bytes.
    const exact = '{  "b" : 2 ,"a":  [1, 2 ] }';
    const res = await request(url)
      .post("/echo-raw")
      .set("content-type", "application/json")
      // String, not Buffer: superagent JSON-serializes Buffer bodies.
      .send(exact);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sha256: createHash("sha256").update(exact, "utf8").digest("hex"),
      bytes: Buffer.byteLength(exact, "utf8"),
    });
  });

  it("maps unknown errors to a 500 that leaks nothing", async () => {
    const { url } = await boot();
    const res = await request(url).get("/items/boom");
    expect(res.status).toBe(500);
    const body = res.body as ErrorBody;
    expect(body).toEqual({
      code: "internal",
      message: "internal error",
      requestId: expect.any(String) as string,
    });
  });

  it("uses a custom global error filter when given", async () => {
    @Catch()
    class MarkerFilter implements ExceptionFilter {
      catch(_exception: unknown, host: ArgumentsHost): void {
        host.switchToHttp().getResponse<FastifyReply>().status(418).send({ custom: true });
      }
    }
    const { url } = await boot({ exceptionFilter: MarkerFilter });
    const res = await request(url).get("/items/boom");
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ custom: true });
  });

  it("maps unknown routes to a structured 404", async () => {
    const { url } = await boot();
    const res = await request(url).get("/no-such-route");
    expect(res.status).toBe(404);
    const body = res.body as ErrorBody;
    expect(body.code).toBe("not_found");
    expect(typeof body.requestId).toBe("string");
  });

  it("throttles globally when configured", async () => {
    const { url } = await boot({ throttle: { ttlMs: 60_000, limit: 2 } });
    expect((await request(url).get("/items")).status).toBe(200);
    expect((await request(url).get("/items")).status).toBe(200);
    const third = await request(url).get("/items");
    expect(third.status).toBe(429);
    expect((third.body as ErrorBody).code).toBe("rate_limited");
  });

  it("propagates the incoming request id and generates one when absent", async () => {
    const { url } = await boot();
    const withId = await request(url)
      .get("/no-such-route")
      .set("x-request-id", "req-123");
    expect((withId.body as ErrorBody).requestId).toBe("req-123");
    const withoutId = await request(url).get("/no-such-route");
    const generated = (withoutId.body as ErrorBody).requestId;
    expect(typeof generated).toBe("string");
    expect(generated.length).toBeGreaterThan(0);
  });

  it("echoes the request id on success, handler errors and unknown routes", async () => {
    const { url } = await boot();
    const created = await request(url)
      .post("/items")
      .set("x-request-id", "req-ok")
      .send({ name: "widget", quantity: 3 });
    expect(created.status).toBe(201);
    expect(created.headers["x-request-id"]).toBe("req-ok");
    // The interceptor sets the header before the handler runs.
    const boom = await request(url).get("/items/boom").set("x-request-id", "req-boom");
    expect(boom.status).toBe(500);
    expect(boom.headers["x-request-id"]).toBe("req-boom");
    // Unknown routes never reach the interceptor: the filter echoes.
    const missing = await request(url).get("/no-such-route").set("x-request-id", "req-404");
    expect(missing.status).toBe(404);
    expect(missing.headers["x-request-id"]).toBe("req-404");
  });

  it("serves generated OpenAPI for the app module", async () => {
    const { url } = await boot({
      docs: { title: "Fixture", version: "0.0.0" },
    });
    const res = await request(url).get("/docs-json");
    expect(res.status).toBe(200);
    const paths = (res.body as { paths: Record<string, unknown> }).paths;
    expect(Object.keys(paths)).toContain("/items");
    expect(JSON.stringify(res.body)).toContain("CreateItemDto");
  });

  it("validates env against the schema and fails fast with a readable error", async () => {
    saveEnv("FIXTURE_TOKEN");
    delete process.env.FIXTURE_TOKEN;
    await expect(boot({ envSchema: FixtureEnv })).rejects.toThrow(/FIXTURE_TOKEN/);
    process.env.FIXTURE_TOKEN = "secret";
    const { app } = await boot({ envSchema: FixtureEnv });
    const config = app.get(ConfigService);
    expect(config.get<string>("FIXTURE_TOKEN")).toBe("secret");
    expect(config.get<number>("FIXTURE_PORT")).toBe(3101);
  });

  it("loads env files from the configured paths", async () => {
    saveEnv("FIXTURE_TOKEN");
    delete process.env.FIXTURE_TOKEN;
    const dir = await mkdtemp(join(tmpdir(), "nest-env-"));
    onTestFinished(() => rm(dir, { recursive: true, force: true }));
    const envFile = join(dir, "custom.env");
    await writeFile(envFile, "FIXTURE_TOKEN=from-file\n", "utf8");
    const { app } = await boot({ envSchema: FixtureEnv, envFilePath: [envFile] });
    expect(app.get(ConfigService).get<string>("FIXTURE_TOKEN")).toBe("from-file");
  });

  it("rejects bodies beyond the configured limit without a 500", async () => {
    const { url } = await boot({ bodyLimit: 64 });
    const res = await request(url)
      .post("/echo-raw")
      .set("content-type", "application/json")
      .send(JSON.stringify({ data: "x".repeat(1024) }));
    expect(res.status).toBe(413);
    expect((res.body as ErrorBody).code).toBe("payload_too_large");
  });

  it("caps bodies at 1 MiB by default", async () => {
    const { url } = await boot();
    const res = await request(url)
      .post("/echo-raw")
      .set("content-type", "application/json")
      .send(JSON.stringify({ data: "x".repeat(2 * 1024 * 1024) }));
    expect(res.status).toBe(413);
    expect((res.body as ErrorBody).code).toBe("payload_too_large");
  });

  it("maps malformed JSON to a structured 400", async () => {
    const { url } = await boot();
    const res = await request(url)
      .post("/echo-raw")
      .set("content-type", "application/json")
      .send("{oops}");
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe("invalid_input");
  });

  it("uses the first id when the header repeats", async () => {
    const { url } = await boot();
    const raw = await new Promise<string>((resolve, reject) => {
      const req = http.request(
        `${url}/no-such-route`,
        { headers: { "x-request-id": ["first", "second"] } },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      req.end();
    });
    expect((JSON.parse(raw) as ErrorBody).requestId).toBe("first");
  });

  it("enables CORS only when asked", async () => {
    const plain = await boot();
    const denied = await request(plain.url)
      .get("/items")
      .set("Origin", "https://example.com");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    const open = await boot({ cors: true });
    const allowed = await request(open.url)
      .get("/items")
      .set("Origin", "https://example.com");
    expect(allowed.headers["access-control-allow-origin"]).toBe("*");
  });

  it("isolates throttle buckets per client behind a trusted proxy", async () => {
    const { url } = await boot({
      throttle: { ttlMs: 60_000, limit: 1 },
      trustProxy: true,
    });
    const first = await request(url).get("/items").set("X-Forwarded-For", "10.0.0.1");
    const second = await request(url).get("/items").set("X-Forwarded-For", "10.0.0.2");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const { url: plainUrl } = await boot({ throttle: { ttlMs: 60_000, limit: 1 } });
    expect(
      (await request(plainUrl).get("/items").set("X-Forwarded-For", "10.0.0.1")).status,
    ).toBe(200);
    expect(
      (await request(plainUrl).get("/items").set("X-Forwarded-For", "10.0.0.2")).status,
    ).toBe(429);
  });

  it("maps unsupported media types to 415", async () => {
    const { url } = await boot();
    const res = await request(url)
      .post("/echo-raw")
      .set("content-type", "text/csv")
      .send("a,b");
    expect(res.status).toBe(415);
    expect((res.body as ErrorBody).code).toBe("unsupported_media_type");
  });

  it("serves no docs in production unless asked", async () => {
    saveEnv("NODE_ENV");
    process.env.NODE_ENV = "production";
    const bare = await boot();
    expect((await request(bare.url).get("/docs-json")).status).toBe(404);
    const explicit = await boot({ docs: { title: "Prod", version: "1" } });
    expect((await request(explicit.url).get("/docs-json")).status).toBe(200);
  });

  it("tolerates slashes in the docs path", async () => {
    const { url } = await boot({ docs: { title: "T", version: "1", path: "docs/" } });
    expect((await request(url).get("/docs-json")).status).toBe(200);
  });

  it("delegates throttle counting to a custom storage", async () => {
    let calls = 0;
    const storage: ThrottlerStorage = {
      increment: () => {
        calls++;
        return Promise.resolve({
          totalHits: calls,
          timeToExpire: 60_000,
          isBlocked: false,
          timeToBlockExpire: 0,
        });
      },
    };
    const { url } = await boot({ throttle: { ttlMs: 60_000, limit: 100, storage } });
    expect((await request(url).get("/items")).status).toBe(200);
    expect((await request(url).get("/items")).status).toBe(200);
    expect(calls).toBe(2);
  });

  it("accepts a trust function for proxies", async () => {
    const { url } = await boot({
      throttle: { ttlMs: 60_000, limit: 1 },
      trustProxy: () => true,
    });
    const first = await request(url).get("/items").set("X-Forwarded-For", "10.0.0.1");
    const second = await request(url).get("/items").set("X-Forwarded-For", "10.0.0.2");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("restricts CORS origins when given an object", async () => {
    // Array form: a plain string origin is echoed unconditionally.
    const { url } = await boot({ cors: { origin: ["https://allowed.example"] } });
    const allowed = await request(url).get("/items").set("Origin", "https://allowed.example");
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://allowed.example");
    const denied = await request(url).get("/items").set("Origin", "https://evil.example");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("skips sending when the reply already went out", () => {
    const filter = new AllExceptionsFilter();
    const sent: unknown[] = [];
    const reply = {
      sent: true,
      status: () => ({ send: (body: unknown) => void sent.push(body) }),
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ id: "r", method: "GET", url: "/" }),
        getResponse: () => reply,
      }),
    };
    filter.catch(new Error("mid-stream"), host as never);
    expect(sent).toEqual([]);
  });

  it("omits raw bodies, docs, and throttling when disabled", async () => {
    const { url } = await boot({ rawBody: false, docs: false, throttle: false });
    const echo = await request(url)
      .post("/echo-raw")
      .set("content-type", "application/json")
      .send('{"a":1}');
    expect(echo.status).toBe(200);
    expect(echo.body).toEqual({
      sha256: createHash("sha256").update("", "utf8").digest("hex"),
      bytes: 0,
    });
    expect((await request(url).get("/docs-json")).status).toBe(404);
    // Disabled means no guard at all: a small burst stays 200.
    expect((await request(url).get("/items")).status).toBe(200);
    expect((await request(url).get("/items")).status).toBe(200);
  });
});
