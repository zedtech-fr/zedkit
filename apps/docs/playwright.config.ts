import { defineConfig } from "@playwright/test";

const ci = Boolean(process.env.CI);
const shardCurrent = Number(process.env.DOCS_E2E_SHARD ?? "");
const shardTotal = Number(process.env.DOCS_E2E_SHARD_TOTAL ?? "");

/** Static export is served on :3100 by CI and local `serve apps/docs/out`. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: ci ? 2 : 1,
  retries: ci ? 1 : 0,
  reporter: "list",
  // pnpm extra-args were not reaching Playwright (`--shard` ran all 308 tests
  // on every matrix job). Shard via env instead.
  ...(Number.isInteger(shardCurrent) && shardCurrent > 0 && Number.isInteger(shardTotal) && shardTotal > 0
    ? { shard: { current: shardCurrent, total: shardTotal } }
    : {}),
  use: {
    baseURL: process.env.DOCS_E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: ci ? "on-first-retry" : "off",
  },
});
