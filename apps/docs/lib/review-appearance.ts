import { DEFAULT_IDENTITY } from "./default-identity.ts";

export type ReviewPreviewMode = "light" | "dark";
export type ReviewDensity = "default" | "compact";

/** Shipped kit presets only; named `n-*` looks stay on the token editor. */
export const REVIEW_IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

export type ReviewAppearance = {
  /** Shipped `identityPresets` key only (`DEFAULT_IDENTITY` must stay in `REVIEW_IDENTITIES`). */
  identity: (typeof REVIEW_IDENTITIES)[number];
  mode: ReviewPreviewMode;
  density: ReviewDensity;
};

/** Codec default when a share URL pins but a key is missing or unknown. Canonical share-URL spec with `serializeReviewAppearance`. */
export const DEFAULT_REVIEW_APPEARANCE: ReviewAppearance = {
  identity: DEFAULT_IDENTITY,
  mode: "light",
  density: "default",
};

const COMPACT_SPACING = 0.85;

export function isReviewIdentity(id: string): id is ReviewAppearance["identity"] {
  return (REVIEW_IDENTITIES as readonly string[]).includes(id);
}

export function parseReviewAppearance(search: string): ReviewAppearance {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawId = params.get("identity") ?? DEFAULT_IDENTITY;
  return {
    identity: isReviewIdentity(rawId) ? rawId : DEFAULT_IDENTITY,
    mode: params.get("preview") === "dark" || params.get("theme") === "dark" ? "dark" : "light",
    density: params.get("density") === "compact" ? "compact" : "default",
  };
}

/** True when the share URL pins this section; empty query inherits the site look. */
export function hasReviewAppearanceQuery(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.has("identity") || params.has("preview") || params.has("theme") || params.has("density");
}

/** Canonical share-URL writer: omit glass, light, and default density. The frame reads URLs; it does not write them. */
export function serializeReviewAppearance(appearance: ReviewAppearance): string {
  const params = new URLSearchParams();
  if (appearance.identity !== DEFAULT_IDENTITY) params.set("identity", appearance.identity);
  if (appearance.mode === "dark") params.set("preview", "dark");
  if (appearance.density === "compact") params.set("density", "compact");
  return params.toString();
}

/** Compact preview multiplies the identity `--spacing`; default leaves the token alone. */
export function compactPreviewSpacing(spacing: string): string {
  const match = /^(\d+(?:\.\d+)?)([a-z%]+)$/i.exec(spacing.trim());
  // Unparsed tokens keep the input (would pin full `--spacing`). Shipped presets are `Nrem`.
  if (!match) return spacing;
  return `${Number(match[1]) * COMPACT_SPACING}${match[2]}`;
}
