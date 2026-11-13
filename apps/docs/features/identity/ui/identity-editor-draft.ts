import { useLayoutEffect, useState } from "react";
import {
  applyIdentityTokenSheet,
  keepIdentityDarkKeys,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityContrastWarning,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { LIGHT_KEYS, isLightKey } from "@/lib/identity-editor-search";
import { acceptedIdentityTokens, patchTokens, withKeptDark } from "./identity-editor-patch.ts";

function withSuggestedDark(
  next: IdentityTokens,
  previous: IdentityTokens,
  userKeep: readonly string[],
): { tokens: IdentityTokens; keep: string[] } {
  const generated = withIdentityDarkPair(next, previous);
  const aiKeep = LIGHT_KEYS.filter((key) => next.dark[key] !== previous.dark[key]);
  const keep = [...userKeep];
  for (const key of aiKeep) {
    if (!keep.includes(key)) keep.push(key);
  }
  const merged = keepIdentityDarkKeys(keepIdentityDarkKeys(generated, next, aiKeep), previous, userKeep);
  return { tokens: merged, keep };
}

type DraftSnap = { tokens: IdentityTokens; darkKept: string[] };

function nextDarkKept(keep: string[], key: string): string[] {
  return keep.includes(key) ? keep : [...keep, key];
}

function useDraftTokens(present: IdentityTokens) {
  const [tokens, setTokens] = useState(present);
  const [past, setPast] = useState<DraftSnap[]>([]);
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
    const keep = scheme === "dark" && isLightKey(key) ? nextDarkKept(darkKept, key) : darkKept;
    remember(patchTokens(tokens, key, value, scheme, keep), keep);
  }

  function patchMany(entries: readonly (readonly [string, string])[]) {
    remember(entries.reduce((acc, [key, value]) => patchTokens(acc, key, value, "light", darkKept), tokens));
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

  function applySuggest(next: IdentityTokens) {
    const suggested = withSuggestedDark(next, tokens, darkKept);
    remember(suggested.tokens, suggested.keep);
  }

  function load(next: IdentityTokens, keep: readonly string[] = []) {
    const accepted = acceptedIdentityTokens(next);
    if (!accepted) return;
    setTokens(accepted);
    setDarkKept([...keep]);
    setPast([]);
  }

  return {
    tokens,
    darkKept,
    past,
    remember,
    undo,
    load,
    patch,
    patchMany,
    fix,
    applySuggest,
  };
}

function useIdentityTokenSheet(tokens: IdentityTokens, selector: string, enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const sheet = applyIdentityTokenSheet(tokens, selector);
    return () => {
      sheet.remove();
    };
  }, [enabled, selector, tokens]);
}

export { useDraftTokens, useIdentityTokenSheet };
