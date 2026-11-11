import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(app, rel), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** sRGB relative luminance (WCAG 2). Channels are 0–255. */
function relativeLuminance([r, g, b]) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToRgb(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return (light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255;
  };
  return [f(0), f(8), f(4)];
}

function parseHsl(value) {
  const match = value.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i);
  assert.ok(match, `expected hsl() colour, got ${value}`);
  return hslToRgb(Number(match[1]), Number(match[2]), Number(match[3]));
}

function tokenValue(css, name) {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  assert.ok(match, `missing token ${name}`);
  return match[1].trim();
}

function shikiDarkColours(css, selectorNeedle) {
  const colours = [];
  const re = /([^{}]+)\{([^{}]+)\}/g;
  let block;
  while ((block = re.exec(css))) {
    const selector = block[1];
    if (!selector.includes(selectorNeedle)) continue;
    for (const decl of block[2].matchAll(/--shiki-dark:\s*(hsl\([^)]+\))/g)) {
      colours.push(decl[1]);
    }
  }
  return colours;
}

test("primary preview stage uses pinned gradient tokens", () => {
  const css = read("app/docs-component-page.css");
  assert.match(css, /\[data-component-preview="primary"\]/);
  assert.match(css, /\[data-preview-stage\]/);
  assert.match(css, /--zk-preview-stage-from:/);
  assert.match(css, /--zk-preview-stage-via:/);
  assert.match(css, /--zk-preview-stage-to:/);
  assert.match(css, /linear-gradient/);
  assert.match(css, /\[data-component-page\]/);
  assert.doesNotMatch(css, /#[0-9A-Fa-f]{3,8}\b/);
});

test("component-page usage and preview code wells are dark and scoped", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  assert.match(css, /--zk-code-well:/);
  assert.match(css, /#usage-and-states/);
  assert.match(css, /\[data-preview-code-panel\]/);
  const re = /([^{}]+)\{([^{}]+)\}/g;
  let sawWell = false;
  let block;
  while ((block = re.exec(css))) {
    if (!block[2].includes("var(--zk-code-well)")) continue;
    sawWell = true;
    assert.match(block[1], /\[data-component-page\]/, `code-well rule must be scoped: ${block[1].trim()}`);
  }
  assert.equal(sawWell, true, "expected a code-well background on the component page");
});

test("component-page stage CSS does not restyle specimens with !important", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  const re = /([^{}]+)\{([^{}]+)\}/g;
  let block;
  while ((block = re.exec(css))) {
    const selector = block[1];
    const body = block[2];
    if (!body.includes("!important")) continue;
    assert.match(
      selector,
      /:not\(\[data-identity-scope\] \*\)/,
      `!important on ${selector.trim()} must exclude identity scopes`,
    );
  }
});

test("reduced-transparency drops stage halos", () => {
  const css = read("app/docs-component-page.css");
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.doesNotMatch(css, /@keyframes|animation-name:/);
});

test("dark syntax remaps on component-page wells meet WCAG AA against the well", () => {
  const pageCss = read("app/docs-component-page.css");
  const syntax = stripComments(read("app/code-syntax.css"));
  const well = parseHsl(`hsl(${tokenValue(pageCss, "--zk-code-well")})`);
  const htmlDark = shikiDarkColours(syntax, "html.dark figure.shiki");
  const islandDark = shikiDarkColours(syntax, "figure.shiki.dark");
  const pageDark = shikiDarkColours(syntax, "[data-component-page]");
  assert.ok(htmlDark.length >= 8, "html.dark remaps every syntax role");
  assert.deepEqual(new Set(islandDark), new Set(htmlDark));
  assert.deepEqual(new Set(pageDark), new Set(htmlDark));
  for (const colour of htmlDark) {
    const ratio = contrastRatio(parseHsl(colour), well);
    assert.ok(ratio >= 4.5, `${colour} on code well is ${ratio.toFixed(2)}:1`);
  }
});
