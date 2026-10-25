import "reflect-metadata";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { createNestApp, type ErrorBody } from "../src/index.js";
import { TutorialEnv } from "../examples/safe-api/tutorial.env.js";
import { TutorialModule } from "../examples/safe-api/tutorial.module.js";

const apps: INestApplication[] = [];
afterEach(async () => {
  while (apps.length > 0) {
    const app = apps.pop();
    if (app) await app.close();
  }
});

async function listen(app: INestApplication): Promise<string> {
  apps.push(app);
  await app.listen(0, "127.0.0.1");
  return await app.getUrl();
}

describe("tutorial: Start a safe NestJS API", () => {
  it("creates items with prefixed ids and rejects malformed input", async () => {
    process.env.TUTORIAL_TOKEN = "tutorial-test-token";
    const app = await createNestApp({
      module: TutorialModule,
      envSchema: TutorialEnv,
      logger: { level: "silent" },
      throttle: { ttlMs: 60_000, limit: 30 },
    });
    const url = await listen(app);

    const bad = await request(url).post("/items").send({ name: "", quantity: -1 });
    expect(bad.status).toBe(400);
    const err = bad.body as ErrorBody;
    expect(err.code).toBe("invalid_input");
    expect(err.message).toBeTruthy();
    expect(err.requestId).toMatch(/^[a-z0-9-]+$/i);

    const ok = await request(url).post("/items").send({ name: "bolt", quantity: 4 });
    expect(ok.status).toBe(201);
    expect(ok.body.id).toMatch(/^item_[0-9A-HJKMNP-TV-Z]{26}$/);

    const listed = await request(url).get("/items");
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
  });
});
