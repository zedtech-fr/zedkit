export const SEO_DESCRIPTION_MAX = 160;

/**
 * Collapse whitespace and cap at 160 chars (SERP length). When the cap
 * would cut mid-sentence, keep the last complete sentence instead; only
 * fall back to a hard slice with an ellipsis when no sentence ends in
 * range. A sentence end must be followed by a capital (or the end), so
 * decimals (4.5:1), domains and "e.g." never cut early.
 */
export function truncateDescription(text: string, max: number = SEO_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  let cut = -1;
  for (const match of normalized.matchAll(/[.!?](?=\s|$)/g)) {
    const end = match.index + 1;
    if (end > max) break;
    const next = normalized.slice(end).trimStart().charAt(0);
    if (next === "" || next === next.toUpperCase()) cut = end;
  }
  if (cut > 0) return normalized.slice(0, cut);
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export type LocalizedField = string | Partial<Record<string, string>> | null | undefined;

/** Resolve a localized CMS value: exact locale, then fallbacks, then first. */
export function resolveLocalizedField(
  value: LocalizedField,
  locale: string,
  fallbackLocales: string[] = ["en"],
): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  for (const candidate of [locale, ...fallbackLocales]) {
    const hit = value[candidate];
    if (hit !== undefined && hit.trim().length > 0) return hit.trim();
  }
  for (const hit of Object.values(value)) {
    if (hit !== undefined && hit.trim().length > 0) return hit.trim();
  }
  return "";
}

export interface DescriptionSource {
  /** Explicit SEO description (wins when present). */
  custom?: string | null;
  /** Plain-text body to derive from (convert rich text to text first). */
  bodyText?: string | null;
  /** Localized title, last resort. */
  title?: LocalizedField;
}

/** Description fallback chain: custom → body text → title, truncated. */
export function resolveDescription(source: DescriptionSource, locale = "en"): string {
  const custom = (source.custom ?? "").trim();
  if (custom.length > 0) return truncateDescription(custom);
  const body = (source.bodyText ?? "").trim();
  if (body.length > 0) return truncateDescription(body);
  return truncateDescription(resolveLocalizedField(source.title, locale));
}
