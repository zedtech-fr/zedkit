import { identityPresets, isPresetId, parseIdentityTokens, type IdentityTokens } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";

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
 * A kit preset as the docs chrome wears it: shell remaps for the fields the
 * site actually pins (`docs-shell-tokens.css`, `site-compact.css`), everything
 * else the preset. Unknown ids fall back to the site default look.
 */
function docsSiteTokensFor(id: string): IdentityTokens {
  const look = isPresetId(id) ? id : DEFAULT_IDENTITY;
  const base = identityPresets[look];
  const parsed = parseIdentityTokens({
    ...base,
    spacing: look === DEFAULT_IDENTITY ? DOCS_SITE_SPACING : base.spacing,
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

/** Kit Glass as the docs chrome wears it (see `docsSiteTokensFor`). */
function docsSiteDefaultTokens(): IdentityTokens {
  return docsSiteTokensFor(DEFAULT_IDENTITY);
}

function docsSiteTokensEqual(a: IdentityTokens, b: IdentityTokens): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export { docsSiteDefaultTokens, docsSiteTokensEqual, docsSiteTokensFor };
