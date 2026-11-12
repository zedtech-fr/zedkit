import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const { typeRoleClass } = await import("../../../packages/ui/src/typography/type-roles.ts");
const { hslTripletToHex } = await import("../lib/identity-simple-value.ts");

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "../..");

const { foundationsCopy } = await import("../components/i18n/foundations-copy.ts");
const { foundationsBandIds, foundationsSwatches, foundationsTypeRows } = await import(
  "../lib/foundations-swatches.ts"
);

const REQUIRED_BANDS = ["color", "type"];
const PAGE_FORBIDDEN_TOKENS = new Set(["--primary", "--accent"]);
const ROLE_TREATMENTS = new Set(["display", "section", "band", "lead"]);
const DELETED_BANDS = [
  "foundations-buttons.tsx",
  "foundations-chips.tsx",
  "foundations-cards.tsx",
  "foundations-rhythm.tsx",
  "foundations-motion.tsx",
];

/** Mockup captions (quiet-glass foundations HTML). Independent of the data module. */
const MOCKUP_SWATCHES = [
  { id: "page", name: "Page", hex: "#FFFFFF", token: "--zk-site-page", hsl: "0 0% 100%" },
  { id: "band", name: "Band", hex: "#FAFAFA", token: "--zk-site-band", hsl: "0 0% 98%" },
  { id: "hairline", name: "Hairline", hex: "#E4E4E7", token: "--zk-site-hairline", hsl: "240 5.9% 90%" },
  { id: "body", name: "Body text", hex: "#4E4E56", token: "--muted-foreground", hsl: "240 5% 32%" },
  { id: "ink", name: "Ink", hex: "#09090B", token: "--foreground", hsl: "240 10% 3.9%" },
  { id: "action", name: "Action", hex: "#18181B", token: "--zk-site-action", hsl: "240 5.9% 10%" },
  { id: "indigo", name: "Indigo", hex: "#2B23C7", token: "--primary", hsl: "243 70% 46%" },
  { id: "violet", name: "Violet", hex: "#A171F4", token: "--accent", hsl: "262 85% 70%" },
];

const MOCKUP_TYPE_SPECS = [
  "Inter 48 / 1.08, medium",
  "Inter 30 / 1.15, medium",
  "Inter 18, semibold",
  "Inter 16 / 1.55",
  "Inter 20 italic, quotes only",
  "JetBrains Mono 13",
];

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

function readRoot(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

test("foundations bands cover the specimen page contract", () => {
  assert.deepEqual([...foundationsBandIds], REQUIRED_BANDS);
  for (const id of REQUIRED_BANDS) {
    if (id === "type") continue;
    assert.equal(typeof foundationsCopy.rules[id], "string");
    assert.ok(foundationsCopy.rules[id].length > 0, `empty rule for ${id}`);
  }
  assert.equal(foundationsCopy.rules.type, undefined);
  for (const extra of ["buttons", "chips", "cards", "rhythm", "motion"]) {
    assert.equal(foundationsCopy.rules[extra], undefined);
  }
});

test("palette is eight mockup swatches with hex proven from tokens", () => {
  assert.equal(foundationsSwatches.length, MOCKUP_SWATCHES.length);
  const shell = readApp("app/docs-shell-tokens.css");
  const glass = readRoot("packages/ui/src/identities/glass.css");
  for (const [index, expected] of MOCKUP_SWATCHES.entries()) {
    const swatch = foundationsSwatches[index];
    assert.equal(swatch.id, expected.id);
    assert.equal(swatch.token, expected.token);
    assert.equal(swatch.hex.toLowerCase(), expected.hex.toLowerCase());
    assert.equal(foundationsCopy.swatches[swatch.id], expected.name);
    const fromToken = hslTripletToHex(expected.hsl);
    assert.equal(fromToken?.toLowerCase(), expected.hex.toLowerCase(), `${swatch.id} token HSL`);
    const owner = swatch.scope === "panel" ? glass : shell;
    assert.match(
      owner,
      new RegExp(`${expected.token}:\\s*${expected.hsl.replaceAll(".", "\\.")}`),
      `${expected.token} ${expected.hsl} missing from owner sheet`,
    );
    if (swatch.scope === "page") {
      assert.equal(
        PAGE_FORBIDDEN_TOKENS.has(swatch.token),
        false,
        `page-scope ${swatch.id} must not use ${swatch.token}`,
      );
    }
  }
  const indigo = foundationsSwatches.find((swatch) => swatch.id === "indigo");
  const violet = foundationsSwatches.find((swatch) => swatch.id === "violet");
  assert.equal(indigo.scope, "panel");
  assert.equal(indigo.token, "--primary");
  assert.equal(violet.scope, "panel");
  assert.equal(violet.token, "--accent");
});

test("type rows are the six mockup spec/specimen pairs", () => {
  assert.equal(foundationsTypeRows.length, MOCKUP_TYPE_SPECS.length);
  const typeSource = readApp("components/foundations-type.tsx");
  for (const [index, spec] of MOCKUP_TYPE_SPECS.entries()) {
    const row = foundationsTypeRows[index];
    assert.equal(foundationsCopy.typeRows[row.id].spec, spec);
    assert.ok(foundationsCopy.typeRows[row.id].sample.length > 0);
    if (ROLE_TREATMENTS.has(row.treatment)) {
      assert.equal(row.treatment in typeRoleClass, true, `${row.treatment} is not a typeRoleClass key`);
    }
  }
  assert.match(typeSource, /<Heading/);
  assert.match(typeSource, /<Text/);
  assert.match(typeSource, /data-type-quote/);
  assert.match(typeSource, /font-mono/);
  assert.match(typeSource, /typeRole="small"/);
  assert.doesNotMatch(typeSource, /typeLabels/);
  assert.doesNotMatch(typeSource, /foundationsTypeRoles/);
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

test("guide wires Color and Type only and does not import dropped bands", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  for (const name of ["FoundationsColor", "FoundationsType", "FoundationsHero"]) {
    assert.match(mdx, new RegExp(`import \\{ ${name} \\} from "@/components/foundations-`));
    assert.match(mdx, new RegExp(`<${name} />`));
  }
  for (const name of [
    "FoundationsButtons",
    "FoundationsChips",
    "FoundationsCards",
    "FoundationsRhythm",
    "FoundationsMotion",
  ]) {
    assert.doesNotMatch(mdx, new RegExp(name));
  }
  for (const file of DELETED_BANDS) {
    assert.equal(existsSync(join(APP, "components", file)), false, `${file} should be deleted`);
  }
  const color = readApp("components/foundations-color.tsx");
  assert.doesNotMatch(color, /data-site-action/);
  assert.match(color, /ThemeScope identity="glass"/);
  assert.doesNotMatch(color, /variant="glass"/);
  assert.doesNotMatch(color, /#[0-9A-Fa-f]{3,8}/);
  assert.match(color, /data-foundations-swatch/);
  assert.doesNotMatch(color, /md:grid-quad/);
});

test("guide title is Site foundations with Color and Type only", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  assert.match(mdx, /^title:\s*Site foundations\s*$/m);
  assert.match(mdx, /^hidePageTitle:\s*true\s*$/m);
  assert.match(mdx, /import \{ FoundationsHero \} from "@\/components\/foundations-hero"/);
  assert.match(mdx, /<FoundationsHero \/>/);
  assert.doesNotMatch(
    mdx,
    /this page is the target look, not a claim that every page already matches/,
  );
  assert.doesNotMatch(mdx, /## Who this is for/);
  assert.match(mdx, /## Color/);
  assert.doesNotMatch(mdx, /## Color and surfaces/);
  assert.doesNotMatch(mdx, /## Buttons: site vs kit/);
  assert.doesNotMatch(mdx, /## Motion/);
  assert.doesNotMatch(mdx, /## Owner/);
  assert.doesNotMatch(mdx, /## Next steps/);
  const colorIdx = mdx.indexOf("## Color");
  const typeIdx = mdx.indexOf("## Type");
  assert.ok(colorIdx >= 0 && typeIdx > colorIdx);
  assert.match(mdx, /VISUAL-CONTRACT\.md/);
  assert.doesNotMatch(mdx, /Layer \| Owns \| Lives in \| Fix here when/);
});

test("hero is a grey band with 40px title overlay, intro, and glass callout", () => {
  const hero = readApp("components/foundations-hero.tsx");
  const copy = readApp("components/i18n/foundations-copy.ts");
  const typography = readApp("app/docs-typography.css");
  const tokens = readApp("app/docs-shell-tokens.css");
  assert.match(copy, /title:\s*"Site foundations"/);
  assert.doesNotMatch(copy, /siteAction/);
  assert.match(hero, /typeRole="display"/);
  assert.match(hero, /copy\.hero\.title/);
  assert.match(hero, /copy\.hero\.intro/);
  assert.match(hero, /copy\.swatches\.panelTitle/);
  assert.match(hero, /ThemeScope identity="glass"/);
  assert.match(hero, /variant="glass"/);
  assert.match(hero, /data-foundations-hero/);
  assert.doesNotMatch(hero, /<(div|span)[\s>/]/);
  assert.doesNotMatch(hero, /#[0-9A-Fa-f]{3,8}/);
  assert.match(tokens, /--zk-site-hairline:\s*240 5\.9% 90%/);
  assert.match(typography, /--zk-foundations-title-size:\s*2\.5rem/);
  assert.match(
    typography,
    /\[data-foundations-hero\][\s\S]{0,200}--zk-type-h1-size:\s*var\(--zk-foundations-title-size\)/,
  );
  assert.match(typography, /\[data-palette-dots\][\s\S]{0,300}repeat\(auto-fit, minmax\(/);
});

test("foundations chrome skips docs article chrome and keeps search", () => {
  const page = readApp("app/docs/[[...slug]]/page.tsx");
  const layout = readApp("app/docs/[[...slug]]/layout.tsx");
  const headers = readApp("ui/site-headers.tsx");
  const mobile = readApp("ui/mobile-header.tsx");
  const nav = readApp("lib/site-nav-data.ts");
  const mdxComponents = readApp("mdx-components.tsx");
  const typography = readApp("app/docs-typography.css");
  assert.equal(existsSync(join(APP, "ui/docs-layout-branch.tsx")), false);
  assert.match(page, /isFoundationsPath/);
  assert.match(page, /DocsBody/);
  assert.match(page, /"data-foundations-page": ""/);
  assert.match(typography, /#nd-page\[data-foundations-page\] \{\s*max-width: var\(--zk-container-wide\);/);
  assert.equal((typography.match(/#nd-page\[data-foundations-page\] \{\s*max-width:/g) ?? []).length, 1);
  assert.match(typography, /#nd-page\[data-foundations-page\] \.prose \{\s*max-width: none;/);
  assert.match(layout, /docsLayoutTree/);
  assert.match(layout, /isFoundationsPath/);
  assert.match(nav, /isFoundationsPath/);
  assert.match(headers, /isFoundationsPath/);
  assert.match(headers, /FoundationsDesktopHeader/);
  assert.doesNotMatch(mdxComponents, /FoundationsHero/);
  assert.match(layout, /sidebar=\{\{\s*enabled:\s*!isFoundationsPath\(pathname\),\s*collapsible:\s*false\s*\}\}/);
  assert.match(layout, /themeSwitch=\{\{\s*enabled:\s*false\s*\}\}/);
  assert.match(layout, /searchToggle=\{\{\s*enabled:\s*true\s*\}\}/);
  assert.match(page, /tableOfContent: \{ enabled: false as const \}/);
  assert.match(page, /tableOfContentPopover: \{ enabled: false as const \}/);
  assert.match(page, /skipDocsBody/);
  assert.match(mobile, /SiteSearchTrigger/);
  assert.doesNotMatch(mobile, /SiteFullSearchTrigger/);
  assert.match(mobile, /siteHeaderChrome/);
  assert.match(headers, /HomeDesktopHeader/);
  assert.match(headers, /bg-background/);
});

test("docs index and llms label say Site foundations without extra bands", () => {
  const index = readApp("prose/guides/index.mdx");
  const generate = readApp("scripts/generate.mjs");
  assert.match(index, /\[Site foundations\]\(\/docs\/foundations\)/);
  assert.doesNotMatch(index, /\[UI foundations\]/);
  assert.match(generate, /\[Site foundations\]\(https:\/\/zedkit\.app\/docs\/foundations\)/);
  assert.doesNotMatch(generate, /\[UI foundations\]/);
  assert.doesNotMatch(generate, /site vs kit buttons/);
  assert.doesNotMatch(generate, /rhythm, motion/);
});
