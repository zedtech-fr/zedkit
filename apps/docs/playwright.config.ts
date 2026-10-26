import { defineConfig } from "@playwright/test";

/** Static export is served on :3100 by CI and local `serve apps/docs/out`. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    // The home hero preview crossfades through every identity on each load.
    // Specs run with reduced motion so it stays off; home-use-cases.spec.ts opts out where it checks motion.
    reducedMotion: "reduce",
  },
});
