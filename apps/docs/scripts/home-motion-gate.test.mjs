import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const homeCss = "app/(home)/_home/home.css";
const homeIllustration = "app/(home)/_home/home-hero-illustration.tsx";
const homeRhythm = "app/(home)/_home/home-rhythm.ts";

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

test("illustration Pause and identity-looks fade follow the kit motion preference", () => {
  assert.equal(existsSync(join(app, "ui/home/use-motion-ok.ts")), false);
  const illustration = readApp(homeIllustration);
  const looks = readApp("app/(home)/_home/home-identity-looks.tsx");
  for (const src of [illustration, looks]) {
    assert.match(src, /from ["']@zedtech\/zedkit-ui["']/);
    assert.match(src, /useMotionPreference\(\) === ["']no-preference["']/);
    assert.doesNotMatch(src, /\buseMotionOk\b/);
    assert.doesNotMatch(src, /use-motion-ok/);
  }
});

test("home hero animation rules run only when motion is allowed", () => {
  const css = stripComments(readApp(homeCss));
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
  const css = readApp(homeCss);
  const illustration = readApp(homeIllustration);
  const rhythm = readApp(homeRhythm);
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
  assert.doesNotMatch(stripComments(css), /\.status-ping/);
  assert.match(illustration, /pulse=\{dot\.pulse && !paused && motionOk\}/);
  assert.doesNotMatch(live, /@keyframes zk-(?:up|in|drift|s[1-5])\b/);
  assert.doesNotMatch(live, /\bzk-s[1-5]\b/);
  assert.doesNotMatch(css, /\[data-hero-shapes\][^{]*\{[^}]*animation\s*:/);
  assert.doesNotMatch(stripComments(css), /\[data-hero-shapes\]/);
});

const HOME_SECTIONS = [
  "app/(home)/_home/sections/home-same-idea-section.tsx",
  "app/(home)/_home/sections/home-six-sentences-section.tsx",
  "app/(home)/_home/sections/home-paste-section.tsx",
  "app/(home)/_home/sections/home-identities-section.tsx",
  "app/(home)/_home/sections/home-limits-section.tsx",
  "app/(home)/_home/sections/home-manifesto-section.tsx",
  "app/(home)/_home/sections/home-closing-section.tsx",
];

test("home-rhythm names distinct appears instead of one section fade", () => {
  const rhythm = readApp(homeRhythm);
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
  const sameIdea = readApp("app/(home)/_home/sections/home-same-idea-section.tsx");
  const six = readApp("app/(home)/_home/sections/home-six-sentences-section.tsx");
  const paste = readApp("app/(home)/_home/sections/home-paste-section.tsx");
  const identities = readApp("app/(home)/_home/sections/home-identities-section.tsx");
  const looks = readApp("app/(home)/_home/home-identity-looks.tsx");
  const limits = readApp("app/(home)/_home/sections/home-limits-section.tsx");
  const manifesto = readApp("app/(home)/_home/sections/home-manifesto-section.tsx");
  const closing = readApp("app/(home)/_home/sections/home-closing-section.tsx");
  const illustration = readApp(homeIllustration);
  const mist = readApp("app/(home)/_home/home-identity-example-mist.tsx");
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
  const hero = readApp(homeCss);
  const compact = readApp("app/site-compact.css");
  const catalog = readApp("app/(site)/catalog/_catalog/catalog-shell.css");
  for (const css of [hero, compact, catalog]) {
    assert.doesNotMatch(css, /\*\s*\{[^{}]*animation:\s*none[^{}]*transition:\s*none/);
  }
});

test("illustration drift is decorative and does not wrap the glass card", () => {
  const illustration = readApp(homeIllustration);
  const css = readApp(homeCss);
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

test("visual contract states the chrome motion rule, not a later ticket", () => {
  const contract = readApp("VISUAL-CONTRACT.md");
  assert.match(contract, /named motions only/);
  assert.match(contract, /does not invent durations/);
  assert.match(contract, /One hero entrance/);
  assert.match(contract, /one pausable illustration/);
  assert.doesNotMatch(contract, /pausable (?:loop|tour)/);
  assert.match(contract, /Reduced motion shows the final state/);
  assert.doesNotMatch(contract, /motion ticket/);
});

test("visual contract allows illustration motion, not page-fill motion", () => {
  const contract = readApp("VISUAL-CONTRACT.md");
  assert.match(contract, /never on the page fill/);
  assert.match(contract, /glass illustration/);
  assert.match(contract, /paused illustration/);
  assert.doesNotMatch(contract, /guided cursor/);
  assert.doesNotMatch(contract, /Display row/);
  assert.match(contract, /_home\/home\.css/);
  assert.doesNotMatch(contract, /app\/home-hero\.css/);
});

test("home CSS is imported by the home page, not the root layout", () => {
  const page = readApp("app/(home)/page.tsx");
  const layout = readApp("app/layout.tsx");
  const homeLayout = readApp("app/(home)/layout.tsx");
  assert.match(page, /import ["']\.\/_home\/home\.css["']/);
  assert.doesNotMatch(layout, /home-hero\.css|_home\/home\.css/);
  assert.doesNotMatch(homeLayout, /home-hero\.css|_home\/home\.css/);
  assert.equal(existsSync(join(app, "app/home-hero.css")), false);
  assert.ok(existsSync(join(app, homeCss)));
});

function keyframesInner(css, name) {
  const match = css.match(new RegExp(`@keyframes\\s+${name}\\s*\\{`));
  if (!match || match.index === undefined) throw new Error(`missing @keyframes ${name}`);
  const open = match.index + match[0].length - 1;
  return blockFrom(css, open).inner;
}

function fromBlock(keyframes) {
  const match = /from\s*\{/.exec(keyframes);
  if (!match || match.index === undefined) throw new Error("missing from {} in keyframes");
  const open = match.index + match[0].length - 1;
  return blockFrom(keyframes, open).inner;
}

test("hero LCP path paints at full opacity: no settle on the band, rise is transform-only", () => {
  const hero = readApp("app/(home)/_home/home-hero.tsx");
  const css = stripComments(readApp(homeCss));
  assert.doesNotMatch(hero, /signatureMotionClass/);
  assert.doesNotMatch(hero, /motion-settle/);
  assert.doesNotMatch(css, /\[data-home-hero-band\][^{]*\{[^}]*animation\s*:/);
  const riseFrom = fromBlock(keyframesInner(css, "zk-home-hero-rise"));
  assert.doesNotMatch(riseFrom, /opacity\s*:/);
  assert.match(riseFrom, /transform:\s*translateY\(/);
  const allowed = eachNoPreferenceBlock(css).join("\n");
  assert.doesNotMatch(allowed, /\[data-home-hero-lead\]\s*>\s*\*/);
  assert.match(allowed, /\[data-home-hero-lead\]\s*>\s*:nth-child\(\s*n\s*\+\s*2\s*\)/);
  assert.match(allowed, /zk-home-hero-rise/);
});

test("home CSS keeps live hero rules and drops retired tour selectors", () => {
  const css = stripComments(readApp(homeCss));
  assert.match(css, /#home-page \[data-home-hero/);
  assert.match(css, /\[data-hero-run-/);
  assert.match(css, /@keyframes zk-home-hero-rise/);
  assert.match(css, /@keyframes zk-home-float/);
  assert.match(css, /\[data-hero-run-drift\]/);
  assert.doesNotMatch(css, /\[data-hero-agent-panel\]/);
  assert.doesNotMatch(css, /\[data-hero-satellite/);
  assert.doesNotMatch(css, /\[data-hero-cursor\]/);
  assert.doesNotMatch(css, /\[data-hero-page/);
  assert.doesNotMatch(css, /\[data-hero-nav-item\]/);
  assert.doesNotMatch(css, /\[data-hero-bar/);
  assert.doesNotMatch(css, /\[data-hero-avatar\]/);
  assert.doesNotMatch(css, /\[data-hero-calendar\]/);
  assert.doesNotMatch(css, /\[data-hero-team-split\]/);
  assert.doesNotMatch(css, /\[data-hero-demo-fields\]/);
  assert.doesNotMatch(css, /\[data-hero-float\]/);
  assert.doesNotMatch(css, /\[data-hero-drift\]/);
  assert.doesNotMatch(css, /\[data-hero-panel-drift/);
  assert.doesNotMatch(css, /\[data-hero-crumb\]/);
  assert.doesNotMatch(css, /\[data-hero-shapes\]/);
  assert.doesNotMatch(css, /@keyframes zk-home-rise\b/);
  assert.doesNotMatch(css, /@keyframes zk-home-slide\b/);
  assert.doesNotMatch(css, /@keyframes zk-home-grow\b/);
  assert.doesNotMatch(css, /@keyframes zk-home-ring\b/);
  assert.doesNotMatch(css, /@keyframes zk-home-pop\b/);
  assert.doesNotMatch(css, /@keyframes zk-home-drift\b/);
});

function pageLinksHomeCssToken(htmlRel) {
  const html = readFileSync(join(app, "out", htmlRel), "utf8");
  if (html.includes("zk-home-hero-rise")) return true;
  const hrefs = [...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    const css = readFileSync(join(app, "out", href), "utf8");
    if (css.includes("zk-home-hero-rise")) return true;
  }
  return false;
}

test("built home export references home CSS; catalog does not", (t) => {
  const homeHtml = join(app, "out", "index.html");
  const catalogHtml = join(app, "out", "catalog.html");
  if (!existsSync(homeHtml) || !existsSync(catalogHtml)) {
    t.skip("docs export missing; run after build");
    return;
  }
  assert.equal(pageLinksHomeCssToken("index.html"), true);
  assert.equal(pageLinksHomeCssToken("catalog.html"), false);
});
