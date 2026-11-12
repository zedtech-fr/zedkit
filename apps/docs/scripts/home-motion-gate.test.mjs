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
  assert.match(illustration, /data-hero-run-stage/);
  assert.match(illustration, /data-hero-run-step/);
  assert.match(css, /animation-play-state:\s*paused/);
  assert.doesNotMatch(live, /@keyframes zk-(?:up|in|drift|s[1-5])\b/);
  assert.doesNotMatch(live, /\bzk-s[1-5]\b/);
  assert.doesNotMatch(css, /\[data-hero-shapes\][^{]*\{[^}]*animation\s*:/);
});

const HOME_SECTIONS = [
  "ui/home/home-same-idea-section.tsx",
  "ui/home/home-six-sentences-section.tsx",
  "ui/home/home-paste-section.tsx",
  "ui/home/home-identities-section.tsx",
  "ui/home/home-limits-section.tsx",
  "ui/home/home-manifesto-section.tsx",
  "ui/home/home-closing-section.tsx",
];

test("home-rhythm names distinct appears instead of one section fade", () => {
  const rhythm = readApp("ui/home/home-rhythm.ts");
  assert.doesNotMatch(rhythm, /HOME_SECTION_REVEAL_PROPS/);
  assert.match(rhythm, /HOME_CARD_GRID_REVEAL_PROPS/);
  assert.match(rhythm, /HOME_PASTE_TIMELINE_REVEAL_PROPS/);
  assert.match(rhythm, /HOME_READING_REVEAL_PROPS/);
  assert.match(rhythm, /HOME_PARALLAX_SCROLL_PROPS/);
  assert.match(rhythm, /"data-animate": "fade-up"/);
  assert.match(rhythm, /"data-animate": "fade-down"/);
  assert.match(rhythm, /"data-animate": "fade-in"/);
  assert.match(rhythm, /"data-animate-stagger": ""/);
  assert.match(rhythm, /"data-animate-scroll": "parallax"/);
});

test("each home band has one appear or scroll, never on Section", () => {
  const sameIdea = readApp("ui/home/home-same-idea-section.tsx");
  const six = readApp("ui/home/home-six-sentences-section.tsx");
  const paste = readApp("ui/home/home-paste-section.tsx");
  const identities = readApp("ui/home/home-identities-section.tsx");
  const looks = readApp("ui/home/home-identity-looks.tsx");
  const limits = readApp("ui/home/home-limits-section.tsx");
  const manifesto = readApp("ui/home/home-manifesto-section.tsx");
  const closing = readApp("ui/home/home-closing-section.tsx");
  const illustration = readApp("ui/home/home-hero-illustration.tsx");
  const mist = readApp("ui/home/home-identity-example-mist.tsx");
  for (const rel of HOME_SECTIONS) {
    const src = readApp(rel);
    assert.doesNotMatch(src, /HOME_SECTION_REVEAL_PROPS/);
    const start = src.indexOf("<Section");
    assert.notEqual(start, -1, rel);
    const end = src.indexOf(">", start);
    const open = src.slice(start, end + 1);
    assert.doesNotMatch(open, /data-animate|HOME_\w*REVEAL|HOME_PARALLAX/);
  }
  assert.match(sameIdea, /HOME_CARD_GRID_REVEAL_PROPS/);
  assert.match(six, /HOME_CARD_GRID_REVEAL_PROPS/);
  assert.match(paste, /HOME_PASTE_TIMELINE_REVEAL_PROPS/);
  assert.match(limits, /HOME_READING_REVEAL_PROPS/);
  assert.match(manifesto, /HOME_READING_REVEAL_PROPS/);
  assert.match(closing, /HOME_READING_REVEAL_PROPS/);
  assert.doesNotMatch(identities, /data-animate|HOME_\w*REVEAL|HOME_PARALLAX/);
  assert.match(looks, /data-identity-frame-stage=/);
  assert.match(looks, /HOME_PARALLAX_SCROLL_PROPS|data-animate-scroll="parallax"/);
  assert.match(illustration, /HOME_PARALLAX_SCROLL_PROPS|data-animate-scroll="parallax"/);
  assert.doesNotMatch(
    illustration,
    /data-hero-run-stage=""[^>]*data-animate-scroll|data-animate-scroll[^>]*data-hero-run-stage/,
  );
  assert.match(sameIdea, /<Card className="[^"]*hover-lift/);
  assert.match(six, /hover-lift/);
  // Plain six-sentences cards have no focusables: hover-lift is mouse-only delight.
  assert.match(six, /data-home-six-sentences-card=\{featured \? "featured" : "plain"\}/);
  assert.doesNotMatch(mist, /hover-lift/);
  assert.doesNotMatch(limits, /hover-lift/);
});

test("docs CSS does not use the mockup star reduced-motion kill", () => {
  const hero = readApp("app/home-hero.css");
  const compact = readApp("app/site-compact.css");
  const catalog = readApp("app/catalog-shell.css");
  for (const css of [hero, compact, catalog]) {
    assert.doesNotMatch(css, /\*\s*\{[^{}]*animation:\s*none[^{}]*transition:\s*none/);
  }
});

test("illustration drift is decorative and does not wrap the glass card", () => {
  const illustration = readApp("ui/home/home-hero-illustration.tsx");
  const css = readApp("app/home-hero.css");
  assert.match(illustration, /data-hero-run-drift/);
  assert.match(illustration, /aria-hidden="true"/);
  const parallaxOpen = illustration.indexOf("{...HOME_PARALLAX_SCROLL_PROPS}");
  assert.notEqual(parallaxOpen, -1);
  const parallaxBlock = illustration.slice(parallaxOpen, illustration.indexOf("{kit ==="));
  assert.match(parallaxBlock, /aria-hidden="true"/);
  assert.doesNotMatch(parallaxBlock, /<Button\b/);
  assert.doesNotMatch(illustration, /<(?:input)\b/);
  assert.equal(illustration.includes("data-hero-shapes"), false);
  assert.doesNotMatch(illustration, /IdentityLookForm|AgentConsole/);
  assert.match(css, /hsl\(var\(--primary-foreground\) \/ 0\.1\)/);
  assert.doesNotMatch(css, /hsl\(0 0% 100%/);
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
