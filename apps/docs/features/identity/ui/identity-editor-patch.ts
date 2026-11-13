import {
  keepIdentityDarkKeys,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { isLightKey } from "./identity-editor-search.ts";

function withKeptDark(tokens: IdentityTokens, previous: IdentityTokens, keep: readonly string[]): IdentityTokens {
  return keepIdentityDarkKeys(withIdentityDarkPair(tokens, previous), previous, keep);
}

function acceptedIdentityTokens(next: IdentityTokens): IdentityTokens | undefined {
  const parsed = parseIdentityTokens(next);
  return parsed.success ? parsed.data : undefined;
}

function patchTokens(
  tokens: IdentityTokens,
  key: string,
  value: string,
  scheme: "light" | "dark",
  keep: readonly string[],
): IdentityTokens {
  const next = isLightKey(key)
    ? { ...tokens, [scheme]: { ...tokens[scheme], [key]: value } }
    : { ...tokens, [key]: value };
  const parsed = parseIdentityTokens(next);
  if (!parsed.success) return tokens;
  return scheme === "light" && isLightKey(key) ? withKeptDark(parsed.data, tokens, keep) : parsed.data;
}

export { acceptedIdentityTokens, patchTokens, withKeptDark };
