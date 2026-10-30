"use client";

import { applyIdentity, CUSTOM_IDENTITY_ID, IDENTITY_CHANGE_EVENT, IDENTITY_STORAGE_KEY } from "./identity.js";
import { applyCustomIdentityCss } from "./identity-custom-sheet.js";
import { isNamedIdentityId } from "./identity-data.js";
import { isPresetId, parseIdentityTokens, tokensToCss, type IdentityTokens } from "./identity-tokens.js";

/** Applies compact tokens to the whole page. Pass a look id as the second arg to load that look's CSS. */
function applyCustomIdentity(tokens: IdentityTokens, storageKey: string = IDENTITY_STORAGE_KEY): boolean {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return false;
  // shortcut: second arg is a look id (preset or saved name) when it is not the storage key
  const look = isPresetId(storageKey) || isNamedIdentityId(storageKey) ? storageKey : undefined;
  const key = look ? IDENTITY_STORAGE_KEY : storageKey;
  const selector = look ? `:root[data-identity="${look}"]` : ":root";
  applyCustomIdentityCss(tokensToCss(parsed.data, selector), key);
  if (!look) {
    applyIdentity(CUSTOM_IDENTITY_ID, key);
    return true;
  }
  document.documentElement.setAttribute("data-identity", look);
  window.localStorage.setItem(key, look);
  window.dispatchEvent(new Event(IDENTITY_CHANGE_EVENT));
  return true;
}

export { applyCustomIdentity };
