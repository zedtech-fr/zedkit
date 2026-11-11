import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  isSiteNavLinkActive,
  SITE_GUIDE_LINKS,
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

test("desktop header links are the primary list plus a Guides menu", () => {
  assert.match(source, /function siteHeaderLinks\(\)/);
  assert.match(source, /sitePrimaryNavLinks\(\)/);
  const header = siteHeaderLinks();
  const menus = header.filter((item) => item.type === "menu");
  const mains = header.filter((item) => item.type !== "menu");
  assert.deepEqual(
    mains.map((item) => ({ text: item.text, url: item.url, active: item.active })),
    sitePrimaryNavLinks().map((item) => ({ text: item.text, url: item.href, active: item.active })),
  );
  assert.equal(menus.length, 1);
  assert.equal(menus[0].text, "Guides");
  assert.equal(
    (menus[0].items ?? []).some((item) => item.text === "UI foundations" || item.url === "/docs/foundations"),
    false,
  );
  assert.equal(
    SITE_GUIDE_LINKS.some((item) => item.text === "UI foundations" || item.href === "/docs/foundations"),
    false,
  );
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
