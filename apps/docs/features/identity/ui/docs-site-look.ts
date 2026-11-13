"use client";

import {
  applyCustomIdentity,
  applyIdentity,
  discardCustomIdentity,
  identityPresets,
  isNamedIdentityId,
  isPresetId,
  parseIdentityTokens,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { readNamedIdentities } from "@/lib/named-identities";

import { docsSiteDefaultTokens, docsSiteTokensEqual } from "./docs-site-default-tokens.ts";
import {
  clearDocsSiteIdentity,
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  readDocsSiteTokens,
  writeDocsSiteTokens,
} from "./site-identity-storage.ts";

function readDockSiteTokens(identityId: string): IdentityTokens {
  const stored = readDocsSiteTokens();
  if (stored) return stored;
  if (isPresetId(identityId) && identityId !== DEFAULT_IDENTITY) return identityPresets[identityId];
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

export { applyDocsSiteLook, readDockSiteTokens, resetDocsSiteLook };
