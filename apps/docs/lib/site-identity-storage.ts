import { tryCatch } from "@zedtech/zedkit-core";
import { parseIdentityTokens, type IdentityTokens } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "./default-identity.ts";
import { docsSiteDefaultTokens, docsSiteTokensEqual } from "./docs-site-default-tokens.ts";

/** Persists the docs site look (CSS sheet key plus JSON tokens beside it). */
const DOCS_SITE_IDENTITY_STORAGE_KEY = "zk-docs-site-identity";

const LEGACY_IDENTITY_KEYS = ["zk-identity", "zk-identity-custom"] as const;

function docsSiteCustomStorageKey(): string {
  return `${DOCS_SITE_IDENTITY_STORAGE_KEY}-custom`;
}

function docsSiteTokensStorageKey(): string {
  return `${DOCS_SITE_IDENTITY_STORAGE_KEY}-tokens`;
}

function readDocsSiteTokens(): IdentityTokens | null {
  if (typeof window === "undefined") return null;
  const raw = tryCatch(() => window.localStorage.getItem(docsSiteTokensStorageKey()));
  if (!raw.ok || raw.value === null || raw.value === undefined || raw.value === "") return null;
  const stored = raw.value;
  const json = tryCatch(() => JSON.parse(stored) as unknown);
  if (!json.ok) return null;
  const parsed = parseIdentityTokens(json.value);
  return parsed.success ? parsed.data : null;
}

function writeDocsSiteTokens(tokens: IdentityTokens): void {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return;
  window.localStorage.setItem(docsSiteTokensStorageKey(), JSON.stringify(parsed.data));
}

/** Drop keys that used to drive the whole site without the docs storage key. */
function purgeLegacyIdentityStorage(): void {
  for (const key of LEGACY_IDENTITY_KEYS) {
    window.localStorage.removeItem(key);
  }
}

function clearDocsSiteIdentity(): void {
  window.localStorage.removeItem(DOCS_SITE_IDENTITY_STORAGE_KEY);
  window.localStorage.removeItem(docsSiteCustomStorageKey());
  window.localStorage.removeItem(docsSiteTokensStorageKey());
}

/** True when a stored look should show the custom-identity bar. */
function docsSiteLookDiffersFromDefaults(): boolean {
  if (typeof window === "undefined") return false;
  const tokens = readDocsSiteTokens();
  if (tokens) return !docsSiteTokensEqual(tokens, docsSiteDefaultTokens());
  if (window.localStorage.getItem(docsSiteCustomStorageKey())) return true;
  const id = window.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY);
  return Boolean(id && id !== DEFAULT_IDENTITY);
}

export {
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  LEGACY_IDENTITY_KEYS,
  clearDocsSiteIdentity,
  docsSiteCustomStorageKey,
  docsSiteLookDiffersFromDefaults,
  docsSiteTokensStorageKey,
  purgeLegacyIdentityStorage,
  readDocsSiteTokens,
  writeDocsSiteTokens,
};
