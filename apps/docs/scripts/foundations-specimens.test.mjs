import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const { signatureMotionClass, typeRoleClass } = await import(
  "../../../packages/ui/src/typography/type-roles.ts"
);

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");

const { foundationsCopy } = await import("../components/i18n/foundations-copy.ts");
const {
  foundationsBandIds,
  foundationsMotionNames,
  foundationsSwatchAllowlist,
  foundationsSwatches,
  foundationsTypeRoles,
} = await import("../lib/foundations-swatches.ts");

const REQUIRED_BANDS = ["color", "type", "buttons", "chips", "cards", "rhythm", "motion"];
const PAGE_FORBIDDEN_TOKENS = new Set(["bg-primary", "bg-accent"]);

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (value == null || typeof value === "function") return out;
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

function readApp(rel) {
  return readFileSync(join(APP, rel), "utf8");
}

test("foundations bands cover the specimen page contract", () => {
  assert.deepEqual([...foundationsBandIds], REQUIRED_BANDS);
  for (const id of REQUIRED_BANDS) {
    assert.equal(typeof foundationsCopy.rules[id], "string");
    assert.ok(foundationsCopy.rules[id].length > 0, `empty rule for ${id}`);
  }
});

test("page-scope swatches stay on chrome tokens, not Glass indigo or violet", () => {
  assert.ok(foundationsSwatches.length >= 4);
  const ids = foundationsSwatches.map((swatch) => swatch.id);
  assert.ok(ids.includes("page"));
  assert.ok(ids.includes("text"));
  assert.ok(ids.includes("indigo"));
  assert.ok(ids.includes("violet"));
  for (const swatch of foundationsSwatches) {
    assert.ok(
      foundationsSwatchAllowlist.includes(swatch.tokenClass),
      `${swatch.id} tokenClass ${swatch.tokenClass} is not a bg-* token utility`,
    );
    assert.equal(swatch.tokenClass.startsWith("bg-"), true);
    assert.doesNotMatch(swatch.tokenClass, /#|hsl|rgb/);
    if (swatch.scope === "page") {
      assert.equal(
        PAGE_FORBIDDEN_TOKENS.has(swatch.tokenClass),
        false,
        `page-scope ${swatch.id} must not use ${swatch.tokenClass}`,
      );
    }
  }
  const indigo = foundationsSwatches.find((swatch) => swatch.id === "indigo");
  const violet = foundationsSwatches.find((swatch) => swatch.id === "violet");
  assert.equal(indigo.scope, "panel");
  assert.equal(indigo.tokenClass, "bg-primary");
  assert.equal(violet.scope, "panel");
  assert.equal(violet.tokenClass, "bg-accent");
});

test("type roles on the specimen are keys of typeRoleClass", () => {
  assert.ok(foundationsTypeRoles.length >= 8);
  for (const role of foundationsTypeRoles) {
    assert.equal(role in typeRoleClass, true, `${role} is not a typeRoleClass key`);
    assert.ok(foundationsCopy.typeSamples[role].length > 0);
  }
});

test("motion names stay locked to signatureMotionClass and do not animate", () => {
  assert.deepEqual([...foundationsMotionNames], Object.keys(signatureMotionClass));
  const motionSource = [
    readApp("components/foundations-motion.tsx"),
    readApp("components/i18n/foundations-copy.ts"),
  ].join("\n");
  for (const className of Object.values(signatureMotionClass)) {
    assert.equal(
      motionSource.includes(className),
      false,
      `motion specimen must name rules without applying ${className}`,
    );
  }
});

test("copy strings are non-empty and the band layout is kit-only", () => {
  const strings = collectStrings(foundationsCopy);
  assert.ok(strings.length > 10);
  for (const value of strings) {
    assert.ok(value.length > 0);
  }
  const band = readApp("components/foundations-band.tsx");
  assert.match(band, /not-prose/);
  assert.match(band, /data-foundations-band/);
  assert.doesNotMatch(band, /sm:grid-pair/);
  assert.doesNotMatch(band, /<div[\s>/]/);
  assert.doesNotMatch(band, /<span[\s>/]/);
});

test("guide wires every band and site action is a real Button", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  for (const name of [
    "FoundationsColor",
    "FoundationsType",
    "FoundationsButtons",
    "FoundationsChips",
    "FoundationsCards",
    "FoundationsRhythm",
    "FoundationsMotion",
  ]) {
    assert.match(mdx, new RegExp(`import \\{ ${name} \\} from "@/components/foundations-`));
    assert.match(mdx, new RegExp(`<${name} />`));
  }
  const buttons = readApp("components/foundations-buttons.tsx");
  assert.match(buttons, /data-site-action/);
  assert.match(buttons, /ThemeScope/);
  assert.doesNotMatch(buttons, /#[0-9A-Fa-f]{3,8}/);
  const color = readApp("components/foundations-color.tsx");
  assert.doesNotMatch(color, /data-site-action/);
  assert.doesNotMatch(color, /ThemeScope/);
  assert.doesNotMatch(color, /variant="glass"/);
  assert.doesNotMatch(color, /#[0-9A-Fa-f]{3,8}/);
});

test("guide title is Site foundations at display scale with no Who this is for", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  assert.match(mdx, /^title:\s*Site foundations\s*$/m);
  assert.match(mdx, /^hidePageTitle:\s*true\s*$/m);
  assert.match(mdx, /import \{ FoundationsHero \} from "@\/components\/foundations-hero"/);
  assert.match(mdx, /<FoundationsHero \/>/);
  assert.doesNotMatch(mdx, /## Who this is for/);
  assert.match(mdx, /## Color/);
  assert.doesNotMatch(mdx, /## Color and surfaces/);
  const colorIdx = mdx.indexOf("## Color");
  const typeIdx = mdx.indexOf("## Type");
  const buttonsIdx = mdx.indexOf("## Buttons: site vs kit");
  assert.ok(colorIdx >= 0 && typeIdx > colorIdx && buttonsIdx > typeIdx);
  assert.match(mdx, /VISUAL-CONTRACT\.md/);
  assert.doesNotMatch(mdx, /Layer \| Owns \| Lives in \| Fix here when/);
});

test("hero is display H1 plus intro and the glass callout", () => {
  const hero = readApp("components/foundations-hero.tsx");
  const copy = readApp("components/i18n/foundations-copy.ts");
  assert.match(copy, /title:\s*"Site foundations"/);
  assert.match(hero, /typeRole="display"/);
  assert.match(hero, /copy\.hero\.title/);
  assert.match(hero, /copy\.hero\.intro/);
  assert.match(hero, /copy\.swatches\.panelTitle/);
  assert.match(hero, /ThemeScope identity="glass"/);
  assert.match(hero, /variant="glass"/);
  assert.doesNotMatch(hero, /<(div|span)[\s>/]/);
  assert.doesNotMatch(hero, /#[0-9A-Fa-f]{3,8}/);
});

test("foundations chrome skips docs article chrome and keeps search", () => {
  const page = readApp("app/docs/[[...slug]]/page.tsx");
  const layout = readApp("app/docs/[[...slug]]/layout.tsx");
  const headers = readApp("ui/site-headers.tsx");
  const mobile = readApp("ui/mobile-header.tsx");
  const nav = readApp("lib/site-nav-data.ts");
  const mdxComponents = readApp("mdx-components.tsx");
  assert.match(page, /isFoundationsPath/);
  assert.match(page, /DocsBody/);
  assert.match(layout, /docsLayoutTree/);
  assert.match(layout, /isFoundationsPath/);
  assert.match(nav, /isFoundationsPath/);
  assert.match(headers, /isFoundationsPath/);
  assert.match(headers, /FoundationsDesktopHeader/);
  assert.match(mdxComponents, /FoundationsHero/);
  assert.match(layout, /sidebar=\{\{\s*enabled:\s*!isFoundationsPath\(pathname\)\s*\}\}/);
  assert.match(layout, /themeSwitch=\{\{\s*enabled:\s*false\s*\}\}/);
  assert.match(layout, /searchToggle=\{\{\s*enabled:\s*true\s*\}\}/);
  assert.match(page, /tableOfContent: \{ enabled: false as const \}/);
  assert.match(page, /tableOfContentPopover: \{ enabled: false as const \}/);
  assert.match(page, /skipDocsBody/);
  assert.match(mobile, /SiteFullSearchTrigger/);
  assert.match(mobile, /siteHeaderChrome/);
  assert.match(headers, /HomeDesktopHeader/);
});

test("docs index and llms label say Site foundations", () => {
  const index = readApp("prose/guides/index.mdx");
  const generate = readApp("scripts/generate.mjs");
  assert.match(index, /\[Site foundations\]\(\/docs\/foundations\)/);
  assert.doesNotMatch(index, /\[UI foundations\]/);
  assert.match(generate, /\[Site foundations\]\(https:\/\/zedkit\.app\/docs\/foundations\)/);
  assert.doesNotMatch(generate, /\[UI foundations\]/);
});
