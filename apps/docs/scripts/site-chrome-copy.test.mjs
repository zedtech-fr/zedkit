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
const { siteChromeCopy } = await import("../ui/i18n/site-chrome-copy.ts");

const CONSUMERS = [
  "ui/mobile-header.tsx",
  "ui/site-headers.tsx",
  "ui/home-header-actions.tsx",
  "ui/site-footer.tsx",
  "lib/site-links.mjs",
  "ui/skip-link.tsx",
  "ui/site-brand.tsx",
  "ui/off-path-link.tsx",
  "ui/site-chrome-a11y.tsx",
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
  assert.equal("guides" in siteChromeCopy.nav, false);
  assert.equal(siteChromeCopy.nav.github, "GitHub");
  assert.equal(siteChromeCopy.nav.opensInNewTab, "opens in a new tab");
  assert.equal(siteChromeCopy.getStarted, "Get started");
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
  const catalog = read("ui/i18n/site-chrome-copy.ts");
  assert.match(catalog, /English copy for site chrome\. Keys only; no markup\./);
  assert.doesNotMatch(catalog, /<[a-zA-Z]/);

  const header = read("ui/mobile-header.tsx");
  const siteHeaders = read("ui/site-headers.tsx");
  const homeActions = read("ui/home-header-actions.tsx");
  const footer = read("ui/site-footer.tsx");
  const skip = read("ui/skip-link.tsx");
  const brand = read("ui/site-brand.tsx");

  assert.doesNotMatch(header, /siteChromeCopy\.nav\.openNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.siteNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.menu/);
  assert.match(header, /siteChromeCopy\.brand\.homeAriaLabel/);
  const searchTrigger = read("ui/site-chrome.tsx");
  assert.match(searchTrigger, /siteChromeCopy\.search\.triggerAriaLabel/);
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
  assert.match(brand, /siteChromeCopy\.brand\.name/);
  const offPath = read("ui/off-path-link.tsx");
  const a11y = read("ui/site-chrome-a11y.tsx");
  assert.match(offPath, /siteChromeCopy\.nav\.opensInNewTab/);
  assert.match(offPath, /target="_blank"/);
  assert.match(offPath, /rel="noopener noreferrer"/);
  assert.match(offPath, /data-external-mark/);
  assert.match(offPath, /inline-flex items-center gap-icon/);
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
  assert.doesNotMatch(consumers, /"Search documentation"|"Search the documentation"|"zedkit home"|"by Zed Tech · MIT"|"Get started"/);
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
