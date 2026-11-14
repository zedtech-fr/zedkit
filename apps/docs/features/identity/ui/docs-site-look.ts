"use client";

import {
  applyCustomIdentity,
  applyIdentity,
  discardCustomIdentity,
  isNamedIdentityId,
  isPresetId,
  parseIdentityTokens,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { docsSiteDefaultTokens, docsSiteTokensEqual, docsSiteTokensFor } from "./docs-site-default-tokens.ts";
import { readNamedIdentities } from "./named-identities.ts";
import {
  clearDocsSiteIdentity,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  readDocsSiteTokens,
  writeDocsSiteTokens,
} from "./site-identity-storage.ts";

function readDockSiteTokens(identityId: string): IdentityTokens {
  const stored = readDocsSiteTokens();
  if (stored) return stored;
  if (isPresetId(identityId)) return docsSiteTokensFor(identityId);
  if (isNamedIdentityId(identityId)) {
    const saved = readNamedIdentities().find((item) => item.id === identityId);
    if (saved) return saved.tokens;
  }
  return docsSiteDefaultTokens();
}

function resetDocsSiteLook(): void {
  clearDocsSiteIdentity();
  discardCustomIdentity(DOCS_SITE_IDENTITY_STORAGE_KEY);
  applyIdentity(DEFAULT_IDENTITY, DOCS_SITE_IDENTITY_STORAGE_KEY);
}

/**
 * Applies a built-in look as the dock's starting point: like Reset, but lands
 * on the picked preset instead of the site default. Parked custom work is
 * cleared, same as Reset. Refuses anything but a preset id: clearing first
 * and then activating `custom` would strand the page without its sheet.
 */
function applyStartingIdentity(id: string): boolean {
  if (!isPresetId(id)) return false;
  if (id === DEFAULT_IDENTITY) {
    resetDocsSiteLook();
    return true;
  }
  clearDocsSiteIdentity();
  applyIdentity(id, DOCS_SITE_IDENTITY_STORAGE_KEY);
  return true;
}

function applyDocsSiteLook(tokens: IdentityTokens): boolean {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return false;
  if (docsSiteTokensEqual(parsed.data, docsSiteDefaultTokens())) {
    resetDocsSiteLook();
    return true;
  }
  writeDocsSiteTokens(parsed.data);
  return applyCustomIdentity(parsed.data, DOCS_SITE_IDENTITY_STORAGE_KEY);
}

export { applyDocsSiteLook, applyStartingIdentity, readDockSiteTokens, resetDocsSiteLook };
