import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC (not esbuild) transforms test files so decorator metadata is emitted
// exactly like `tsc` does for builds: Nest DI and the global ValidationPipe
// behave identically in tests and production. Without it, validation would
// be SILENTLY skipped in tests (no metatype -> no DTO checks). Decorator
// options are inferred from tsconfig.json by unplugin-swc.
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
