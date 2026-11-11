import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { siteFooterLinkSpecs } from "../lib/site-links.mjs";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const { siteChromeCopy } = await import("../ui/i18n/site-chrome-copy.ts");

const CONSUMERS = [
  "ui/mobile-header.tsx",
  "ui/site-footer.tsx",
  "lib/site-links.mjs",
  "ui/skip-link.tsx",
  "ui/site-brand.tsx",
  "ui/mobile-search-trigger.tsx",
  "ui/kit-version-label.tsx",
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
  assert.equal(siteChromeCopy.search.triggerAriaLabel, "Search the documentation");
  assert.equal(siteChromeCopy.theme.toggleAriaLabel, "Toggle theme");
  assert.equal(siteChromeCopy.nav.openNavigation, "Open navigation");
  assert.equal(siteChromeCopy.nav.openMenu, "Open menu");
  assert.equal(siteChromeCopy.nav.menu, "Menu");
  assert.equal(siteChromeCopy.nav.siteNavigation, "Site navigation");
  assert.equal(siteChromeCopy.nav.guides, "Guides");
  assert.equal(siteChromeCopy.nav.github, "GitHub");
  assert.equal(siteChromeCopy.nav.opensInNewTab, "opens in a new tab");
  assert.equal(siteChromeCopy.footer.maintainer, "Maintained by ZED TECH");
  assert.equal(siteChromeCopy.footer.links.documentation, "Documentation");
  assert.equal(siteChromeCopy.footer.links.catalog, "Catalog");
  assert.equal(siteChromeCopy.footer.links.startWithoutWritingCode, "Start without writing code");
  assert.equal(siteChromeCopy.footer.links.mitLicense, "MIT License");
  assert.equal(siteChromeCopy.footer.links.sourceRepository, "Source repository");
  assert.equal(siteChromeCopy.footer.links.npmOrganisation, "npm organization");
  assert.equal(siteChromeCopy.footer.links.reportABug, "Report a bug");
  assert.equal(siteChromeCopy.footer.links.uiChangelog, "UI changelog");
  assert.equal(siteChromeCopy.version.latest, "Latest");
  assert.equal(siteChromeCopy.version.releasesAriaLabel("1.2.3"), "v1.2.3 (releases)");
  assert.equal(siteChromeCopy.version.shell("1.2.3"), "v1.2.3");
});

test("footer link specs carry copy keys, not English labels", () => {
  const specs = siteFooterLinkSpecs("/changelog");
  assert.deepEqual(
    specs.map((item) => item.copyKey),
    Object.keys(siteChromeCopy.footer.links),
  );
  for (const item of specs) {
    assert.equal("label" in item, false);
    assert.equal(typeof item.href, "string");
    assert.equal(typeof item.external, "boolean");
  }
  const links = read("lib/site-links.mjs");
  assert.doesNotMatch(links, /label:\s*"/);
  assert.doesNotMatch(links, /Documentation|npm organisation|MIT License|Source repository/);
});

test("listed chrome files read catalog keys instead of English literals", () => {
  const catalog = read("ui/i18n/site-chrome-copy.ts");
  assert.match(catalog, /English copy for site chrome\. Keys only; no markup\./);
  assert.doesNotMatch(catalog, /<[a-zA-Z]/);

  const header = read("ui/mobile-header.tsx");
  const footer = read("ui/site-footer.tsx");
  const skip = read("ui/skip-link.tsx");
  const brand = read("ui/site-brand.tsx");
  const search = read("ui/mobile-search-trigger.tsx");
  const version = read("ui/kit-version-label.tsx");

  assert.match(header, /siteChromeCopy\.theme\.toggleAriaLabel/);
  assert.match(header, /siteChromeCopy\.nav\.openNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.openMenu/);
  assert.match(header, /siteChromeCopy\.nav\.menu/);
  assert.match(header, /siteChromeCopy\.nav\.siteNavigation/);
  assert.match(header, /siteChromeCopy\.nav\.guides/);
  assert.match(header, /siteChromeCopy\.nav\.github/);
  assert.match(header, /siteChromeCopy\.brand\.homeAriaLabel/);
  assert.match(footer, /siteChromeCopy\.footer\.maintainer/);
  assert.match(footer, /siteChromeCopy\.footer\.links\[item\.copyKey\]/);
  assert.match(skip, /siteChromeCopy\.skipToContent/);
  assert.match(brand, /siteChromeCopy\.brand\.name/);
  assert.match(search, /siteChromeCopy\.search\.triggerAriaLabel/);
  assert.match(version, /siteChromeCopy\.version\.latest/);
  assert.match(version, /siteChromeCopy\.version\.releasesAriaLabel\(version\)/);
  assert.match(version, /siteChromeCopy\.version\.shell\(version\)/);
  const offPath = read("ui/off-path-link.tsx");
  const a11y = read("ui/site-chrome-a11y.tsx");
  assert.match(offPath, /siteChromeCopy\.nav\.opensInNewTab/);
  assert.match(offPath, /target="_blank"/);
  assert.match(offPath, /rel="noopener noreferrer"/);
  assert.match(offPath, /data-external-mark/);
  assert.match(a11y, /siteChromeCopy\.nav\.opensInNewTab/);
  assert.match(footer, /OffPathLink/);
  assert.match(header, /OffPathLink/);
  assert.doesNotMatch(footer, /rel="noreferrer"/);
  assert.doesNotMatch(header, /rel="noreferrer"/);

  const consumers = CONSUMERS.filter((rel) => rel !== "lib/site-links.mjs")
    .map(read)
    .join("\n");
  assert.doesNotMatch(consumers, /"Toggle theme"|"Open navigation"|"Open menu"|"Skip to content"/);
  assert.doesNotMatch(consumers, /"Search the documentation"|"zedkit home"|"Maintained by ZED TECH"/);
  assert.doesNotMatch(consumers, /"opens in a new tab"/);
  assert.doesNotMatch(consumers, /"Latest"|`v\$\{version\} \(releases\)`/);
  assert.doesNotMatch(header, /<button[\s>]/);
  assert.doesNotMatch(header, /<p[\s>]/);
  assert.doesNotMatch(search, /<button[\s>]/);
  assert.doesNotMatch(search, /<p[\s>]/);
  assert.match(header, /IconButton/);
  assert.match(header, /variant="ghost"/);
  assert.match(search, /IconButton/);
  assert.match(search, /variant="ghost"/);
  assert.match(skip, /href="#main-content"/);
  assert.doesNotMatch(skip, /IconButton|<Button[\s>]/);
});

test("SEO export still scans the catalog maintainer string", () => {
  const seo = read("scripts/check-seo-export.mjs");
  assert.match(seo, /Maintained by ZED TECH/);
  assert.equal(siteChromeCopy.footer.maintainer, "Maintained by ZED TECH");
  assert.match(seo, /copyKey/);
});
