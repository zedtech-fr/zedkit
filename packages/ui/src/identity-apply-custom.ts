"use client";

import { applyIdentity, CUSTOM_IDENTITY_ID, IDENTITY_STORAGE_KEY } from "./identity.js";
import { applyCustomIdentitySheet, parseIdentityTokens, type IdentityTokens } from "./identity-tokens.js";

/** Applies compact tokens to the whole page (`:root`) and marks the identity Custom. */
function applyCustomIdentity(tokens: IdentityTokens, storageKey: string = IDENTITY_STORAGE_KEY): boolean {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return false;
  applyCustomIdentitySheet(parsed.data, storageKey);
  applyIdentity(CUSTOM_IDENTITY_ID, storageKey);
  return true;
}

export { applyCustomIdentity };
