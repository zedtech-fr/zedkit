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
      // Measured floor (workspace `pnpm test:coverage` after full build): ~98/97/98/90.
      // Raising any threshold above these fails CI; deliberate drop verified locally.
      thresholds: { lines: 97, statements: 96, functions: 97, branches: 90 },
    },
  },
});
