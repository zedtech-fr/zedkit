import js from "@eslint/js";
import tseslint from "typescript-eslint";

import { uiPreset } from "./eslint/ui-preset.mjs";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Raw try/catch is banned everywhere: use tryCatch/tryCatchAsync from
      // @zedtech/zedkit-core so thrown values are normalized to Error with cause
      // preserved. Sole exception: the file that implements the wrappers.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TryStatement",
          message:
            "Raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core.",
        },
      ],
      // Deep relative imports are banned: use the package `#*` subpath
      // import (see "imports" in each package.json) instead of ../.. chains.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../..", "../../*", "../../../*"],
              message:
                "Deep relative imports are banned. Use the `#*` subpath import for this package.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/core/src/try-catch.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Root scripts, shareable presets, and the ui gallery tooling are
    // plain Node tooling: no DOM, Node globals available.
    files: [
      "scripts/**/*.mjs",
      "eslint/**/*.mjs",
      "packages/ui/preview/*.mjs",
      "packages/ui/playwright.config.ts",
    ],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly" },
    },
  },
  // UI preset last: for .tsx/.jsx its no-restricted-syntax (try/catch +
  // style-attribute bans) intentionally wins over the root block above.
  ...uiPreset,
  // Vendored third-party skills are verbatim upstream copies: never linted.
  // The ai kit ships them (and their helper scripts) as data, not as source.
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/kit/**",
      "**/node_modules/**",
      "**/coverage/**",
      ".agents/**",
      ".claude/**",
      ".cursor/**",
    ],
  },
);
