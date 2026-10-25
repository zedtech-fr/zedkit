import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Lets Testing Library auto-cleanup renders between tests.
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
