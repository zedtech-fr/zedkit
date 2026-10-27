import { defineConfig } from "@playwright/test";

const ci = Boolean(process.env.CI);

/** Static export is served on :3100 by CI and local `serve apps/docs/out`. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: ci ? 2 : 1,
  retries: ci ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: ci ? "on-first-retry" : "off",
  },
});
