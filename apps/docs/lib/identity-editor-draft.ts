import { useLayoutEffect, useState } from "react";
import {
  applyCustomIdentity,
  keepIdentityDarkKeys,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityContrastWarning,
  type IdentityId,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { LIGHT_KEYS } from "@/lib/identity-editor-search";

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

function useDraftTokens(present: IdentityTokens, look: IdentityId) {
  const [tokens, setTokens] = useState(present);
  const [past, setPast] = useState<IdentityTokens[]>([]);
  const [appliedSite, setAppliedSite] = useState(false);
  // shortcut: undo does not restore which dark keys were kept; clear on look change.
  const [darkKept, setDarkKept] = useState<string[]>([]);

  function remember(next: IdentityTokens) {
    if (next === tokens) return;
    setPast((stack) => [...stack, tokens]);
    setTokens(next);
  }

  function undo() {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((stack) => stack.slice(0, -1));
    setTokens(prev);
  }

  function keepDark(key: string) {
    setDarkKept((keys) => (keys.includes(key) ? keys : [...keys, key]));
  }

  function clearDarkKept() {
    setDarkKept([]);
  }

  function patch(key: string, value: string, scheme: "light" | "dark") {
    if (scheme === "dark" && LIGHT_KEY_SET.has(key)) keepDark(key);
    remember(patchTokens(tokens, key, value, scheme, darkKept));
  }

  function fix(warning: IdentityContrastWarning) {
    const parsed = parseIdentityTokens({
      ...tokens,
      [warning.scheme]: { ...tokens[warning.scheme], [warning.token]: warning.suggestedForeground },
    });
    if (!parsed.success) return;
    if (warning.scheme === "dark") {
      keepDark(warning.token);
      remember(parsed.data);
      return;
    }
    remember(withKeptDark(parsed.data, tokens, darkKept));
  }

  function applySuggest(next: IdentityTokens, toSite: boolean) {
    remember(withKeptDark(next, tokens, darkKept));
    if (toSite) setAppliedSite(true);
  }

  useLayoutEffect(() => {
    if (!appliedSite) return;
    applyCustomIdentity(tokens, look);
  }, [appliedSite, look, tokens]);

  return {
    tokens,
    setTokens,
    past,
    appliedSite,
    remember,
    undo,
    applySite: () => setAppliedSite(true),
    clearDarkKept,
    patch,
    fix,
    applySuggest,
  };
}

export { useDraftTokens };
