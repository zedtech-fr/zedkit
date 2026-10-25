// Shareable UI lint preset: enforces docs/frontend-charter.md by tools.
//
// What it enforces on every .tsx/.jsx file:
// - jsx-a11y recommended (labels, keyboard, focus, ARIA)
// - Tailwind class hygiene (order, no duplicates, no conflicts, no unknown)
// - Tokens only: no raw palette colors (bg-red-500), no arbitrary hex/rgb
//   colors, no raw px font sizes — use the semantic theme tokens
// - No `style` attributes; no raw try/catch (use a tryCatch wrapper)
//
// Consumer setup (project-owned copy, 2 steps):
// 1. Copy this file into your project.
// 2. Point `entryPoint` at your Tailwind CSS entry so the plugin knows
//    your theme tokens, and include the preset in your flat config:
//    `import { uiPreset } from "./eslint/ui-preset.mjs"` then
//    `export default [...uiPreset]`.
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose";
const COLOR_UTILS =
  "bg|text|border|ring|ring-offset|divide|from|via|to|decoration|outline|accent|caret|fill|stroke|shadow|placeholder";

export const uiPreset = [
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
        entryPoint: new URL("../packages/ui/src/styles.css", import.meta.url).pathname,
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
          message: "Raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedkit/core.",
        },
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: "Inline style attributes are banned. Use theme tokens (see docs/frontend-charter.md).",
        },
      ],
    },
  },
];
