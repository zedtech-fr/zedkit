import { defineConfig } from "@playwright/test";

/** Static export is served on :3100 by CI and local `serve apps/docs/out`. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    // The first-visit identity tour would change the page under every other
    // spec, so they start as a returning visitor. identity-tour.spec.ts opts out.
    storageState: {
      cookies: [],
      origins: [{ origin: "http://127.0.0.1:3100", localStorage: [{ name: "zk-identity-tour", value: "1" }] }],
    },
  },
});
