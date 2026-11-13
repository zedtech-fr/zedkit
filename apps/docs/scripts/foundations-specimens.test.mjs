import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const { typeRoleClass } = await import("../../../packages/ui/src/typography/type-roles.ts");
const { hslTripletToHex } = await import("../features/identity/ui/identity-simple-value.ts");

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "../..");

const FOUNDATIONS = "features/docs/guides/foundations";
const FOUNDATIONS_UI = `${FOUNDATIONS}/ui`;
const ZEDKIT_SHADCN = "features/docs/guides/zedkit-and-shadcn";

const { foundationsCopy } = await import(`../${FOUNDATIONS}/i18n/foundations-copy.ts`);
const { foundationsBandIds, foundationsSwatches, foundationsTypeRows } = await import(
  `../${FOUNDATIONS}/foundations-swatches.ts`
);

const OLD_GUIDE_PATHS = [
  "components/foundations-band.tsx",
  "components/foundations-color.tsx",
  "components/foundations-hero.tsx",
  "components/foundations-type.tsx",
  "components/i18n/foundations-copy.ts",
  "lib/foundations-swatches.ts",
  "components/zedkit-shadcn-faq.tsx",
  "components/i18n/zedkit-shadcn-faq-copy.ts",
  "lib/zedkit-shadcn-faq.ts",
];

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
  { id: "body", name: "Body text", hex: "#4E4E56", token: "--zk-site-body", hsl: "240 5% 32%" },
  { id: "ink", name: "Ink", hex: "#09090B", token: "--zk-site-ink", hsl: "240 10% 3.9%" },
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
  const typeSource = readApp(`${FOUNDATIONS_UI}/foundations-type.tsx`);
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
  const band = readApp(`${FOUNDATIONS_UI}/foundations-band.tsx`);
  assert.match(band, /not-prose/);
  assert.match(band, /data-foundations-band/);
  assert.doesNotMatch(band, /sm:grid-pair/);
  assert.doesNotMatch(band, /<div[\s>/]/);
  assert.doesNotMatch(band, /<span[\s>/]/);
});

test("guide wires Color and Type only and does not import dropped bands", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  for (const name of ["FoundationsColor", "FoundationsType", "FoundationsHero"]) {
    assert.match(
      mdx,
      new RegExp(`import \\{ ${name} \\} from "@/${FOUNDATIONS_UI}/foundations-`),
    );
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
  const color = readApp(`${FOUNDATIONS_UI}/foundations-color.tsx`);
  assert.doesNotMatch(color, /data-site-action/);
  assert.match(color, /ThemeScope identity="glass" mode="light"/);
  assert.match(color, /<ThemeScope identity="glass" mode="light">\{chip\}<\/ThemeScope>/);
  assert.doesNotMatch(color, /<ThemeScope identity="glass" mode="light">\{mark\}/);
  assert.doesNotMatch(color, /<ThemeScope[\s\S]*typeRole="label"[\s\S]*<\/ThemeScope>/);
  assert.doesNotMatch(color, /variant="glass"/);
  assert.doesNotMatch(color, /#[0-9A-Fa-f]{3,8}/);
  assert.match(color, /data-foundations-swatch/);
  assert.doesNotMatch(color, /md:grid-quad/);
});

test("guide title is Site foundations with Color and Type only", () => {
  const mdx = readApp("prose/guides/foundations.mdx");
  assert.match(mdx, /^title:\s*Site foundations\s*$/m);
  assert.match(mdx, /^hidePageTitle:\s*true\s*$/m);
  assert.match(mdx, /import \{ FoundationsHero \} from "@\/features\/docs\/guides\/foundations\/ui\/foundations-hero"/);
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
  const hero = readApp(`${FOUNDATIONS_UI}/foundations-hero.tsx`);
  const copy = readApp(`${FOUNDATIONS}/i18n/foundations-copy.ts`);
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
  assert.match(typography, /\[data-foundations-hero\][\s\S]{0,500}--foreground:\s*var\(--zk-site-ink\)/);
  assert.match(typography, /\[data-foundations-hero\][\s\S]{0,500}--muted-foreground:\s*var\(--zk-site-body\)/);
  assert.match(typography, /\[data-foundations-hero\][\s\S]{0,600}color:\s*hsl\(var\(--foreground\)\)/);
  assert.match(typography, /\[data-palette-dots\][\s\S]{0,300}repeat\(auto-fit, minmax\(/);
  assert.match(
    typography,
    /@media \(min-width:\s*90rem\)[\s\S]*?\[data-palette-dots\][\s\S]*?repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    typography,
    /@media \(min-width:\s*90rem\)[\s\S]*?\[data-palette-dots\][\s\S]*?min-width:\s*0/,
  );
  assert.match(
    typography,
    /\[data-foundations-swatch="body"\][\s\S]{0,80}background-color:\s*hsl\(var\(--zk-site-body\)\)/,
  );
  assert.match(
    typography,
    /\[data-foundations-swatch="ink"\][\s\S]{0,80}background-color:\s*hsl\(var\(--zk-site-ink\)\)/,
  );
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
  assert.match(headers, /SiteSearchTrigger className="lg:hidden"/);
  assert.match(headers, /SiteFullSearchTrigger className="max-lg:hidden"/);
  const tokens = readApp("app/docs-shell-tokens.css");
  assert.match(tokens, /#nd-docs-layout:not\(:has\(#nd-sidebar\)\)/);
  assert.match(tokens, /--fd-sidebar-col:\s*0px/);
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

test("guide-only modules left components/ and lib/", () => {
  for (const rel of OLD_GUIDE_PATHS) {
    assert.equal(existsSync(join(APP, rel)), false, `${rel} should be gone`);
  }
  const faqMdx = readApp("prose/guides/zedkit-and-shadcn.mdx");
  assert.match(
    faqMdx,
    new RegExp(`import \\{ ZedkitShadcnFaq \\} from "@/${ZEDKIT_SHADCN}/ui/zedkit-shadcn-faq"`),
  );
  assert.match(faqMdx, /<ZedkitShadcnFaq \/>/);
});

const AA = 4.5;
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"];
const MODES = ["light", "dark"];
const IDENTITY_DIR = join(ROOT, "packages/ui/src/identities");
const STYLES_PATH = join(ROOT, "packages/ui/src/styles.css");

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseTriplet(value) {
  const match = value.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) throw new Error(`not an H S% L% triplet: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance([r, g, b]) {
  const linear = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(fg, bg) {
  const [a, b] = [luminance(hslToRgb(...fg)), luminance(hslToRgb(...bg))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function ruleBody(css, selectorRe, label) {
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").replace(/\s+/g, " ").trim();
    if (selectorRe.test(selector)) return match[2] ?? "";
  }
  throw new Error(`missing rule ${label}`);
}

function tokenValue(body, name, label) {
  const match = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`--${name} missing from ${label}`);
  return match[1].trim();
}

function stylesThemeBody(theme) {
  const css = readFileSync(STYLES_PATH, "utf8");
  const parts = css.split(/\.dark\s*\{/);
  const body = theme === "light" ? parts[0] : parts[1];
  if (!body) throw new Error(`styles.css ${theme} block missing`);
  return body;
}

function identityPalette(id, mode) {
  if (id === "mist") {
    const body = stylesThemeBody(mode);
    const label = `mist ${mode} styles.css`;
    return {
      background: parseTriplet(tokenValue(body, "background", label)),
      foreground: parseTriplet(tokenValue(body, "foreground", label)),
      muted: parseTriplet(tokenValue(body, "muted", label)),
      mutedForeground: parseTriplet(tokenValue(body, "muted-foreground", label)),
    };
  }
  const css = readFileSync(join(IDENTITY_DIR, `${id}.css`), "utf8");
  let light;
  let dark;
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").replace(/\s+/g, " ").trim();
    const body = match[2] ?? "";
    if (!selector.includes(`data-identity="${id}"`)) continue;
    if (!body.includes("--muted-foreground:")) continue;
    if (selector.includes(".dark")) dark = body;
    else light = body;
  }
  const body = mode === "dark" ? dark : light;
  const label = `${id} ${mode}`;
  if (!body) throw new Error(`missing ${label} palette`);
  return {
    background: parseTriplet(tokenValue(body, "background", label)),
    foreground: parseTriplet(tokenValue(body, "foreground", label)),
    muted: parseTriplet(tokenValue(body, "muted", label)),
    mutedForeground: parseTriplet(tokenValue(body, "muted-foreground", label)),
  };
}

function siteShellTokens() {
  const css = readApp("app/docs-shell-tokens.css");
  const site = ruleBody(css, /^html\[data-docs-shell\]\[data-identity\]$/, "html docs-shell identity");
  return {
    band: parseTriplet(tokenValue(site, "zk-site-band", "site-band")),
    ink: parseTriplet(tokenValue(site, "zk-site-ink", "site-ink")),
    body: parseTriplet(tokenValue(site, "zk-site-body", "site-body")),
  };
}

function lightShellPage() {
  const css = readApp("app/docs-shell-tokens.css");
  const lightPage = ruleBody(
    css,
    /^html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\)$/,
    "light docs-shell page",
  );
  return {
    background: parseTriplet(tokenValue(lightPage, "background", "light page")),
    foreground: parseTriplet(tokenValue(lightPage, "foreground", "light page foreground")),
    muted: parseTriplet(tokenValue(lightPage, "muted", "light muted")),
    mutedForeground: parseTriplet(tokenValue(lightPage, "muted-foreground", "light muted-foreground")),
  };
}

function pageTokens(id, mode) {
  if (mode === "light") return lightShellPage();
  return identityPalette(id, mode);
}

test("foundations hero heading and intro contrast against the band in every look", () => {
  const site = siteShellTokens();
  const h1 = contrast(site.ink, site.band);
  const intro = contrast(site.body, site.band);
  assert.ok(h1 >= AA, `hero h1 vs band ${h1.toFixed(2)}`);
  assert.ok(intro >= AA, `hero intro vs band ${intro.toFixed(2)}`);
  const typography = readApp("app/docs-typography.css");
  const hero = ruleBody(
    stripComments(typography),
    /\[data-foundations-hero\]$/,
    "foundations hero",
  );
  assert.equal(tokenValue(hero, "foreground", "hero foreground"), "var(--zk-site-ink)");
  assert.equal(tokenValue(hero, "muted-foreground", "hero muted"), "var(--zk-site-body)");
  assert.match(hero, /color:\s*hsl\(var\(--foreground\)\)/);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      identityPalette(id, mode);
      assert.ok(h1 >= AA, `${id} ${mode} h1 still uses site ink`);
      assert.ok(intro >= AA, `${id} ${mode} intro still uses site body`);
    }
  }
});

test("foundations Color labels contrast against the page in dark in every look", () => {
  for (const id of IDENTITIES) {
    const page = pageTokens(id, "dark");
    const nameRatio = contrast(page.foreground, page.background);
    const hexRatio = contrast(page.mutedForeground, page.background);
    assert.ok(
      nameRatio >= AA,
      `${id} dark Color name ${nameRatio.toFixed(2)}:1 vs page background`,
    );
    assert.ok(
      hexRatio >= AA,
      `${id} dark Color hex ${hexRatio.toFixed(2)}:1 vs page background`,
    );
  }
});

test("catalog and component-page leads meet 4.5 on their own surfaces", () => {
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      const page = pageTokens(id, mode);
      const catalogLead = contrast(page.mutedForeground, page.muted);
      const catalogH1 = contrast(page.foreground, page.muted);
      const componentLead = contrast(page.mutedForeground, page.background);
      const componentH1 = contrast(page.foreground, page.background);
      assert.ok(
        catalogLead >= AA,
        `catalog lead ${id} ${mode} ${catalogLead.toFixed(2)}:1 vs muted`,
      );
      assert.ok(
        catalogH1 >= AA,
        `catalog h1 ${id} ${mode} ${catalogH1.toFixed(2)}:1 vs muted`,
      );
      assert.ok(
        componentLead >= AA,
        `component lead ${id} ${mode} ${componentLead.toFixed(2)}:1 vs page`,
      );
      assert.ok(
        componentH1 >= AA,
        `component h1 ${id} ${mode} ${componentH1.toFixed(2)}:1 vs page`,
      );
    }
  }
});

test("hero copy stays the outcome sentence and Color Type stay proof", () => {
  const hero = readApp(`${FOUNDATIONS_UI}/foundations-hero.tsx`);
  assert.doesNotMatch(hero, /want Color and Type on the first screens/);
  assert.match(hero, /Color \/ Type stay below as proof/);
  assert.equal(
    foundationsCopy.hero.intro,
    "White pages, zinc text, black actions. Color lives in panels, and glass sits on top of them.",
  );
});
