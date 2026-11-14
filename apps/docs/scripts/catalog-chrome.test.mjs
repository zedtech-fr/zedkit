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
  const headers = read("components/site-chrome/site-headers.tsx");
  assert.match(headers, /SiteFullSearchTrigger/);
  assert.doesNotMatch(headers, /KitVersionLabel/);
  assert.doesNotMatch(headers, /ThemeSwitch|SiteThemeSwitch|data-theme-toggle/);

  const shared = functionSource(headers, "SearchGitHubDesktopHeader");
  assert.match(shared, /SiteSearchTrigger className="lg:hidden"/);
  assert.match(shared, /SiteFullSearchTrigger className="max-lg:hidden"/);
  assert.match(shared, /HomeGitHubLink/);
  assert.doesNotMatch(shared, /HomeGetStartedAction/);
  assert.doesNotMatch(shared, /KitVersionLabel/);
  assert.doesNotMatch(shared, /ThemeSwitch/);
  const catalog = functionSource(headers, "CatalogDesktopHeader");
  assert.match(catalog, /mark="catalog"/);
});

test("home desktop header still has Get started and no docs search", () => {
  const headers = read("components/site-chrome/site-headers.tsx");
  const home = functionSource(headers, "HomeDesktopHeader");
  assert.match(home, /HomeGetStartedAction/);
  assert.match(home, /HomeGitHubLink/);
  assert.doesNotMatch(home, /SiteFullSearchTrigger/);
});

test("issues and other marketing routes use the shared marketing desktop bar, not fumadocs Header", () => {
  const headers = read("components/site-chrome/site-headers.tsx");
  const marketing = functionSource(headers, "MarketingSiteHeader");
  assert.doesNotMatch(marketing, /isHomePath/);
  assert.doesNotMatch(marketing, /isCatalogPath/);
  assert.doesNotMatch(headers, /fumadocs-ui\/layouts\/home\/slots\/header/);
  assert.match(marketing, /CatalogDesktopHeader/);
  const nav = functionSource(headers, "MarketingDesktopNav");
  assert.match(nav, /\[--fd-layout-width:var\(--zk-header-max-width\)\] max-md:hidden/);
  assert.match(nav, /max-w-\(--fd-layout-width\)/);
  assert.match(nav, /px-page-gutter/);
  const compact = read("app/site-compact.css");
  assert.match(compact, /--zk-header-max-width:\s*1400px/);
  assert.match(compact, /#nd-nav \{[^}]*--fd-layout-width:\s*var\(--zk-header-max-width\)/);
});

test("home desktop header composition stays in site-headers; the persistent host mounts it", () => {
  const headers = read("components/site-chrome/site-headers.tsx");
  const homeHeader = functionSource(headers, "HomeMarketingHeader");
  assert.match(homeHeader, /MobileHeader/);
  assert.match(homeHeader, /HomeDesktopHeader/);
  assert.doesNotMatch(headers, /isHomePath/);
  const homeLayout = read("app/(home)/layout.tsx");
  assert.doesNotMatch(homeLayout, /header=\{HomeMarketingHeader\}/);
  const siteLayout = read("components/site-chrome/site-layout.tsx");
  assert.doesNotMatch(siteLayout, /header = MarketingSiteHeader/);
  assert.match(siteLayout, /enabled:\s*false/);
  const siteGroup = read("app/(site)/layout.tsx");
  assert.doesNotMatch(siteGroup, /header=\{/);
  const host = read("components/site-chrome/site-persistent-chrome.tsx");
  assert.match(host, /MarketingDesktopNav/);
});

test("docs desktop header is the marketing pattern: search and GitHub, no version, theme, or Get started", () => {
  const headers = read("components/site-chrome/site-headers.tsx");
  assert.match(headers, /data-docs-header/);
  const docs = functionSource(headers, "DocsDesktopHeader");
  assert.match(docs, /mark="docs"/);
  assert.doesNotMatch(docs, /HomeGetStartedAction/);
  assert.doesNotMatch(docs, /KitVersionLabel/);
  assert.doesNotMatch(docs, /ThemeSwitch|SiteThemeSwitch|data-theme-toggle/);
  const compact = read("app/site-compact.css");
  assert.match(compact, /data-docs-header/);
});

test("catalog title size is a page token on the catalog shell", () => {
  const css = read("app/(site)/catalog/_catalog/catalog-shell.css");
  assert.match(css, /--zk-catalog-title-size:\s*clamp\(2rem,\s*1\.7rem \+ 1\.2vw,\s*2\.5rem\)/);
  assert.match(css, /--zk-type-h1-size:\s*var\(--zk-catalog-title-size\)/);
  assert.doesNotMatch(css, /font-size:\s*40px/);
});

test("catalog shell CSS is imported by the catalog page, not the root layout", () => {
  const layout = read("app/layout.tsx");
  const page = read("app/(site)/catalog/page.tsx");
  assert.doesNotMatch(layout, /catalog-shell\.css/);
  assert.match(page, /import "\.\/_catalog\/catalog-shell\.css"/);
});
