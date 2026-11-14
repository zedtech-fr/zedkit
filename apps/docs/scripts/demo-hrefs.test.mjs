import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { COMPONENT_PAGE_SECTION_IDS } from "../features/docs/component-page-sections.mjs";

const demos = join(dirname(fileURLToPath(import.meta.url)), "../components/demos");
const PAGE_SECTIONS = new Set(COMPONENT_PAGE_SECTION_IDS);
const ALLOWED_PATH = /^\/$|^\/docs(?:\/|$)|^\/issues(?:\/|$)|^\/catalog(?:\/|$)|^\/features(?:\/|$)|^\/r\//;
const HREF = /\bhref\s*[:=]\s*(?:\{\s*)?(`[^`]*`|"[^"]*"|'[^']*')/g;
const ID = /\bid\s*=\s*(?:\{\s*)?(?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;
const NON_LITERAL_HREF = /\bhref\s*=\s*\{(?!\s*(?:`[^`]*`|"[^"]*"|'[^']*'))[^}]*\}/g;
const APP_SHELL_DEMOS = [
  "app-shell-no-topbar-demo.tsx",
  "app-shell-mobile-drawer-demo.tsx",
  "app-shell-trigger-demo.tsx",
];

function collectDemoHrefProblems(file, source) {
  const problems = [];
  const ids = new Set(
    [...source.matchAll(ID)].map((match) => match[1] ?? match[2] ?? match[3]),
  );
  for (const match of source.matchAll(HREF)) {
    const href = match[1].slice(1, -1);
    if (href === "#") continue;
    if (/^https?:\/\//i.test(href)) continue;
    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (!id || !(ids.has(id) || PAGE_SECTIONS.has(id))) {
        problems.push(`${file} ${href}`);
      }
      continue;
    }
    if (href.startsWith("/") && ALLOWED_PATH.test(href)) continue;
    problems.push(`${file} ${href}`);
  }
  for (const match of source.matchAll(NON_LITERAL_HREF)) {
    problems.push(`${file} non-literal ${match[0].trim()}`);
  }
  return problems;
}

test("catalog demos have no dead paths or in-page hashes", () => {
  const files = readdirSync(demos).filter((name) => name.endsWith(".tsx"));
  assert.ok(files.length > 0, "demo sources");
  const problems = [];
  for (const file of files) {
    const source = readFileSync(join(demos, file), "utf8");
    problems.push(...collectDemoHrefProblems(file, source));
  }
  assert.deepEqual(problems, []);
});

test("demo hash allow-list is the component-page section union", () => {
  assert.ok(PAGE_SECTIONS.has("guidance"));
  assert.ok(PAGE_SECTIONS.has("example"));
  assert.equal(PAGE_SECTIONS.size, COMPONENT_PAGE_SECTION_IDS.length);
});

test("non-literal href={} fails closed", () => {
  const problems = collectDemoHrefProblems(
    "fixture.tsx",
    `export function Demo() { const to = "/x"; return <a href={to}>x</a>; }`,
  );
  assert.deepEqual(problems, ["fixture.tsx non-literal href={to}"]);
  assert.deepEqual(
    collectDemoHrefProblems("ok.tsx", `<a href="#example">Example</a>`),
    [],
  );
});

test("AppShell demos do not put ids on sidebar links", () => {
  for (const file of APP_SHELL_DEMOS) {
    const source = readFileSync(join(demos, file), "utf8");
    assert.doesNotMatch(source, /\bid\s*=/, `${file} must not set id (sidebar mounts twice)`);
    assert.match(source, /min-h-target/);
  }
});

test("brand logo Work/About keep a 24px floor and a focus ring", () => {
  const source = readFileSync(join(demos, "brand-logo-demo.tsx"), "utf8");
  assert.match(source, /href="#work"[^>]*min-h-floor/);
  assert.match(source, /href="#work"[^>]*focus-ring-control/);
  assert.match(source, /href="#about"[^>]*min-h-floor/);
  assert.match(source, /href="#about"[^>]*focus-ring-control/);
  assert.doesNotMatch(source, /href="#work"[^>]*onClick/);
});

test("LocaleSwitchDemo passes real hrefs", () => {
  const source = readFileSync(join(demos, "marketing-demo.tsx"), "utf8");
  assert.match(source, /function LocaleSwitchDemo/);
  assert.match(source, /href: "#example"/);
});
