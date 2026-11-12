import { identityPresets, parseIdentityTokens, type IdentityTokens } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "./default-identity.ts";

/** Light page fill from `html[data-docs-shell]:not(.dark)` in docs-shell-tokens.css. */
const DOCS_SITE_LIGHT_BACKGROUND = "0 0% 100%";
const DOCS_SITE_LIGHT_FOREGROUND = "240 10% 3.9%";
const DOCS_SITE_LIGHT_MUTED_FOREGROUND = "240 5% 32%";
/** Stock zinc hairline; chrome `--border` follows the light shell remap. */
const DOCS_SITE_LIGHT_BORDER = "240 5.9% 90%";
/** `:root[data-identity]` chrome pin. */
const DOCS_SITE_RADIUS = "0.5rem";
const DOCS_SITE_BORDER_WIDTH = "1px";
const DOCS_SITE_SHADOW_SM = "0 1px 2px hsl(var(--zk-shadow-color) / 0.06)";
const DOCS_SITE_SHADOW_MD = "0 2px 6px hsl(var(--zk-shadow-color) / 0.08)";
/** `:root[data-identity="glass"]` in site-compact.css. */
const DOCS_SITE_SPACING = "0.26rem";

/**
 * Kit Glass as the docs chrome wears it: shell remaps for the fields the
 * site actually pins, everything else the Glass preset.
 */
function docsSiteDefaultTokens(): IdentityTokens {
  const base = identityPresets[DEFAULT_IDENTITY];
  const parsed = parseIdentityTokens({
    ...base,
    spacing: DOCS_SITE_SPACING,
    borderWidth: DOCS_SITE_BORDER_WIDTH,
    radius: DOCS_SITE_RADIUS,
    shadowSm: DOCS_SITE_SHADOW_SM,
    shadowMd: DOCS_SITE_SHADOW_MD,
    light: {
      ...base.light,
      background: DOCS_SITE_LIGHT_BACKGROUND,
      foreground: DOCS_SITE_LIGHT_FOREGROUND,
      mutedForeground: DOCS_SITE_LIGHT_MUTED_FOREGROUND,
      border: DOCS_SITE_LIGHT_BORDER,
    },
  });
  return parsed.success ? parsed.data : base;
}

function docsSiteTokensEqual(a: IdentityTokens, b: IdentityTokens): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export { docsSiteDefaultTokens, docsSiteTokensEqual };
