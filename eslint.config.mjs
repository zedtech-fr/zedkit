import { readdirSync } from "node:fs";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

import { defineLayers, uiPreset } from "@zedtech/zedkit-quality";

const docsFeatureNames = new Set(
  readdirSync(fileURLToPath(new URL("./apps/docs/features", import.meta.url)), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);

const docsAppGroup = [
  "@/app",
  "@/app/*",
  "@/app/**",
  "../app",
  "../app/*",
  "../app/**",
];
const docsFeatureGroup = [
  "@/features",
  "@/features/*",
  "@/features/**",
  "../features",
  "../features/*",
  "../features/**",
];
const docsUiGroup = ["@/ui", "@/ui/*", "@/ui/**", "../ui", "../ui/*", "../ui/**"];
const docsComponentsGroup = [
  "@/components",
  "@/components/*",
  "@/components/**",
  "../components",
  "../components/*",
  "../components/**",
];

const docsAppFeatureBan = {
  group: [...docsAppGroup, ...docsFeatureGroup],
  message:
    "One-way imports: composed UI and lib may not import app or features. Compose in the route and pass props.",
};

const docsFeatureAppBan = {
  group: docsAppGroup,
  message: "One-way imports: a feature may not import app. Compose in the route and pass props.",
};

// `#*` is a gitignore comment, so hash subpaths need `regex` (not `group`).
const docsHashImportBan = {
  regex: "^#",
  message: docsAppFeatureBan.message,
};
const docsFeatureHashImportBan = {
  regex: "^#",
  message: docsFeatureAppBan.message,
};

const docsLibUiBan = {
  group: [...docsComponentsGroup, ...docsUiGroup],
  message: "One-way imports: lib may not import composed UI.",
};

function docsFeatureFromPath(filename) {
  const match = posixPath(filename).match(/(?:^|\/)apps\/docs\/features\/([^/]+)\//);
  return match && docsFeatureNames.has(match[1]) ? match[1] : null;
}

function posixPath(file) {
  return file.split("\\").join("/");
}

function importedDocsFeature(filename, spec) {
  if (spec.startsWith("@/features/")) {
    const name = spec.slice("@/features/".length).split("/")[0];
    return docsFeatureNames.has(name) ? name : null;
  }
  if (spec.startsWith(".")) {
    const from = posixPath(filename);
    const resolved = posix.normalize(posix.join(from.slice(0, from.lastIndexOf("/")), spec));
    const match = resolved.match(/(?:^|\/)apps\/docs\/features\/([^/]+)\//);
    return match && docsFeatureNames.has(match[1]) ? match[1] : null;
  }
  return null;
}

const docsPlacementPlugin = {
  rules: {
    "no-cross-feature-import": {
      meta: {
        type: "problem",
        docs: { description: "A docs feature may not import another feature." },
        schema: [],
      },
      create(context) {
        const fromFeat = docsFeatureFromPath(context.filename);
        if (!fromFeat) return {};
        function check(sourceNode) {
          const spec = sourceNode.value;
          if (typeof spec !== "string") return;
          const toFeat = importedDocsFeature(context.filename, spec);
          if (toFeat && toFeat !== fromFeat) {
            context.report({
              node: sourceNode,
              message: `One-way: feature "${fromFeat}" may not import feature "${toFeat}". Compose in the route and pass props.`,
            });
          }
        }
        return {
          ImportDeclaration(node) {
            check(node.source);
          },
          ImportExpression(node) {
            if (node.source?.type === "Literal") check(node.source);
          },
          ExportNamedDeclaration(node) {
            if (node.source) check(node.source);
          },
          ExportAllDeclaration(node) {
            if (node.source) check(node.source);
          },
        };
      },
    },
  },
};

const deepRelativeImport = {
  group: ["../..", "../../*", "../../../*"],
  message: "Deep relative imports are banned. Use the `#*` subpath import for this package.",
};

// Files still over the uiPreset size budget. Drop a path when that file
// is under the cap. `max-lines` stays on for files that only miss the
// function cap, so they cannot grow past 300 unnoticed.
const sizeBudgetOverFile = [
  "apps/docs/components/identity-editor-toolbar.tsx",
  "apps/docs/components/project-tracker-demo-app.tsx",
  "packages/ui/preview/gallery.tsx",
];
const sizeBudgetOverFunction = [
  "apps/docs/components/admin-dashboard-demo-app.tsx",
  "apps/docs/components/component-page.tsx",
  "apps/docs/components/demos/drawer-demo.tsx",
  "apps/docs/components/demos/tabs-demo.tsx",
  "apps/docs/components/preview-viewport.tsx",
  "apps/docs/ui/catalog/catalog-view.tsx",
  "packages/ui/src/data-table/data-table.tsx",
  "packages/ui/src/identity/identity-picker.tsx",
  "packages/ui/src/overlays/route-modal.tsx",
];

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
            "try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core so thrown values become Error with cause.",
        },
      ],
      // Deep relative imports are banned: use the package `#*` subpath
      // import (see "imports" in each package.json) instead of ../.. chains.
      // packages/ui/src may use one extra parent (../..) after folder moves;
      // tests and other packages keep this ban.
      "no-restricted-imports": ["error", { patterns: [deepRelativeImport] }],
      "@typescript-eslint/no-explicit-any": "error",
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
      "apps/docs/next.config.mjs",
      "scripts/**/*.mjs",
      "apps/docs/scripts/*.mjs",
      "apps/docs/{app,features,components,lib}/**/*.test.mjs",
      "packages/ai/scripts/*.mjs",
      "packages/quality/src/bin/**/*.mjs",
      "packages/ui/preview/*.mjs",
      "packages/ui/playwright.config.ts",
      "deploy/**/*.mjs",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        AbortController: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  // UI preset last: for .tsx/.jsx its no-restricted-syntax (try/catch +
  // style-attribute + forwardRef bans) intentionally wins over the root block above.
  // Dogfood: the repo consumes its own published preset (source-mapped
  // exports, so this resolves with zero build).
  ...uiPreset({
    entryPoint: new URL("./packages/ui/src/styles.css", import.meta.url).pathname,
    scaleBaseline: new URL("./scripts/scale-class-baseline.json", import.meta.url).pathname,
    entryPoints: [
      {
        files: ["apps/docs/**/*.tsx", "apps/docs/**/*.jsx"],
        entryPoint: new URL("./apps/docs/app/globals.css", import.meta.url).pathname,
      },
    ],
  }),
  {
    files: sizeBudgetOverFile,
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
  {
    files: sizeBudgetOverFunction,
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    files: [
      "apps/docs/ui/home/home-hero-lead.tsx",
      "apps/docs/ui/catalog/catalog-view.tsx",
    ],
    rules: {
      "better-tailwindcss/no-unknown-classes": "off",
    },
  },
  ...defineLayers({
    preset: "feature-folders",
    kitPackage: "@zedtech/zedkit-ui",
    featureRoot: "apps/docs/features",
    extraPatterns: {
      kitScope: [deepRelativeImport, docsFeatureAppBan, docsFeatureHashImportBan],
      viewData: [deepRelativeImport, docsFeatureAppBan, docsFeatureHashImportBan],
      dataUi: [deepRelativeImport, docsFeatureAppBan, docsFeatureHashImportBan],
      model: [deepRelativeImport, docsFeatureAppBan, docsFeatureHashImportBan],
    },
  }),
  {
    // docs-placement: different rule id so this stacks with defineLayers.
    name: "docs/no-cross-feature-import",
    files: ["apps/docs/features/**/*.{ts,tsx,mjs,js,jsx}"],
    plugins: { "docs-placement": docsPlacementPlugin },
    rules: { "docs-placement/no-cross-feature-import": "error" },
  },
  {
    // defineLayers ignores compose files; they still must not import app.
    name: "docs/one-way-features-compose-no-app",
    files: [
      "apps/docs/features/*/index.ts",
      "apps/docs/features/*/index.tsx",
      "apps/docs/features/*/compose.ts",
      "apps/docs/features/*/compose.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [deepRelativeImport, docsFeatureAppBan, docsFeatureHashImportBan] },
      ],
    },
  },
  {
    name: "docs/one-way-composed-ui",
    files: [
      "apps/docs/components/**/*.{ts,tsx,mjs,js,jsx}",
      "apps/docs/lib/**/*.{ts,tsx,mjs,js,jsx}",
      "apps/docs/ui/**/*.{ts,tsx,mjs,js,jsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [deepRelativeImport, docsAppFeatureBan, docsHashImportBan] },
      ],
    },
  },
  {
    name: "docs/one-way-lib",
    files: ["apps/docs/lib/**/*.{ts,tsx,mjs,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [deepRelativeImport, docsAppFeatureBan, docsHashImportBan, docsLibUiBan] },
      ],
    },
  },
  {
    // L5: lift the reviews href to the home route, then drop this block.
    name: "docs/one-way-exception-l5-home-hero",
    files: ["apps/docs/ui/home/home-hero.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepRelativeImport,
            {
              group: docsAppGroup,
              message: docsAppFeatureBan.message,
            },
            docsHashImportBan,
          ],
        },
      ],
    },
  },
  {
    // L8: move component-page-toc next to the page, then drop this block.
    name: "docs/one-way-exception-l8-component-page-toc",
    files: ["apps/docs/lib/component-page-toc.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            deepRelativeImport,
            docsAppFeatureBan,
            docsHashImportBan,
            {
              group: docsUiGroup,
              message: docsLibUiBan.message,
            },
          ],
        },
      ],
    },
  },
  {
    // After uiPreset so other production checks stay. Tests keep the root ban.
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    ignores: ["packages/ui/src/**/*.{test,spec}.*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../..", "../../../*", "../../../../*"],
              message:
                "More than two parent segments are banned. Flatten the folder or use the `#*` subpath import.",
            },
          ],
        },
      ],
    },
  },
  {
    // next/og ImageResponse requires inline styles; not user-facing UI.
    files: ["apps/docs/app/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TryStatement",
          message:
            "try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core so thrown values become Error with cause.",
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
