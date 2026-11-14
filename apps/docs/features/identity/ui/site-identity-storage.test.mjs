import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { CUSTOM_IDENTITY_ID, identityPresets } from "@zedtech/zedkit-ui";

import { registerDocsAlias } from "#scripts/register-docs-alias.mjs";

registerDocsAlias(import.meta.url);

const { DEFAULT_IDENTITY } = await import("@/lib/default-identity");
const { LIBRARY_KEY } = await import("@/features/identity/ui/identity-library");
const { restoreNamedIdentity } = await import("./named-identities.ts");
const { docsSiteDefaultTokens, docsSiteTokensFor } = await import("./docs-site-default-tokens.ts");
const {
  applyDocsSiteLook,
  applyStartingIdentity,
  readDockSiteTokens,
  resetDocsSiteLook,
} = await import("./docs-site-look.ts");
const {
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  LEGACY_IDENTITY_KEYS,
  docsSiteCustomStorageKey,
  docsSiteLookDiffersFromDefaults,
  docsSiteTokensStorageKey,
  purgeLegacyIdentityStorage,
  readDocsSiteTokens,
  writeDocsSiteTokens,
  clearDocsSiteIdentity,
} = await import("./site-identity-storage.ts");

const app = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

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
    _store: store,
  };
}

function seedNamedLibrary(browser, tokens) {
  browser.localStorage.setItem(
    LIBRARY_KEY,
    JSON.stringify({
      version: 2,
      items: [
        {
          id: "n-coral",
          label: "Coral",
          tokens,
          createdAt: 1,
          updatedAt: 1,
          source: "editor",
        },
      ],
    }),
  );
}

function installBrowser() {
  const localStorage = memoryStorage();
  class HTMLStyleElement {}
  const html = {
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    getAttribute(name) {
      return this.attrs[name] ?? null;
    },
  };
  let sheet = null;
  const doc = {
    documentElement: html,
    head: {
      append(node) {
        sheet = node;
      },
    },
    createElement(tag) {
      if (tag !== "style") return {};
      const el = new HTMLStyleElement();
      el.textContent = "";
      el.attrs = {};
      el.setAttribute = function setAttribute(name, value) {
        this.attrs[name] = value;
      };
      el.getAttribute = function getAttribute(name) {
        return this.attrs[name] ?? null;
      };
      return el;
    },
    querySelector(sel) {
      if (String(sel).includes("identity-custom-sheet")) return sheet;
      return null;
    },
    get defaultView() {
      return { localStorage };
    },
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    HTMLStyleElement: globalThis.HTMLStyleElement,
  };
  globalThis.HTMLStyleElement = HTMLStyleElement;
  globalThis.window = {
    localStorage,
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = doc;
  return {
    localStorage,
    html,
    getSheet: () => sheet,
    restore() {
      if (previous.window === undefined) delete globalThis.window;
      else globalThis.window = previous.window;
      if (previous.document === undefined) delete globalThis.document;
      else globalThis.document = previous.document;
      if (previous.HTMLStyleElement === undefined) delete globalThis.HTMLStyleElement;
      else globalThis.HTMLStyleElement = previous.HTMLStyleElement;
    },
  };
}

test("JSON tokens round-trip and invalid JSON reads as missing", () => {
  const browser = installBrowser();
  const defaults = docsSiteDefaultTokens();
  writeDocsSiteTokens(defaults);
  assert.deepEqual(readDocsSiteTokens(), defaults);
  browser.localStorage.setItem(docsSiteTokensStorageKey(), "{not-json");
  assert.equal(readDocsSiteTokens(), null);
  browser.localStorage.setItem(docsSiteTokensStorageKey(), JSON.stringify({ radius: "nope" }));
  assert.equal(readDocsSiteTokens(), null);
  clearDocsSiteIdentity();
  assert.equal(browser.localStorage.getItem(docsSiteTokensStorageKey()), null);
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), null);
  assert.equal(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  browser.restore();
});

test("opt-in key and helpers are gone from storage and the root layout", () => {
  const storage = read("features/identity/ui/site-identity-storage.ts");
  const layout = read("app/layout.tsx");
  assert.doesNotMatch(storage, /OPT_IN/);
  assert.doesNotMatch(storage, /isDocsSiteIdentityOptIn/);
  assert.doesNotMatch(storage, /setDocsSiteIdentityOptIn/);
  assert.match(storage, /zk-docs-site-identity-opt-in/);
  assert.ok(LEGACY_IDENTITY_KEYS.includes("zk-docs-site-identity-opt-in"));
  assert.doesNotMatch(layout, /optInStorageKey/);
  assert.doesNotMatch(layout, /OPT_IN/);
});

test("the custom bar shows only when the stored look differs from defaults", () => {
  const browser = installBrowser();
  assert.equal(docsSiteLookDiffersFromDefaults(), false);

  writeDocsSiteTokens(docsSiteDefaultTokens());
  assert.equal(docsSiteLookDiffersFromDefaults(), false);

  writeDocsSiteTokens({ ...docsSiteDefaultTokens(), radius: "1rem" });
  assert.equal(docsSiteLookDiffersFromDefaults(), true);

  clearDocsSiteIdentity();
  browser.localStorage.setItem(docsSiteCustomStorageKey(), ":root { --radius: 1rem; }");
  assert.equal(docsSiteLookDiffersFromDefaults(), true);

  clearDocsSiteIdentity();
  browser.localStorage.setItem(DOCS_SITE_IDENTITY_STORAGE_KEY, "tide");
  assert.equal(docsSiteLookDiffersFromDefaults(), true);

  clearDocsSiteIdentity();
  browser.localStorage.setItem(DOCS_SITE_IDENTITY_STORAGE_KEY, DEFAULT_IDENTITY);
  assert.equal(docsSiteLookDiffersFromDefaults(), false);
  browser.restore();
});

test("equal tokens reset to named Glass with no custom CSS or JSON", () => {
  const browser = installBrowser();
  const custom = { ...docsSiteDefaultTokens(), radius: "1rem" };
  assert.equal(applyDocsSiteLook(custom), true);
  assert.equal(applyDocsSiteLook(docsSiteDefaultTokens()), true);
  assert.equal(browser.html.getAttribute("data-identity"), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(docsSiteTokensStorageKey()), null);
  assert.equal(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  browser.restore();
});

test("one differing field persists custom id, CSS, and JSON tokens", () => {
  const browser = installBrowser();
  const custom = { ...docsSiteDefaultTokens(), radius: "1rem" };
  assert.equal(applyDocsSiteLook(custom), true);
  assert.equal(browser.html.getAttribute("data-identity"), CUSTOM_IDENTITY_ID);
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), CUSTOM_IDENTITY_ID);
  assert.deepEqual(readDocsSiteTokens()?.radius, "1rem");
  const css = browser.localStorage.getItem(docsSiteCustomStorageKey());
  assert.equal(typeof css, "string");
  assert.match(css, /--radius:\s*1rem/);
  browser.restore();
});

test("Reset restores Glass and clears custom CSS and JSON", () => {
  const browser = installBrowser();
  applyDocsSiteLook({ ...docsSiteDefaultTokens(), radius: "1rem" });
  resetDocsSiteLook();
  assert.equal(browser.html.getAttribute("data-identity"), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(docsSiteTokensStorageKey()), null);
  assert.equal(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  browser.restore();
});

test("purgeLegacyIdentityStorage drops the retired opt-in key", () => {
  const browser = installBrowser();
  browser.localStorage.setItem("zk-docs-site-identity-opt-in", "1");
  purgeLegacyIdentityStorage();
  assert.equal(browser.localStorage.getItem("zk-docs-site-identity-opt-in"), null);
  browser.restore();
});

test("blocked storage does not throw from write, clear, differs, or restoreNamedIdentity", () => {
  const browser = installBrowser();
  const boom = () => {
    throw new Error("blocked");
  };
  browser.localStorage.getItem = boom;
  browser.localStorage.setItem = boom;
  browser.localStorage.removeItem = boom;
  assert.doesNotThrow(() => writeDocsSiteTokens({ ...docsSiteDefaultTokens(), radius: "1rem" }));
  assert.doesNotThrow(() => docsSiteLookDiffersFromDefaults());
  assert.doesNotThrow(() => clearDocsSiteIdentity());
  assert.doesNotThrow(() => purgeLegacyIdentityStorage());
  assert.doesNotThrow(() => restoreNamedIdentity(DOCS_SITE_IDENTITY_STORAGE_KEY));
  browser.restore();
});

test("readDockSiteTokens prefers stored JSON, then a preset, then named tokens, then docs defaults", () => {
  const browser = installBrowser();
  const defaults = docsSiteDefaultTokens();
  const stored = { ...defaults, radius: "1.25rem" };
  writeDocsSiteTokens(stored);
  assert.equal(readDockSiteTokens(DEFAULT_IDENTITY).radius, "1.25rem");

  clearDocsSiteIdentity();
  // #441: the shell pins radius for presets, so the reader returns the remapped value, not the raw preset.
  assert.equal(readDockSiteTokens("press").radius, "0.5rem");

  const named = { ...defaults, radius: "2rem" };
  seedNamedLibrary(browser, named);
  assert.equal(readDockSiteTokens("n-coral").radius, "2rem");

  assert.deepEqual(readDockSiteTokens(DEFAULT_IDENTITY), defaults);
  assert.deepEqual(readDockSiteTokens("n-missing"), defaults);
  browser.restore();
});

test("readDockSiteTokens returns shell-remapped tokens for a preset, not the raw kit preset (#441)", () => {
  const browser = installBrowser();
  const tide = readDockSiteTokens("tide");
  assert.equal(tide.radius, "0.5rem");
  assert.equal(tide.borderWidth, "1px");
  assert.equal(tide.spacing, identityPresets.tide.spacing);
  assert.equal(tide.light.background, "0 0% 100%");
  assert.equal(tide.light.foreground, "240 10% 3.9%");
  assert.equal(tide.light.mutedForeground, "240 5% 32%");
  assert.equal(tide.light.border, "240 5.9% 90%");
  assert.deepEqual(tide.dark, identityPresets.tide.dark);
  browser.restore();
});

test("docsSiteTokensFor falls back to the site default for an unknown id", () => {
  assert.deepEqual(docsSiteTokensFor("not-a-look"), docsSiteDefaultTokens());
});

test("applyStartingIdentity applies a preset and clears parked custom work (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyDocsSiteLook({ ...docsSiteDefaultTokens(), radius: "2rem" }), true);
  assert.equal(browser.html.getAttribute("data-identity"), "custom");
  assert.equal(applyStartingIdentity("tide"), true);
  assert.equal(browser.html.getAttribute("data-identity"), "tide");
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), "tide");
  assert.equal(browser.localStorage.getItem(docsSiteTokensStorageKey()), null);
  assert.equal(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  assert.equal(browser.getSheet().textContent, "");
  assert.equal(docsSiteLookDiffersFromDefaults(), true);
  browser.restore();
});

test("customize starts from the picked preset: the first patch writes preset-derived tokens (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyStartingIdentity("tide"), true);
  assert.equal(readDockSiteTokens("tide").radius, "0.5rem");
  assert.equal(applyDocsSiteLook({ ...readDockSiteTokens("tide"), radius: "2rem" }), true);
  assert.equal(readDocsSiteTokens("custom").radius, "2rem");
  assert.equal(readDocsSiteTokens("custom").spacing, identityPresets.tide.spacing);
  assert.equal(browser.html.getAttribute("data-identity"), "custom");
  browser.restore();
});

test("applyStartingIdentity with the default look resets to the site default (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyDocsSiteLook({ ...docsSiteDefaultTokens(), radius: "2rem" }), true);
  assert.equal(applyStartingIdentity(DEFAULT_IDENTITY), true);
  assert.equal(browser.html.getAttribute("data-identity"), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), DEFAULT_IDENTITY);
  assert.equal(browser.localStorage.getItem(docsSiteTokensStorageKey()), null);
  assert.equal(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  assert.equal(browser.getSheet().textContent, "");
  assert.equal(docsSiteLookDiffersFromDefaults(), false);
  assert.deepEqual(readDockSiteTokens(DEFAULT_IDENTITY), docsSiteDefaultTokens());
  browser.restore();
});

test("applyStartingIdentity twice is harmless (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyStartingIdentity("tide"), true);
  assert.equal(applyStartingIdentity("tide"), true);
  assert.equal(browser.html.getAttribute("data-identity"), "tide");
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), "tide");
  browser.restore();
});

test("applyStartingIdentity ignores an unknown id and leaves state untouched (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyDocsSiteLook({ ...docsSiteDefaultTokens(), radius: "2rem" }), true);
  assert.equal(applyStartingIdentity("not-a-look"), false);
  assert.equal(browser.html.getAttribute("data-identity"), "custom");
  assert.equal(readDocsSiteTokens("custom").radius, "2rem");
  browser.restore();
});

test("applyStartingIdentity refuses the custom id so a pick never strands the page without a sheet (#441)", () => {
  const browser = installBrowser();
  assert.equal(applyDocsSiteLook({ ...docsSiteDefaultTokens(), radius: "2rem" }), true);
  assert.equal(applyStartingIdentity("custom"), false);
  assert.equal(browser.html.getAttribute("data-identity"), "custom");
  assert.notEqual(browser.localStorage.getItem(docsSiteCustomStorageKey()), null);
  browser.restore();
});

test("restoreNamedIdentity applies a named look from the passed storage key only", () => {
  const browser = installBrowser();
  const named = { ...docsSiteDefaultTokens(), radius: "2rem" };
  seedNamedLibrary(browser, named);
  browser.localStorage.setItem(DOCS_SITE_IDENTITY_STORAGE_KEY, "n-coral");
  restoreNamedIdentity("zk-other-key");
  assert.equal(browser.html.getAttribute("data-identity"), null);
  restoreNamedIdentity(DOCS_SITE_IDENTITY_STORAGE_KEY);
  assert.equal(browser.html.getAttribute("data-identity"), "n-coral");
  assert.equal(browser.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY), "n-coral");
  browser.restore();
});
