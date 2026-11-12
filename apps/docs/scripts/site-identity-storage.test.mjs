import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { CUSTOM_IDENTITY_ID } from "@zedtech/zedkit-ui";

import { DEFAULT_IDENTITY } from "../lib/default-identity.ts";
import { docsSiteDefaultTokens } from "../lib/docs-site-default-tokens.ts";
import {
  applyDocsSiteLook,
  resetDocsSiteLook,
} from "../lib/docs-site-look.ts";
import {
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  docsSiteCustomStorageKey,
  docsSiteLookDiffersFromDefaults,
  docsSiteTokensStorageKey,
  readDocsSiteTokens,
  writeDocsSiteTokens,
  clearDocsSiteIdentity,
} from "../lib/site-identity-storage.ts";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  const storage = read("lib/site-identity-storage.ts");
  const layout = read("app/layout.tsx");
  assert.doesNotMatch(storage, /OPT_IN/);
  assert.doesNotMatch(storage, /opt-in/);
  assert.doesNotMatch(storage, /isDocsSiteIdentityOptIn/);
  assert.doesNotMatch(storage, /setDocsSiteIdentityOptIn/);
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
