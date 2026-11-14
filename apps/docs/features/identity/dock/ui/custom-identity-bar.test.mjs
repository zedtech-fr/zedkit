import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { registerDocsAlias } from "#scripts/register-docs-alias.mjs";

registerDocsAlias(import.meta.url);

const { DOCS_SITE_IDENTITY_STORAGE_KEY, readDocsSiteIdentityId } = await import(
  "@/features/identity/ui/site-identity-storage"
);

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "custom-identity-bar.tsx"), "utf8");

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

test("readDocsSiteIdentityId round-trips the stored look id", () => {
  const localStorage = memoryStorage();
  const previous = globalThis.window;
  globalThis.window = { localStorage };
  assert.equal(readDocsSiteIdentityId(), null);
  localStorage.setItem(DOCS_SITE_IDENTITY_STORAGE_KEY, "tide");
  assert.equal(readDocsSiteIdentityId(), "tide");
  localStorage.setItem(DOCS_SITE_IDENTITY_STORAGE_KEY, "");
  assert.equal(readDocsSiteIdentityId(), null);
  if (previous === undefined) delete globalThis.window;
  else globalThis.window = previous;
});

test("custom bar badges a stored preset by name, otherwise the custom badge (#441)", () => {
  assert.match(src, /readDocsSiteIdentityId/);
  assert.match(src, /isPresetId/);
  assert.match(src, /presetActive/);
  assert.match(src, /\.badge/);
  assert.doesNotMatch(src, /"(mist|press|tide|volt|maison|glass)"/);
  assert.doesNotMatch(src, /\b(Mist|Press|Tide|Volt|Maison|Glass)\b/);
});
