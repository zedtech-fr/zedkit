import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

function readApp(rel) {
  return readFileSync(join(app, rel), "utf8");
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

function spanFrom(src, openIndex, openCh = "{", closeCh = "}") {
  let depth = 0;
  for (let i = openIndex; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === openCh) depth += 1;
    else if (ch === closeCh) {
      depth -= 1;
      if (depth === 0) return { inner: src.slice(openIndex + 1, i), end: i + 1 };
    }
  }
  throw new Error(`unbalanced ${openCh}${closeCh}`);
}

function blockFrom(src, openBraceIndex) {
  return spanFrom(src, openBraceIndex);
}

function functionBody(src, name) {
  const head = src.search(new RegExp(`function ${name}\\b`));
  if (head < 0) throw new Error(`missing function ${name}`);
  const paren = src.indexOf("(", head);
  const afterParams = spanFrom(src, paren, "(", ")").end;
  const open = src.indexOf("{", afterParams);
  return blockFrom(src, open).inner;
}

function eachNoPreferenceBlock(src) {
  const re = /@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{/g;
  const blocks = [];
  let match;
  while ((match = re.exec(src))) {
    const open = match.index + match[0].length - 1;
    blocks.push(blockFrom(src, open).inner);
  }
  return blocks;
}

function withoutBlock(src, re) {
  const pattern = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let out = src;
  let match = pattern.exec(out);
  while (match) {
    const open = match.index + match[0].length - 1;
    const { end } = blockFrom(out, open);
    out = `${out.slice(0, match.index)}${out.slice(end)}`;
    pattern.lastIndex = 0;
    match = pattern.exec(out);
  }
  return out;
}

function withoutNoPreferenceMedia(src) {
  return withoutBlock(src, /@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{/g);
}

function withoutDataMotionGate(src) {
  return withoutBlock(src, /:root:not\(\[data-motion="reduce"\]\)\s*\{/g);
}

/** Shorthand and longhand. An ungated `transition:` or `animation-name:` must fail. */
const MOTION_DECL = /(?:^|[{;}])\s*(?:animation(?:-[a-z]+)?|transition(?:-[a-z]+)?)\s*:/;

test("useMotionOk reads the kit preference and is still false on the server", () => {
  const src = readApp("ui/home/use-motion-ok.ts");
  assert.match(src, /from ["']@zedtech\/zedkit-ui["']/);
  assert.match(src, /useMotionPreference/);
  assert.match(src, /===\s*["']no-preference["']/);
  assert.doesNotMatch(src, /matchMedia/);
  assert.doesNotMatch(src, /useSyncExternalStore/);
});

test("home hero animation rules run only when motion is allowed", () => {
  const css = stripComments(readApp("app/home-hero.css"));
  const allowed = eachNoPreferenceBlock(css);
  assert.ok(allowed.length >= 1, "expected prefers-reduced-motion: no-preference blocks");
  for (const block of allowed) {
    assert.match(block, /:root:not\(\[data-motion="reduce"\]\)/);
    assert.match(block, MOTION_DECL);
    const ungated = withoutDataMotionGate(block);
    assert.doesNotMatch(ungated, MOTION_DECL);
    assert.doesNotMatch(block, /\[data-hero-shapes\]/);
  }
  const rest = withoutNoPreferenceMedia(css);
  assert.doesNotMatch(rest, MOTION_DECL);
  assert.doesNotMatch(rest, /(?:^|[,{\s])(?:html|body)(?:\s|,|\{)[^{]*animation\s*:/);
});

test("mockup motion jobs map onto live names, not a rebuilt run", () => {
  const css = readApp("app/home-hero.css");
  const preview = readApp("ui/home/home-hero-preview.tsx");
  const rhythm = readApp("ui/home/home-rhythm.ts");
  const agent = readApp("ui/home/home-hero-agent-panel.tsx");
  const live = `${css}\n${preview}\n${rhythm}\n${agent}`;
  // zk-up → lead rise + band fade-up; zk-in → window; zk-drift → interior float; zk-s1…s5 → agent data-state.
  assert.match(css, /@keyframes zk-home-hero-rise/);
  assert.match(css, /@keyframes zk-home-window-in/);
  assert.match(rhythm, /"data-animate": "fade-up"/);
  assert.match(preview, /data-hero-panel-drift/);
  assert.match(preview, /animate-float/);
  assert.match(agent, /data-state=\{state\}/);
  assert.doesNotMatch(live, /@keyframes zk-(?:up|in|drift|s[1-5])\b/);
  assert.doesNotMatch(live, /\bzk-s[1-5]\b/);
  assert.doesNotMatch(css, /\[data-hero-shapes\][^{]*\{[^}]*animation\s*:/);
});

test("interior panel drift is decorative and does not wrap the window", () => {
  const preview = readApp("ui/home/home-hero-preview.tsx");
  const drift = functionBody(preview, "HeroPanelDrift");
  const stage = functionBody(preview, "HeroSpecimenStage");
  assert.match(
    drift,
    /<span[^>]*aria-hidden="true"[^>]*data-hero-panel-drift/,
  );
  assert.match(drift, /\binert\b/);
  assert.doesNotMatch(drift, /<(?:a|button|input)\b/);
  const driftUse = stage.indexOf("<HeroPanelDrift");
  const childrenUse = stage.indexOf("{children}");
  assert.ok(driftUse >= 0 && childrenUse >= 0);
  assert.ok(driftUse < childrenUse, "drift sits behind the window, not around it");
  assert.equal(preview.includes("data-hero-shapes"), false);
});

test("foundations motion copy states the live rule, not a later ticket", () => {
  const copy = readApp("components/i18n/foundations-copy.ts");
  assert.match(copy, /motion:\s*"Chrome uses named motions only\./);
  assert.match(copy, /does not invent durations/);
  assert.match(copy, /One hero entrance/);
  assert.match(copy, /one pausable tour/);
  assert.doesNotMatch(copy, /pausable loop/);
  assert.match(copy, /Reduced motion shows the final state/);
  assert.doesNotMatch(copy, /motion ticket/);
});

test("visual contract allows interior panel drift, not page-fill motion", () => {
  const contract = readApp("VISUAL-CONTRACT.md");
  assert.match(contract, /interior panel blob/);
  assert.match(contract, /never on the page fill/);
  assert.match(contract, /loops live on the decorative cards and one interior panel blob/);
  assert.match(contract, /scroll-driven motion stays on the cards/);
});
