import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

function functionSource(src, name) {
  const start = src.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const next = src.slice(start + 1).search(/\nfunction |\nexport function /);
  return next === -1 ? src.slice(start) : src.slice(start, start + 1 + next);
}

test("catalog desktop header is marketing chrome: search and GitHub, no version or theme", () => {
  const headers = read("ui/site-headers.tsx");
  assert.match(headers, /isCatalogPath/);
  assert.match(headers, /SiteFullSearchTrigger/);
  assert.doesNotMatch(headers, /KitVersionLabel/);
  assert.doesNotMatch(headers, /ThemeSwitch|SiteThemeSwitch|data-theme-toggle/);

  const catalog = functionSource(headers, "CatalogDesktopHeader");
  assert.match(catalog, /SiteFullSearchTrigger/);
  assert.match(catalog, /HomeGitHubLink/);
  assert.doesNotMatch(catalog, /HomeGetStartedAction/);
  assert.doesNotMatch(catalog, /KitVersionLabel/);
  assert.doesNotMatch(catalog, /ThemeSwitch/);
});

test("home desktop header still has Get started and no docs search", () => {
  const headers = read("ui/site-headers.tsx");
  const home = functionSource(headers, "HomeDesktopHeader");
  assert.match(home, /HomeGetStartedAction/);
  assert.match(home, /HomeGitHubLink/);
  assert.doesNotMatch(home, /SiteFullSearchTrigger/);
});

test("issues and other marketing routes keep the fumadocs Header", () => {
  const headers = read("ui/site-headers.tsx");
  const marketing = functionSource(headers, "MarketingSiteHeader");
  assert.match(marketing, /isHomePath/);
  assert.match(marketing, /isCatalogPath/);
  assert.match(marketing, /<Header className="max-md:hidden" \/>/);
});

test("docs desktop header is the marketing pattern: search and GitHub, no version, theme, or Get started", () => {
  const headers = read("ui/site-headers.tsx");
  assert.match(headers, /data-docs-header/);
  const docs = functionSource(headers, "DocsDesktopHeader");
  assert.match(docs, /SiteFullSearchTrigger/);
  assert.match(docs, /HomeGitHubLink/);
  assert.doesNotMatch(docs, /HomeGetStartedAction/);
  assert.doesNotMatch(docs, /KitVersionLabel/);
  assert.doesNotMatch(docs, /ThemeSwitch|SiteThemeSwitch|data-theme-toggle/);
  const compact = read("app/site-compact.css");
  assert.match(compact, /data-docs-header/);
});

test("catalog title size is a page token on the catalog shell", () => {
  const css = read("app/catalog-shell.css");
  assert.match(css, /--zk-catalog-title-size:\s*2\.5rem/);
  assert.match(css, /--zk-type-h1-size:\s*var\(--zk-catalog-title-size\)/);
  assert.doesNotMatch(css, /font-size:\s*40px/);
});
