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
  const illustration = readApp("ui/home/home-hero-illustration.tsx");
  const rhythm = readApp("ui/home/home-rhythm.ts");
  const live = `${css}\n${illustration}\n${rhythm}`;
  // zk-up → lead rise; zk-in → glass stage; zk-s1…s5 → zk-home-run-* steps (not mockup names).
  assert.match(css, /@keyframes zk-home-hero-rise/);
  assert.match(css, /@keyframes zk-home-window-in/);
  assert.match(css, /@keyframes zk-home-run-plan/);
  assert.match(css, /@keyframes zk-home-run-build/);
  assert.match(css, /@keyframes zk-home-run-check/);
  assert.match(css, /@keyframes zk-home-run-fix/);
  assert.match(css, /@keyframes zk-home-run-done/);
  assert.match(rhythm, /"data-animate": "fade-up"/);
  assert.match(illustration, /data-hero-run-stage/);
  assert.match(illustration, /data-hero-run-step/);
  assert.match(css, /animation-play-state:\s*paused/);
  assert.doesNotMatch(live, /@keyframes zk-(?:up|in|drift|s[1-5])\b/);
  assert.doesNotMatch(live, /\bzk-s[1-5]\b/);
  assert.doesNotMatch(css, /\[data-hero-shapes\][^{]*\{[^}]*animation\s*:/);
});

test("illustration drift is decorative and does not wrap the glass card", () => {
  const illustration = readApp("ui/home/home-hero-illustration.tsx");
  assert.match(illustration, /data-hero-run-drift/);
  assert.match(illustration, /aria-hidden="true"/);
  assert.doesNotMatch(illustration, /<(?:input)\b/);
  assert.equal(illustration.includes("data-hero-shapes"), false);
  assert.doesNotMatch(illustration, /IdentityLookForm|AgentConsole/);
});

test("foundations motion copy states the live rule, not a later ticket", () => {
  const copy = readApp("components/i18n/foundations-copy.ts");
  assert.match(copy, /motion:\s*"Chrome uses named motions only\./);
  assert.match(copy, /does not invent durations/);
  assert.match(copy, /One hero entrance/);
  assert.match(copy, /one pausable illustration/);
  assert.doesNotMatch(copy, /pausable (?:loop|tour)/);
  assert.match(copy, /Reduced motion shows the final state/);
  assert.doesNotMatch(copy, /motion ticket/);
});

test("visual contract allows illustration motion, not page-fill motion", () => {
  const contract = readApp("VISUAL-CONTRACT.md");
  assert.match(contract, /never on the page fill/);
  assert.match(contract, /glass illustration/);
  assert.match(contract, /paused illustration/);
  assert.doesNotMatch(contract, /guided cursor/);
  assert.doesNotMatch(contract, /Display row/);
});
