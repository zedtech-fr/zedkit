import { defineConfig } from "vitest/config";

// Workspace coverage: runs every package's vitest project in one pass
// (`pnpm test:coverage`). Per-package `pnpm test` is unchanged.
export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "**/*.test.*", "**/*.stories.*"],
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Baseline floor a little under the current numbers: catches a large
      // drop without failing on noise. Raise as coverage improves.
      thresholds: { lines: 90, statements: 89, functions: 86, branches: 82 },
    },
  },
});
