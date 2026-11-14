import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  SITE_COMPANY_URL,
  SITE_GITHUB_URL,
  SITE_NPM_ORG_URL,
  siteFooterLinkSpecs,
} from "../lib/site-links.mjs";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const { siteChromeCopy } = await import("../components/site-chrome/i18n/site-chrome-copy.ts");

const CONSUMERS = [
  "components/site-chrome/mobile-header.tsx",
  "components/site-chrome/site-headers.tsx",
  "components/site-chrome/header-actions.tsx",
  "components/site-chrome/site-footer.tsx",
  "lib/site-links.mjs",
  "components/site-chrome/skip-link.tsx",
  "components/site-chrome/site-brand.tsx",
  "components/site-chrome/off-path-link.tsx",
  "components/site-chrome/site-chrome-a11y.tsx",
  "components/site-chrome/docs-sidebar.tsx",
];

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

test("site chrome catalog keeps today's English wording", () => {
  assert.equal(siteChromeCopy.skipToContent, "Skip to content");
  assert.equal(siteChromeCopy.brand.name, "zedkit");
  assert.equal(siteChromeCopy.brand.homeAriaLabel, "zedkit home");
  assert.equal(siteChromeCopy.search.triggerAriaLabel, "Search documentation");
  assert.equal("theme" in siteChromeCopy, false);
  assert.equal("openNavigation" in siteChromeCopy.nav, false);
  assert.equal("openMenu" in siteChromeCopy.nav, false);
  assert.equal(siteChromeCopy.nav.menu, "Menu");
  assert.equal(siteChromeCopy.nav.siteNavigation, "Site navigation");
  assert.equal(siteChromeCopy.nav.docsPages, "Docs pages");
  assert.equal(siteChromeCopy.nav.docsNavigation, "Documentation");
  assert.equal("guides" in siteChromeCopy.nav, false);
  assert.equal(siteChromeCopy.nav.github, "GitHub");
  assert.equal(siteChromeCopy.nav.opensInNewTab, "opens in a new tab");
  assert.equal(siteChromeCopy.getStarted, "Try it yourself");
  assert.equal(siteChromeCopy.footer.credit, "by Zed Tech · MIT");
  assert.equal("maintainer" in siteChromeCopy.footer, false);
  assert.equal(siteChromeCopy.footer.links.docs, "Docs");
  assert.equal(siteChromeCopy.footer.links.catalog, "Catalog");
  assert.equal(siteChromeCopy.footer.links.github, "GitHub");
  assert.equal(siteChromeCopy.footer.links.npm, "npm");
  assert.equal(siteChromeCopy.footer.links.company, "zedtech.fr");
  assert.deepEqual(Object.keys(siteChromeCopy.footer.links), ["docs", "catalog", "github", "npm", "company"]);
  assert.equal(siteChromeCopy.version.latest, "Latest");
  assert.equal(siteChromeCopy.version.releasesAriaLabel("1.2.3"), "v1.2.3 (releases)");
  assert.equal(siteChromeCopy.version.shell("1.2.3"), "v1.2.3");
  assert.equal(siteChromeCopy.loading.page, "Loading page content");
  assert.equal(siteChromeCopy.loading.issues, "Loading issues");
  assert.equal(siteChromeCopy.loading.issue, "Loading issue");
});

test("footer link specs are the mockup short list from shared URL constants", () => {
  assert.equal(siteFooterLinkSpecs.length, 0);
  const specs = siteFooterLinkSpecs();
  assert.deepEqual(
    specs.map((item) => item.copyKey),
    Object.keys(siteChromeCopy.footer.links),
  );
  assert.deepEqual(
    specs.map((item) => item.href),
    ["/docs", "/catalog", SITE_GITHUB_URL, SITE_NPM_ORG_URL, SITE_COMPANY_URL],
  );
  assert.deepEqual(
    specs.map((item) => item.external),
    [false, false, true, true, true],
  );
  for (const item of specs) {
    assert.equal("label" in item, false);
    assert.equal(item.copyKey in siteChromeCopy.footer.links, true);
  }
  assert.equal(SITE_COMPANY_URL, "https://zedtech.fr");
  const links = read("lib/site-links.mjs");
  assert.doesNotMatch(links, /label:\s*"/);
  assert.doesNotMatch(links, /Documentation|npm organisation|MIT License|Source repository/);
});

test("listed chrome files read catalog keys instead of English literals", () => {
  const catalog = read("components/site-chrome/i18n/site-chrome-copy.ts");
  assert.match(catalog, /English copy for site chrome\. Keys only; no markup\./);
  assert.doesNotMatch(catalog, /<[a-zA-Z]/);

  const header = read("components/site-chrome/mobile-header.tsx");
  const siteHeaders = read("components/site-chrome/site-headers.tsx");
  const homeActions = read("components/site-chrome/header-actions.tsx");
  const footer = read("components/site-chrome/site-footer.tsx");
  const skip = read("components/site-chrome/skip-link.tsx");
  const brand = read("components/site-chrome/site-brand.tsx");

  assert.doesNotMatch(header, /siteChromeCopy\.nav\.openNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.siteNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.menu/);
  assert.doesNotMatch(header, /siteChromeCopy\.nav\.docsPages/);
  assert.match(header, /siteChromeCopy\.brand\.homeAriaLabel/);
  const docsSidebar = read("components/site-chrome/docs-sidebar.tsx");
  assert.match(docsSidebar, /siteChromeCopy\.nav\.docsPages/);
  assert.match(docsSidebar, /siteChromeCopy\.nav\.docsNavigation/);
  assert.doesNotMatch(docsSidebar, /"Docs pages"|"Documentation"/);
  const searchTrigger = read("components/site-chrome/site-chrome.tsx");
  const iconStart = searchTrigger.indexOf("export function SiteSearchTrigger");
  const fullStart = searchTrigger.indexOf("export function SiteFullSearchTrigger");
  const icon = searchTrigger.slice(iconStart, fullStart);
  const full = searchTrigger.slice(fullStart);
  assert.match(icon, /siteChromeCopy\.search\.triggerAriaLabel/);
  assert.match(icon, /label=\{label\}/);
  assert.doesNotMatch(full, /triggerAriaLabel/);
  const spread = full.indexOf("{...props}");
  const ariaOmit = full.indexOf("aria-label={undefined}");
  const titleOmit = full.indexOf("title={undefined}");
  assert.notEqual(spread, -1);
  assert.ok(ariaOmit > spread, "full Search must drop slot aria-label after spread");
  assert.ok(titleOmit > spread, "full Search must drop slot title after spread");
  assert.match(full, /focus-ring-control/);
  assert.doesNotMatch(searchTrigger, /"Search documentation"|"Search the documentation"/);
  assert.match(homeActions, /siteChromeCopy\.nav\.github/);
  assert.match(homeActions, /siteChromeCopy\.getStarted/);
  assert.match(siteHeaders, /siteChromeCopy\.brand\.homeAriaLabel/);
  assert.match(footer, /siteChromeCopy\.brand\.name/);
  assert.match(footer, /siteChromeCopy\.footer\.credit/);
  assert.match(footer, /siteChromeCopy\.footer\.links\[item\.copyKey\]/);
  assert.match(footer, /embeddedInMain \? \{\} : \{ role: "contentinfo" \}/);
  assert.doesNotMatch(footer, /https:\/\//);
  assert.doesNotMatch(footer, /changelogHref/);
  assert.match(skip, /siteChromeCopy\.skipToContent/);
  assert.match(skip, /pointer-events-none/);
  assert.match(skip, /focus:pointer-events-auto/);
  assert.doesNotMatch(skip, /(?:^|\s)sr-only(?:\s|$)/u);
  assert.match(skip, /min-h-overlay-touch-target/);
  assert.match(skip, /data-skip-link/);
  const shell = read("app/docs-shell-tokens.css");
  assert.match(shell, /\[data-skip-link\]/);
  assert.match(shell, /bottom:\s*100%/);
  assert.match(shell, /\[data-search\]:focus-visible/);
  assert.match(shell, /outline:\s*var\(--ring-width-control/);
  assert.match(brand, /siteChromeCopy\.brand\.name/);
  const offPath = read("components/site-chrome/off-path-link.tsx");
  const a11y = read("components/site-chrome/site-chrome-a11y.tsx");
  assert.match(a11y, /inert/);
  assert.match(a11y, /aria-hidden/);
  assert.match(offPath, /siteChromeCopy\.nav\.opensInNewTab/);
  assert.match(offPath, /target="_blank"/);
  assert.match(offPath, /rel="noopener noreferrer"/);
  assert.match(offPath, /data-external-mark/);
  assert.match(offPath, /hit-target inline-flex items-center gap-icon/);
  assert.match(offPath, /` \(\$\{opens\}\)`/);
  assert.match(offPath, /labelled === undefined/);
  assert.match(a11y, /siteChromeCopy\.nav\.opensInNewTab/);
  assert.match(footer, /OffPathLink/);
  assert.doesNotMatch(header, /OffPathLink/);
  assert.doesNotMatch(header, /if \(link\.external\)/);
  assert.match(homeActions, /OffPathLink/);
  assert.doesNotMatch(homeActions, /target="_blank"/);
  assert.doesNotMatch(homeActions, /\brel=/);
  assert.doesNotMatch(footer, /rel="noreferrer"/);
  assert.doesNotMatch(header, /rel="noreferrer"/);

  const consumers = CONSUMERS.filter((rel) => rel !== "lib/site-links.mjs")
    .map(read)
    .join("\n");
  assert.doesNotMatch(consumers, /"Toggle theme"|"Open navigation"|"Open menu"|"Skip to content"/);
  assert.doesNotMatch(consumers, /"Docs pages"|"Documentation"/);
  assert.doesNotMatch(consumers, /"Search documentation"|"Search the documentation"|"zedkit home"|"by Zed Tech · MIT"|"Get started"|"Try it yourself"/);
  assert.doesNotMatch(consumers, /"opens in a new tab"/);
  assert.doesNotMatch(consumers, /"Latest"|`v\$\{version\} \(releases\)`/);
  assert.doesNotMatch(header, /<button[\s>]/);
  assert.doesNotMatch(header, /<p[\s>]/);
  assert.match(header, /IconButton/);
  assert.doesNotMatch(header, /DocsMenuButton/);
  assert.match(skip, /href="#main-content"/);
  assert.doesNotMatch(skip, /IconButton|<Button[\s>]/);
});

test("smoke footer names include the off-path suffix", () => {
  const spec = read("tests/site-shell.spec.ts");
  assert.equal(siteChromeCopy.nav.opensInNewTab, "opens in a new tab");
  assert.match(spec, /GitHub \(opens in a new tab\)/);
  assert.match(spec, /zedtech\.fr \(opens in a new tab\)/);
  assert.doesNotMatch(spec, /footerLink\(page, "GitHub"\)/);
  assert.doesNotMatch(spec, /footerLink\(page, "zedtech\.fr"\)/);
});

test("SEO export still scans the catalog footer credit string", () => {
  const seo = read("scripts/check-seo-export.mjs");
  assert.match(seo, /by Zed Tech · MIT/);
  assert.equal(siteChromeCopy.footer.credit, "by Zed Tech · MIT");
  assert.match(seo, /copyKey/);
});
