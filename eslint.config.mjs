import js from "@eslint/js";
import tseslint from "typescript-eslint";

import { uiPreset } from "@zedtech/zedkit-quality";

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
    // Root config and tooling scripts are plain Node: no DOM, Node
    // globals available.
    files: [
      "eslint.config.mjs",
      "scripts/**/*.mjs",
      "apps/docs/scripts/*.mjs",
      "packages/ui/preview/*.mjs",
      "packages/ui/playwright.config.ts",
    ],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly" },
    },
  },
  // UI preset last: for .tsx/.jsx its no-restricted-syntax (try/catch +
  // style-attribute bans) intentionally wins over the root block above.
  // Dogfood: the repo consumes its own published preset (source-mapped
  // exports, so this resolves with zero build).
  ...uiPreset({
    entryPoint: new URL("./packages/ui/src/styles.css", import.meta.url).pathname,
  }),
  {
    // next/og ImageResponse requires inline styles; not user-facing UI.
    files: ["apps/docs/app/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TryStatement",
          message:
            "Raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core.",
        },
      ],
    },
  },
  // Vendored third-party skills are verbatim upstream copies: never linted.
  // The ai kit ships them (and their helper scripts) as data, not as source.
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/.source/**",
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
