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

type DraftSnap = { tokens: IdentityTokens; darkKept: string[] };

function nextDarkKept(keep: string[], key: string): string[] {
  return keep.includes(key) ? keep : [...keep, key];
}

function useDraftTokens(present: IdentityTokens, look: IdentityId) {
  const [tokens, setTokens] = useState(present);
  const [past, setPast] = useState<DraftSnap[]>([]);
  const [appliedSite, setAppliedSite] = useState(false);
  const [darkKept, setDarkKept] = useState<string[]>([]);

  function remember(next: IdentityTokens, nextKeep: readonly string[] = darkKept) {
    if (next === tokens) return;
    setPast((stack) => [...stack, { tokens, darkKept }]);
    setTokens(next);
    setDarkKept([...nextKeep]);
  }

  function undo() {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((stack) => stack.slice(0, -1));
    setTokens(prev.tokens);
    setDarkKept(prev.darkKept);
  }

  function patch(key: string, value: string, scheme: "light" | "dark") {
    const keep = scheme === "dark" && LIGHT_KEY_SET.has(key) ? nextDarkKept(darkKept, key) : darkKept;
    remember(patchTokens(tokens, key, value, scheme, keep), keep);
  }

  function fix(warning: IdentityContrastWarning) {
    const parsed = parseIdentityTokens({
      ...tokens,
      [warning.scheme]: { ...tokens[warning.scheme], [warning.token]: warning.suggestedForeground },
    });
    if (!parsed.success) return;
    if (warning.scheme === "dark") {
      remember(parsed.data, nextDarkKept(darkKept, warning.token));
      return;
    }
    remember(withKeptDark(parsed.data, tokens, darkKept));
  }

  function applySuggest(next: IdentityTokens, toSite: boolean) {
    remember(withKeptDark(next, tokens, darkKept));
    if (toSite) setAppliedSite(true);
  }

  function load(next: IdentityTokens, keep: readonly string[] = []) {
    setTokens(next);
    setDarkKept([...keep]);
    setPast([]);
  }

  useLayoutEffect(() => {
    if (!appliedSite) return;
    applyCustomIdentity(tokens, look);
  }, [appliedSite, look, tokens]);

  return {
    tokens,
    darkKept,
    past,
    appliedSite,
    remember,
    undo,
    applySite: () => setAppliedSite(true),
    load,
    patch,
    fix,
    applySuggest,
  };
}

export { useDraftTokens };
