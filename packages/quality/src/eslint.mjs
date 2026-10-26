// Shareable UI lint preset: enforces docs/frontend-charter.md by tools.
//
// What it enforces on every .tsx/.jsx file:
// - jsx-a11y recommended (labels, keyboard, focus, ARIA)
// - Tailwind class hygiene (order, no duplicates, no conflicts, no unknown)
// - Tokens only: no raw palette colors (bg-red-500), no arbitrary hex/rgb
//   colors, no raw px font sizes — use the semantic theme tokens
// - No `style` attributes; no raw try/catch (use a tryCatch wrapper)
//
// Consumer setup (no copy: install the package, pass your Tailwind entry):
//   `import { uiPreset } from "@zedtech/zedkit-quality"` then
//   `export default [...uiPreset({ entryPoint: "./app/globals.css" })]`.
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose";
const COLOR_UTILS =
  "bg|text|border|ring|ring-offset|divide|from|via|to|decoration|outline|accent|caret|fill|stroke|shadow|placeholder";

/**
 * UI lint preset for .tsx/.jsx files.
 *
 * @param {{ entryPoint: string }} options - Path to the repo's Tailwind CSS
 * entry, so the plugin knows the theme tokens. Required, no default: the
 * per-repo CSS path is the one thing that varies.
 * @returns {import("eslint").Linter.Config[]} Flat config blocks.
 */
export function uiPreset({ entryPoint }) {
  if (typeof entryPoint !== "string" || entryPoint === "") {
    throw new Error("uiPreset: `entryPoint` is required (path to your Tailwind CSS entry).");
  }
  return [
    {
      name: "zedkit/ui-a11y",
      files: ["**/*.tsx", "**/*.jsx"],
      ...jsxA11y.flatConfigs.recommended,
    },
    {
      name: "zedkit/ui-tailwind",
      files: ["**/*.tsx", "**/*.jsx"],
      plugins: { "better-tailwindcss": betterTailwindcss },
      settings: {
        "better-tailwindcss": {
          entryPoint,
        },
      },
      rules: {
        "better-tailwindcss/enforce-consistent-class-order": "error",
        "better-tailwindcss/no-duplicate-classes": "error",
        "better-tailwindcss/no-conflicting-classes": "error",
        "better-tailwindcss/no-unknown-classes": "error",
        "better-tailwindcss/no-restricted-classes": [
          "error",
          {
            restrict: [
              {
                pattern: `(^|:)(${COLOR_UTILS})-(${PALETTE}|white|black)(-|/|$)`,
                message:
                  "Raw palette colors are banned. Use a semantic theme token (see docs/frontend-charter.md).",
              },
              {
                pattern: "\\[(#|rgb|hsl)",
                message:
                  "Arbitrary color values are banned. Use a semantic theme token (see docs/frontend-charter.md).",
              },
              {
                pattern: "text-\\[[^\\]]*px",
                message: "Raw px font sizes are banned. Use the type scale (see docs/frontend-charter.md).",
              },
            ],
          },
        ],
        // NOTE: flat-config rules replace (not merge) by key, so this block
        // restates the root TryStatement ban alongside the style-attribute
        // ban; without the restatement, .tsx files would lose the ban.
        "no-restricted-syntax": [
          "error",
          {
            selector: "TryStatement",
            message: "Raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core.",
          },
          {
            selector: 'JSXAttribute[name.name="style"]',
            message: "Inline style attributes are banned. Use theme tokens (see docs/frontend-charter.md).",
          },
        ],
      },
    },
  ];
}

// JS files the kit-scope block applies to (minus the view/data ignores).
const JS_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"];
const JS_BRACE = "{ts,tsx,mts,cts,js,jsx,mjs,cjs}";

// Flat-config `files` never matches a bare directory (`app/ui/**` matches
// nothing): dir-style entries become `dir/**/*.{exts}`. Entries that
// already name files (`**/*.tsx`, braces) pass through untouched. A leaf
// containing a dot counts as a file pattern, so a directory whose own
// name has a dot must use a trailing `/**` to be treated as a folder.
function asFiles(patterns) {
  return patterns.map((entry) => {
    const leaf = entry.slice(entry.lastIndexOf("/") + 1);
    if (entry.endsWith("}") || leaf.includes(".")) return entry;
    const stripped = entry.endsWith("/**") ? entry.slice(0, -3) : entry;
    const dir = stripped.endsWith("/") ? stripped.slice(0, -1) : stripped;
    return `${dir}/**/*.${JS_BRACE}`;
  });
}

/**
 * Route/view/data layer boundaries as `no-restricted-imports` blocks.
 * Dependencies run one way (routes -> views -> data):
 * - the UI kit is only imported from view files;
 * - views receive data as props and never import data clients or actions;
 * - data files import no UI (no React runtime, no UI kit).
 *
 * @param {{ kitPackage: string, viewDirs: string[], dataDirs: string[], actionPatterns: string[] }} options
 * - `kitPackage`: UI kit specifier (e.g. `@acme/ui`).
 * - `viewDirs`: view folders (e.g. `app/ui/**`) or file globs.
 * - `dataDirs`: data-access folders or file globs, same shapes.
 * - `actionPatterns`: import specifiers for data clients and server actions.
 * @returns {import("eslint").Linter.Config[]} Flat config blocks.
 */
export function defineLayers({ kitPackage, viewDirs, dataDirs, actionPatterns }) {
  const kitPatterns = [kitPackage, `${kitPackage}/*`];
  const views = asFiles(viewDirs);
  const data = asFiles(dataDirs);
  return [
    {
      name: "zedkit/layers-kit-scope",
      files: JS_FILES,
      ignores: [...views, ...data],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: kitPatterns,
                message: "UI kit imports are only allowed from view files. Move this import into a view.",
              },
            ],
          },
        ],
      },
    },
    {
      name: "zedkit/layers-view-data",
      files: views,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: [...actionPatterns],
                message: "Views receive data as props and never import data clients or server actions.",
              },
            ],
          },
        ],
      },
    },
    {
      name: "zedkit/layers-data-ui",
      files: data,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react", "react-dom", "react-dom/*", "react/jsx-runtime"],
                message: "Data code is UI-free: no React runtime imports.",
              },
              {
                group: kitPatterns,
                message: "Data code is UI-free: no UI kit imports.",
              },
            ],
          },
        ],
      },
    },
  ];
}
