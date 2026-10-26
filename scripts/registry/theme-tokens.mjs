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
    alert: {
      cssVars: {
        theme: {
          "spacing-alert-inline": varFromBlock(theme, "spacing-alert-inline"),
          "spacing-alert-block": varFromBlock(theme, "spacing-alert-block"),
          "spacing-alert-icon-offset": varFromBlock(theme, "spacing-alert-icon-offset"),
          "spacing-alert-icon-nudge": varFromBlock(theme, "spacing-alert-icon-nudge"),
          "spacing-alert-content-indent": varFromBlock(theme, "spacing-alert-content-indent"),
        },
      },
    },
    typography: {
      cssVars: {
        theme: {
          "spacing-heading-scroll": varFromBlock(theme, "spacing-heading-scroll"),
        },
      },
    },
    "detail-panel": {
      cssVars: {
        theme: {
          "spacing-detail-panel-gap": varFromBlock(theme, "spacing-detail-panel-gap"),
          "spacing-detail-panel-inline": varFromBlock(theme, "spacing-detail-panel-inline"),
          "spacing-detail-panel-block": varFromBlock(theme, "spacing-detail-panel-block"),
        },
      },
    },
    card: {
      cssVars: {
        theme: {
          "spacing-card-stack": varFromBlock(theme, "spacing-card-stack"),
          "spacing-card-padding": varFromBlock(theme, "spacing-card-padding"),
        },
      },
    },
    "wizard-steps": {
      cssVars: {
        theme: {
          "spacing-icon-sm": varFromBlock(theme, "spacing-icon-sm"),
          "spacing-wizard-steps-gap": varFromBlock(theme, "spacing-wizard-steps-gap"),
          "spacing-wizard-steps-row-gap": varFromBlock(theme, "spacing-wizard-steps-row-gap"),
          "spacing-wizard-step-gap": varFromBlock(theme, "spacing-wizard-step-gap"),
          "spacing-wizard-step-badge": varFromBlock(theme, "spacing-wizard-step-badge"),
          "spacing-wizard-step-connector-gap": varFromBlock(theme, "spacing-wizard-step-connector-gap"),
          "spacing-wizard-step-connector-thickness": varFromBlock(theme, "spacing-wizard-step-connector-thickness"),
          "spacing-wizard-step-connector": varFromBlock(theme, "spacing-wizard-step-connector"),
        },
      },
    },
    "card-skeleton": {
      cssVars: {
        theme: {
          "spacing-card-padding": varFromBlock(theme, "spacing-card-padding"),
          "spacing-card-stack": varFromBlock(theme, "spacing-card-stack"),
          "spacing-card-section": varFromBlock(theme, "spacing-card-section"),
          "spacing-card-lines": varFromBlock(theme, "spacing-card-lines"),
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
