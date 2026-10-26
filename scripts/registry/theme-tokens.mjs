import { readFileSync } from "node:fs";
import { join } from "node:path";

const STYLES_REL = "packages/ui/src/styles.css";

function varFromBlock(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`styles.css: missing --${name} in expected block`);
  return match[1].trim();
}

function blockBefore(css, opener, endMarker) {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`styles.css: missing ${opener}`);
  const brace = css.indexOf("{", start);
  const end = css.indexOf(endMarker, brace + 1);
  const close = css.lastIndexOf("}", end > 0 ? end : css.length);
  return css.slice(brace + 1, close);
}

function rootThemeBlock(css) {
  return blockBefore(css, ":root", "\n.dark");
}

function darkThemeBlock(css) {
  return blockBefore(css, ".dark", "\n@theme");
}

function themeInlineBlock(css) {
  return blockBefore(css, "@theme inline", "\n@layer");
}

function normalizeBoxShadow(value) {
  return value.replace(/\s+/g, " ").trim();
}

function expectedFocusRingCss(css) {
  const utility = blockBefore(css, "@utility focus-ring", "\n@utility focus-ring-control");
  const outlineMatch = utility.match(/outline:\s*([^;]+);/);
  const outline = outlineMatch ? outlineMatch[1].trim() : "none";
  const shadowMatch = utility.match(/box-shadow:\s*([\s\S]*?);/);
  if (!shadowMatch) throw new Error("styles.css: @utility focus-ring missing box-shadow");
  return {
    "@utility focus-ring": {
      "&:focus-visible": {
        outline,
        "box-shadow": normalizeBoxShadow(shadowMatch[1]),
      },
    },
  };
}

/** Expected registry `cssVars` / `css` slices derived from the UI theme file. */
export function expectedRegistryThemeFromStyles(cssText) {
  const root = rootThemeBlock(cssText);
  const dark = darkThemeBlock(cssText);
  const theme = themeInlineBlock(cssText);
  return {
    badge: {
      cssVars: {
        theme: {
          "ring-width": varFromBlock(root, "ring-width"),
          "ring-offset-width": varFromBlock(root, "ring-offset-width"),
          "spacing-badge-inline": varFromBlock(theme, "spacing-badge-inline"),
          "spacing-badge-block": varFromBlock(theme, "spacing-badge-block"),
        },
      },
      css: expectedFocusRingCss(cssText),
    },
    drawer: {
      cssVars: {
        light: { overlay: varFromBlock(root, "overlay") },
        dark: { overlay: varFromBlock(dark, "overlay") },
      },
    },
    "status-dot": {
      cssVars: {
        theme: {
          "spacing-status-dot": varFromBlock(theme, "spacing-status-dot"),
        },
      },
    },
    checkmark: {
      cssVars: {
        theme: {
          "spacing-checkmark": varFromBlock(theme, "spacing-checkmark"),
          "animate-check-draw": varFromBlock(theme, "animate-check-draw"),
        },
      },
    },
    "status-label": {
      cssVars: {
        theme: {
          "spacing-status-label-gap": varFromBlock(theme, "spacing-status-label-gap"),
          "spacing-status-label-box": varFromBlock(theme, "spacing-status-label-box"),
          "spacing-icon-sm": varFromBlock(theme, "spacing-icon-sm"),
        },
      },
    },
    "progress-bar": {
      cssVars: {
        theme: {
          "spacing-progress-bar-gap": varFromBlock(theme, "spacing-progress-bar-gap"),
          "spacing-progress-bar-height": varFromBlock(theme, "spacing-progress-bar-height"),
        },
      },
    },
  };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}}`;
  }
  return JSON.stringify(value);
}

/** @returns {string[]} */
export function checkRegistryThemeDrift(root) {
  const registryPath = join(root, "registry.json");
  const stylesPath = join(root, STYLES_REL);
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const cssText = readFileSync(stylesPath, "utf8");
  const expectedByBrick = expectedRegistryThemeFromStyles(cssText);
  const errors = [];

  for (const item of registry.items ?? []) {
    const expected = expectedByBrick[item.name];
    if (!expected) {
      if (item.cssVars || item.css) {
        errors.push(
          `${item.name}: registry theme tokens are not covered by theme-tokens.mjs (register expected cssVars/css).`,
        );
      }
      continue;
    }
    if (item.cssVars && stableJson(item.cssVars) !== stableJson(expected.cssVars)) {
      errors.push(
        `${item.name}: registry.json cssVars does not match ${STYLES_REL} (run expectedRegistryThemeFromStyles or update registry).`,
      );
    }
    if (item.css && stableJson(item.css) !== stableJson(expected.css)) {
      errors.push(`${item.name}: registry.json css does not match ${STYLES_REL} (@utility focus-ring).`);
    }
    if (expected.cssVars && !item.cssVars) {
      errors.push(`${item.name}: registry.json missing cssVars required by ${STYLES_REL}.`);
    }
    if (expected.css && !item.css) {
      errors.push(`${item.name}: registry.json missing css required by ${STYLES_REL}.`);
    }
  }

  return errors;
}
