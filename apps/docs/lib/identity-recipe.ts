import { tryCatch } from "@zedtech/zedkit-core";
import { parseIdentityTokens, withIdentityDarkPair, type IdentityTokens } from "@zedtech/zedkit-ui";

const KEPT_DARK_KEYS = [
  "background",
  "foreground",
  "primary",
  "primaryForeground",
  "accent",
  "border",
  "mutedForeground",
] as const;

/** Dark colors that differ from the pair generated from light: the ones an edit of light must not rewrite. */
export function inferKeptDark(tokens: IdentityTokens): string[] {
  const generated = withIdentityDarkPair(tokens).dark;
  return KEPT_DARK_KEYS.filter((key) => tokens.dark[key] !== generated[key]);
}

/** The editor's export: `IdentityTokens` as JSON. A recipe, not a complete look (see the export copy). */
export function serializeRecipe(tokens: IdentityTokens): string {
  return JSON.stringify(tokens, null, 2);
}

export type RecipeResult =
  | { ok: true; tokens: IdentityTokens; darkKept: string[] }
  | { ok: false; reason: "not-json" | { path: string; message: string } };

/**
 * Reads pasted recipe JSON back into tokens. Dark colors that differ from the
 * pair light would generate come back as kept, so a later light edit does not
 * rewrite them: loading what was exported changes nothing.
 */
export function parseRecipe(text: string): RecipeResult {
  const json = tryCatch(() => JSON.parse(text) as unknown);
  if (!json.ok) return { ok: false, reason: "not-json" };
  const parsed = parseIdentityTokens(json.value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, reason: { path: issue?.path.join(".") || "(root)", message: issue?.message ?? "invalid" } };
  }
  return { ok: true, tokens: parsed.data, darkKept: inferKeptDark(parsed.data) };
}
