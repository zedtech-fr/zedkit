import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  isCatalogPath,
  isFoundationsPath,
  isHomePath,
  isSiteNavLinkActive,
  siteHeaderChrome,
  siteHeaderLinks,
  sitePrimaryNavLinks,
} from "../lib/site-nav-data.ts";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../lib/site-nav-data.ts"),
  "utf8",
);

test("primary nav is AI, UI, Docs, Catalog with those hrefs", () => {
  assert.deepEqual(
    sitePrimaryNavLinks().map((link) => ({ text: link.text, href: link.href, active: link.active })),
    [
      { text: "AI", href: "/docs/ai/setup", active: "url" },
      { text: "UI", href: "/docs/foundations", active: "url" },
      { text: "Docs", href: "/docs", active: "url" },
      { text: "Catalog", href: "/catalog", active: "url" },
    ],
  );
});

test("primary nav texts do not include Reviews or Issues", () => {
  const texts = sitePrimaryNavLinks().map((link) => link.text);
  assert.equal(texts.includes("Reviews"), false);
  assert.equal(texts.includes("Issues"), false);
  assert.equal(
    sitePrimaryNavLinks().some((link) => link.external === true),
    false,
  );
});

test("changelog is not a primary or desktop header item", () => {
  const texts = [
    ...sitePrimaryNavLinks().map((link) => link.text),
    ...siteHeaderLinks().flatMap((item) => [
      item.text,
      ...((item.items ?? []).map((entry) => entry.text)),
    ]),
  ];
  assert.equal(
    texts.some((text) => /changelog/i.test(text)),
    false,
  );
});

test("desktop header links are the primary list only", () => {
  assert.match(source, /function siteHeaderLinks\(\)/);
  assert.match(source, /sitePrimaryNavLinks\(\)/);
  assert.doesNotMatch(source, /SITE_GUIDE_LINKS|type:\s*"menu"|text:\s*"Guides"/);
  const header = siteHeaderLinks();
  assert.deepEqual(
    header.map((item) => item.text),
    ["AI", "UI", "Docs", "Catalog"],
  );
  assert.deepEqual(
    header.map((item) => ({ text: item.text, url: item.url, active: item.active })),
    sitePrimaryNavLinks().map((item) => ({ text: item.text, url: item.href, active: item.active })),
  );
  assert.equal(
    header.some((item) => item.type === "menu"),
    false,
  );
  const blob = JSON.stringify(header);
  assert.equal(/guides/i.test(blob), false);
  assert.equal(/github/i.test(blob), false);
  assert.equal(/get started/i.test(blob), false);
  assert.equal(blob.includes("#get-started"), false);
});

test("isHomePath is only the site root", () => {
  assert.equal(isHomePath("/"), true);
  assert.equal(isHomePath(""), true);
  assert.equal(isHomePath("/catalog"), false);
  assert.equal(isHomePath("/docs"), false);
  assert.equal(isHomePath("/docs/getting-started"), false);
});

test("isFoundationsPath is only the foundations guide URL", () => {
  assert.equal(isFoundationsPath("/docs/foundations"), true);
  assert.equal(isFoundationsPath("/docs/foundations/"), true);
  assert.equal(isFoundationsPath(""), false);
  assert.equal(isFoundationsPath("/"), false);
  assert.equal(isFoundationsPath("/docs"), false);
  assert.equal(isFoundationsPath("/docs/foundations/extra"), false);
  assert.equal(isFoundationsPath("/catalog"), false);
});

const PRIMARY_LINK_TEXTS = ["AI", "UI", "Docs", "Catalog"];

test("siteHeaderChrome policy is GitHub always; theme, version, and a site-nav disclosure never", () => {
  assert.match(source, /GitHub is always mounted/);
  assert.match(source, /phone site menu/);
  assert.match(source, /Theme, version, and a site-nav disclosure are never on/);
  assert.doesNotMatch(source, /github:\s*true|theme:\s*false|siteNavDisclosure:\s*false/);
});

test("home phone chrome exposes the four links, GitHub, and Get started — no search, theme, version, or site-nav disclosure", () => {
  const chrome = siteHeaderChrome("/");
  assert.deepEqual(
    chrome.links.map((link) => ({ text: link.text, href: link.href })),
    [
      { text: "AI", href: "/docs/ai/setup" },
      { text: "UI", href: "/docs/foundations" },
      { text: "Docs", href: "/docs" },
      { text: "Catalog", href: "/catalog" },
    ],
  );
  assert.equal(chrome.search, false);
  assert.equal(chrome.getStarted, true);
  assert.deepEqual(Object.keys(chrome).sort(), ["getStarted", "links", "search"]);
  assert.equal(
    chrome.links.some((link) => PRIMARY_LINK_TEXTS.includes(link.text) === false),
    false,
  );
  assert.equal(
    chrome.links.some((link) => /reviews|issues/i.test(link.text)),
    false,
  );
});

test("catalog and docs phone chrome keep search and GitHub; the page tree is in-flow so the opener stays off", () => {
  const catalog = siteHeaderChrome("/catalog");
  assert.deepEqual(
    catalog.links.map((link) => link.text),
    PRIMARY_LINK_TEXTS,
  );
  assert.equal(catalog.search, true);
  assert.equal(catalog.getStarted, false);
  assert.deepEqual(Object.keys(catalog).sort(), ["getStarted", "links", "search"]);

  const docs = siteHeaderChrome("/docs");
  assert.equal(docs.search, true);
  assert.equal(docs.getStarted, false);
  assert.deepEqual(Object.keys(docs).sort(), ["getStarted", "links", "search"]);

  const foundations = siteHeaderChrome("/docs/foundations");
  assert.equal(foundations.search, true);
  assert.equal(foundations.getStarted, false);
});

test("isCatalogPath is only the catalog route", () => {
  assert.equal(isCatalogPath("/catalog"), true);
  assert.equal(isCatalogPath("/"), false);
  assert.equal(isCatalogPath(""), false);
  assert.equal(isCatalogPath("/docs"), false);
  assert.equal(isCatalogPath("/catalog/nope"), false);
  assert.equal(isCatalogPath("/catalog/"), false);
});

test("exact url matching does not current-state Docs on an AI or UI page", () => {
  const cases = [
    ["/docs", { text: "Docs", href: "/docs", active: "url" }, true],
    ["/docs/ai/setup", { text: "Docs", href: "/docs", active: "url" }, false],
    ["/docs/foundations", { text: "Docs", href: "/docs", active: "url" }, false],
    ["/docs/ai/setup", { text: "AI", href: "/docs/ai/setup", active: "url" }, true],
    ["/docs/ai/setup/extra", { text: "AI", href: "/docs/ai/setup", active: "url" }, false],
    ["/docs/foundations", { text: "UI", href: "/docs/foundations", active: "url" }, true],
    ["/docs/getting-started", { text: "Docs", href: "/docs", active: "nested-url" }, true],
    ["/docs", { text: "Docs", href: "/docs", active: "nested-url" }, true],
    ["/catalog", { text: "Docs", href: "/docs", active: "url" }, false],
    ["/docs", { text: "Changelog", href: "https://example.test", external: true, active: "url" }, false],
    ["/docs", { text: "Docs", href: "/docs" }, false],
  ];
  for (const [pathname, link, expected] of cases) {
    assert.equal(isSiteNavLinkActive(pathname, link), expected, `${pathname} vs ${link.href} (${link.active ?? "none"})`);
  }
});
