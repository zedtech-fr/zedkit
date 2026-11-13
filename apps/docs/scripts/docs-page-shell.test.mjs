import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(rel.startsWith("packages/") ? root : app, rel), "utf8");
}

test("docs shell drops the page radial on every site route", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /html\[data-docs-shell\]/);
  assert.match(css, /background-image:\s*none/);
  assert.doesNotMatch(css, /body:has\(#nd-docs-layout\)/);
  assert.doesNotMatch(css, /body:has\(\[data-catalog-shell\]\)/);
});

test("docs shell pins white page fill, 1200px measure, and 24px gutter", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /--zk-site-page:\s*0 0% 100%/);
  assert.match(css, /--zk-site-band:\s*0 0% 98%/);
  assert.match(css, /--zk-site-ink:\s*240 10% 3\.9%/);
  assert.match(css, /--zk-site-body:\s*240 5% 32%/);
  assert.match(css, /--zk-container-default:\s*75rem/);
  assert.match(css, /--zk-container-wide:\s*75rem/);
  assert.match(css, /--zk-page-gutter:\s*1\.5rem/);
  assert.doesNotMatch(css, /--zk-container-default:\s*72\.5rem/);
});

test("docs shell display and section type match the mockup", () => {
  const css = read("app/docs-typography.css");
  assert.match(css, /--zk-type-h1-size:\s*3rem/);
  assert.match(css, /--zk-type-h1-weight:\s*500/);
  assert.match(css, /--zk-type-h2-size:\s*1\.875rem/);
  assert.match(css, /--zk-type-h2-weight:\s*500/);
  assert.match(css, /max-width:\s*390px/);
  assert.match(css, /font-family:\s*var\(--zk-font-sans\)/);
  assert.match(css, /:not\(\[data-identity-scope\] \*\)/);
});

test("site-action class pins stock near-black primary", () => {
  const css = `${read("app/docs-shell-tokens.css")}\n${read("app/site-compact.css")}`;
  assert.match(css, /\.site-action/);
  assert.match(css, /240 5\.9% 10%/);
  assert.match(css, /:not\(\.site-action\)/);
});

test("Glass identity tokens stay on the kit sheet", () => {
  const glass = read("packages/ui/src/identities/glass.css");
  assert.match(glass, /--zk-bg-pattern:/);
  assert.match(glass, /--zk-font-display:\s*"Space Grotesk Variable"/);
});

test("docs shell pins yield for a custom identity so Classic edits can paint the site", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\) body/);
  assert.match(css, /html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\) \{/);
  assert.match(css, /:root\[data-identity\]:not\(\[data-identity="custom"\]\) \{/);
  assert.match(css, /html\[data-docs-shell\]\[data-identity="custom"\] body/);
  assert.match(css, /background-image:\s*none/);
  assert.match(css, /background-color:\s*hsl\(var\(--background\)\)/);
  assert.doesNotMatch(css, /html\[data-docs-shell\]:not\(\.dark\) body \{/);
  assert.doesNotMatch(css, /html\[data-docs-shell\]:not\(\.dark\) \{/);
  assert.doesNotMatch(css, /:root\[data-identity\] \{/);
});

function captureAfter(css, needle, token) {
  const idx = css.indexOf(needle);
  assert.notEqual(idx, -1, `missing ${needle}`);
  const slice = css.slice(idx, idx + 1200);
  const match = slice.match(new RegExp(`${token}:\\s*([^;]+);`));
  assert.ok(match, `missing ${token} after ${needle}`);
  return match[1].trim();
}

function evalCssClamp(expr, viewportPx) {
  const match = expr.match(
    /clamp\(\s*([\d.]+)rem,\s*([\d.]+)rem\s*\+\s*([\d.]+)vw,\s*([\d.]+)rem\s*\)/,
  );
  assert.ok(match, `expected clamp(rem, rem + vw, rem), got ${expr}`);
  const min = Number(match[1]) * 16;
  const preferred = Number(match[2]) * 16 + (Number(match[3]) * viewportPx) / 100;
  const max = Number(match[4]) * 16;
  return Math.min(max, Math.max(min, preferred));
}

test("home pins mockup section rhythm on #home-page tokens", () => {
  const compact = read("app/site-compact.css");
  assert.match(compact, /#home-page[\s\S]{0,400}--zk-section-md:\s*5\.5rem/);
  assert.match(compact, /#home-page[\s\S]{0,400}--zk-section-lg:\s*6rem/);
  assert.match(compact, /--zk-heading-to-sub:\s*0\.5rem/);
  const hero = read("app/(home)/_home/home.css");
  assert.match(hero, /--zk-home-hero-stack:\s*4rem/);
  assert.match(hero, /padding-top:\s*var\(--zk-section-md\)/);
  assert.match(hero, /padding-bottom:\s*var\(--zk-section-lg\)/);
  assert.match(hero, /row-gap:\s*var\(--zk-home-hero-stack\)/);
  assert.doesNotMatch(hero, /padding-block:\s*3\.5rem\s+4rem/);
  assert.doesNotMatch(hero, /#home-page \[data-home-hero-band\][\s\S]{0,200}padding-top:\s*1\.25rem/);
  const typography = read("app/docs-typography.css");
  assert.match(
    typography,
    /#home-page \[data-slot="section"\] h2\[data-slot="heading"\] \+ \[data-slot="text"\][\s\S]{0,200}margin-top:\s*var\(--zk-heading-to-sub\)/,
  );
  assert.match(
    typography,
    /@media \(max-width:\s*390px\)[\s\S]{0,400}#home-page \[data-slot="section"\] h2\[data-slot="heading"\] \+ \[data-slot="text"\][\s\S]{0,200}font-size:\s*var\(--zk-home-band-sub-size\)/,
  );
  const closing = read("app/(home)/_home/sections/home-closing-section.tsx");
  assert.match(closing, /spacing="lg"/);
  const lead = read("app/(home)/_home/home-hero-lead.tsx");
  assert.match(lead, /gap="list"/);
  assert.doesNotMatch(lead, /gap="blocks"/);
});

test("marketing roots drop the extra 24px gutter at 1440 so the measure is 1200px", () => {
  const css = read("app/docs-shell-tokens.css");
  assert.match(css, /--zk-page-gutter:\s*1\.5rem/);
  assert.match(css, /@media \(min-width:\s*90rem\)/);
  assert.match(css, /#home-page[\s\S]{0,200}--zk-page-gutter:\s*0/);
  assert.match(css, /\[data-catalog-shell\][\s\S]{0,200}--zk-page-gutter:\s*0/);
  const gutterAtWide = css.match(
    /@media \(min-width:\s*90rem\) \{([^}]+(?:\{[^}]+\})?[^}]+)\}/,
  );
  assert.ok(gutterAtWide, "90rem gutter rule");
  assert.match(gutterAtWide[0], /#home-page/);
  assert.match(gutterAtWide[0], /\[data-catalog-shell\]/);
  assert.doesNotMatch(gutterAtWide[0], /#nd-page/);
});

test("docs shell 390 lead beats the kit 15px cap; home band-sub and persuasion match the mockup", () => {
  const kit = read("packages/ui/src/shared-type-scale.css");
  assert.match(kit, /@media \(max-width:\s*390px\)/);
  assert.match(kit, /--zk-type-lead-size:\s*0\.9375rem/);
  const css = read("app/docs-typography.css");
  const phone = css.match(/@media \(max-width:\s*390px\) \{[\s\S]{0,800}/);
  assert.ok(phone, "docs-shell 390 type rule");
  assert.match(phone[0], /html\[data-docs-shell\]\[data-identity\]/);
  assert.match(phone[0], /--zk-type-lead-size:\s*1\.125rem/);
  assert.match(phone[0], /--zk-type-lead-leading:\s*1\.55/);
  assert.match(phone[0], /--zk-home-band-sub-size:\s*1rem/);
  assert.match(phone[0], /--zk-home-band-sub-leading:\s*1\.55/);
  assert.match(phone[0], /--zk-home-persuasion-font-size:\s*0\.9375rem/);
  assert.match(phone[0], /--zk-home-persuasion-leading:\s*1\.55/);
  assert.doesNotMatch(phone[0], /--zk-type-h1-size:\s*3rem/);
});

test("home display clamp scales at 375 / 809 / 1440; foundations stay 48px", () => {
  const css = read("app/docs-typography.css");
  assert.match(css, /html\[data-docs-shell\]\[data-identity\][\s\S]{0,400}--zk-type-h1-size:\s*3rem/);
  const homeClamp = captureAfter(css, "#home-page {", "--zk-type-h1-size");
  assert.equal(Math.round(evalCssClamp(homeClamp, 375)), 34);
  assert.ok(Math.abs(evalCssClamp(homeClamp, 809) - 43.4) < 0.5);
  assert.equal(evalCssClamp(homeClamp, 1440), 48);
  assert.match(css, /#home-page[\s\S]{0,400}--zk-type-h1-leading:\s*1\.08/);
  assert.match(css, /#home-page[\s\S]{0,400}--zk-type-h1-tracking:\s*-0\.035em/);
  const docsClamp = captureAfter(css, "#nd-page {", "--zk-type-doc-h1-size");
  assert.equal(Math.round(evalCssClamp(docsClamp, 375)), 28);
  assert.equal(evalCssClamp(docsClamp, 1440), 36);
});

test("docs shell remaps light greys to stock zinc, not Glass blue", () => {
  const css = read("app/docs-shell-tokens.css");
  const block = css.match(
    /html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\) \{([^}]+)\}/,
  );
  assert.ok(block, "light non-custom remap block");
  const body = block[1];
  assert.match(body, /--muted:\s*240 4\.8% 95\.9%/);
  assert.match(body, /--secondary:\s*240 4\.8% 95\.9%/);
  assert.match(body, /--sidebar-border:\s*240 5\.9% 90%/);
  assert.match(body, /--border:\s*240 5\.9% 90%/);
  assert.doesNotMatch(body, /220 40% 94%/);
  assert.doesNotMatch(body, /220 45% 92%/);
  assert.doesNotMatch(body, /220 35% 85%/);
  const glass = read("packages/ui/src/identities/glass.css");
  assert.match(glass, /--muted:\s*220 40% 94%/);
  assert.match(glass, /--secondary:\s*220 45% 92%/);
  assert.match(glass, /--sidebar-border:\s*220 35% 85%/);
});

test("home mobile page height budget allows mockup air", () => {
  const src = read("app/(home)/_home/home-rhythm.ts");
  assert.match(src, /HOME_MOBILE_PAGE_MAX_SCROLL_PX = 10200/);
});

test("fumadocs heading copy buttons keep a 24px floor under dense looks", () => {
  const css = read("app/docs-typography.css");
  const rule = css.match(/#nd-page :is\(h2, h3, h4, h5, h6\) > button \{([^}]+)\}/);
  assert.ok(rule, "heading copy button rule");
  assert.match(rule[1], /min-width:\s*max\(24px,\s*var\(--zk-tap-min,\s*0px\)\)/);
  assert.match(rule[1], /min-height:\s*max\(24px,\s*var\(--zk-tap-min,\s*0px\)\)/);
});
