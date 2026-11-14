import { tryCatch } from "@zedtech/zedkit-core";
import { parseIdentityTokens, type IdentityTokens } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { docsSiteDefaultTokens, docsSiteTokensEqual } from "./docs-site-default-tokens.ts";

/** Persists the docs site look (CSS sheet key plus JSON tokens beside it). */
const DOCS_SITE_IDENTITY_STORAGE_KEY = "zk-docs-site-identity";

const LEGACY_IDENTITY_KEYS = ["zk-identity", "zk-identity-custom", "zk-docs-site-identity-opt-in"] as const;

function docsSiteCustomStorageKey(): string {
  return `${DOCS_SITE_IDENTITY_STORAGE_KEY}-custom`;
}

function docsSiteTokensStorageKey(): string {
  return `${DOCS_SITE_IDENTITY_STORAGE_KEY}-tokens`;
}

function storage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  const found = tryCatch(() => window.localStorage);
  return found.ok ? found.value : undefined;
}

function readStored(key: string): string | null {
  const store = storage();
  if (!store) return null;
  const raw = tryCatch(() => store.getItem(key));
  if (!raw.ok || raw.value === null || raw.value === undefined || raw.value === "") return null;
  return raw.value;
}

function readDocsSiteIdentityId(): string | null {
  return readStored(DOCS_SITE_IDENTITY_STORAGE_KEY);
}

function readDocsSiteTokens(): IdentityTokens | null {
  const stored = readStored(docsSiteTokensStorageKey());
  if (!stored) return null;
  const json = tryCatch(() => JSON.parse(stored) as unknown);
  if (!json.ok) return null;
  const parsed = parseIdentityTokens(json.value);
  return parsed.success ? parsed.data : null;
}

function writeDocsSiteTokens(tokens: IdentityTokens): void {
  const parsed = parseIdentityTokens(tokens);
  if (!parsed.success) return;
  const store = storage();
  if (!store) return;
  tryCatch(() => store.setItem(docsSiteTokensStorageKey(), JSON.stringify(parsed.data)));
}

/** Drop keys that used to drive the whole site without the docs storage key. */
function purgeLegacyIdentityStorage(): void {
  const store = storage();
  if (!store) return;
  for (const key of LEGACY_IDENTITY_KEYS) {
    tryCatch(() => store.removeItem(key));
  }
}

function clearDocsSiteIdentity(): void {
  const store = storage();
  if (!store) return;
  for (const key of [DOCS_SITE_IDENTITY_STORAGE_KEY, docsSiteCustomStorageKey(), docsSiteTokensStorageKey()]) {
    tryCatch(() => store.removeItem(key));
  }
}

/** True when a stored look should show the custom-identity bar. */
function docsSiteLookDiffersFromDefaults(): boolean {
  const tokens = readDocsSiteTokens();
  if (tokens) return !docsSiteTokensEqual(tokens, docsSiteDefaultTokens());
  if (readStored(docsSiteCustomStorageKey())) return true;
  const id = readStored(DOCS_SITE_IDENTITY_STORAGE_KEY);
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
  readDocsSiteIdentityId,
  readDocsSiteTokens,
  writeDocsSiteTokens,
};
