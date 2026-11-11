import {
  keepIdentityDarkKeys,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { LIGHT_KEYS } from "./identity-editor-search.ts";

const LIGHT_KEY_SET = new Set<string>(LIGHT_KEYS);

function withKeptDark(tokens: IdentityTokens, previous: IdentityTokens, keep: readonly string[]): IdentityTokens {
  return keepIdentityDarkKeys(withIdentityDarkPair(tokens, previous), previous, keep);
}

function patchTokens(
  tokens: IdentityTokens,
  key: string,
  value: string,
  scheme: "light" | "dark",
  keep: readonly string[],
): IdentityTokens {
  const next = LIGHT_KEY_SET.has(key)
    ? { ...tokens, [scheme]: { ...tokens[scheme], [key]: value } }
    : { ...tokens, [key]: value };
  const parsed = parseIdentityTokens(next);
  if (!parsed.success) return tokens;
  return scheme === "light" && LIGHT_KEY_SET.has(key) ? withKeptDark(parsed.data, tokens, keep) : parsed.data;
}

export { patchTokens, withKeptDark };
