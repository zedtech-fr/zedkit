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

function* eachBlock(css) {
  const re = /([^{}]+)\{([^{}]+)\}/g;
  let block;
  while ((block = re.exec(css))) {
    yield { selector: block[1], body: block[2] };
  }
}

function shikiDarkColours(css, selectorNeedle) {
  const colours = [];
  for (const { selector, body } of eachBlock(css)) {
    if (!selector.includes(selectorNeedle)) continue;
    for (const decl of body.matchAll(/--shiki-dark:\s*(hsl\([^)]+\))/g)) {
      colours.push(decl[1]);
    }
  }
  return colours;
}

function colourCounts(colours) {
  const counts = {};
  for (const colour of colours) {
    counts[colour] = (counts[colour] ?? 0) + 1;
  }
  return counts;
}

test("primary preview stage uses pinned gradient tokens", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  assert.match(css, /\[data-component-preview="primary"\]/);
  assert.match(css, /\[data-preview-stage\]/);
  assert.match(css, /--zk-preview-stage-from:/);
  assert.match(css, /--zk-preview-stage-via:/);
  assert.match(css, /--zk-preview-stage-to:/);
  assert.match(css, /linear-gradient/);
  assert.match(css, /\[data-component-page\]/);
  assert.doesNotMatch(css, /#[0-9A-Fa-f]{3,8}\b/);

  let sawStage = false;
  for (const { selector, body } of eachBlock(css)) {
    if (!selector.includes('[data-component-preview="primary"]')) continue;
    if (!selector.includes("[data-preview-stage]")) continue;
    if (selector.includes("prefers-reduced-transparency")) continue;
    if (!body.includes("overflow:")) continue;
    sawStage = true;
    assert.match(selector, /\[data-component-page\]/, `stage rule must be page-scoped: ${selector.trim()}`);
    assert.match(body, /overflow:\s*clip/);
    assert.doesNotMatch(body, /overflow:\s*hidden/);
  }
  assert.equal(sawStage, true, "expected a primary stage overflow rule");
});

test("primary centered surface is #example-qualified so it beats width:100%", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  let sawCenter = false;
  for (const { selector, body } of eachBlock(css)) {
    if (!selector.includes("[data-preview-center]")) continue;
    sawCenter = true;
    assert.match(selector, /#nd-page/, `centering must include #nd-page: ${selector.trim()}`);
    assert.match(selector, /#example/, `centering must include #example: ${selector.trim()}`);
    assert.match(selector, /\[data-component-preview="primary"\]/);
    assert.match(body, /width:\s*fit-content/);
    assert.match(body, /margin-inline:\s*auto/);
  }
  assert.equal(sawCenter, true, "expected a primary centered surface rule");
});

test("primary stage hooks are emitted by the page and preview", () => {
  const page = read("features/docs/ui/component-page.tsx");
  const preview = read("features/docs/ui/component-preview.tsx");
  const viewport = read("components/preview-viewport.tsx");
  assert.match(page, /data-component-page=/);
  assert.match(page, /id="example"/);
  assert.match(preview, /data-component-preview=\{a11yRoot \? "primary" : true\}/);
  assert.match(viewport, /data-preview-stage=/);
  assert.match(viewport, /data-preview-surface=/);
  assert.match(viewport, /"data-preview-center":/);
});

test("component-page usage and preview code wells are dark and scoped", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  assert.match(css, /--zk-code-well:/);
  assert.match(css, /#usage-and-states/);
  assert.match(css, /\[data-preview-code-panel\]/);
  let sawWell = false;
  for (const { selector, body } of eachBlock(css)) {
    if (!body.includes("var(--zk-code-well)")) continue;
    sawWell = true;
    assert.match(selector, /\[data-component-page\]/, `code-well rule must be scoped: ${selector.trim()}`);
  }
  assert.equal(sawWell, true, "expected a code-well background on the component page");
});

test("usage well figure header muted meets WCAG AA against the well", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  const well = parseHsl(`hsl(${tokenValue(css, "--zk-code-well")})`);
  const muted = parseHsl(`hsl(${tokenValue(css, "--zk-code-well-muted")})`);
  const ratio = contrastRatio(muted, well);
  assert.ok(ratio >= 4.5, `well muted on well is ${ratio.toFixed(2)}:1`);
  let sawHeaderPin = false;
  for (const { selector, body } of eachBlock(css)) {
    if (!body.includes("--muted-foreground:") || !body.includes("--zk-code-well-muted")) continue;
    sawHeaderPin = true;
    assert.match(selector, /#usage-and-states/);
    assert.match(selector, /\[data-preview-code-panel\]/);
    assert.match(body, /--muted-foreground:\s*var\(--zk-code-well-muted\)/);
  }
  assert.equal(sawHeaderPin, true, "well figures must pin --muted-foreground for .text-fd-muted-foreground");
});

test("component-page stage CSS does not restyle specimens with !important", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  for (const { selector, body } of eachBlock(css)) {
    if (!body.includes("!important")) continue;
    assert.match(
      selector,
      /:not\(\[data-identity-scope\] \*\)/,
      `!important on ${selector.trim()} must exclude identity scopes`,
    );
  }
});

function docsLayoutSource() {
  const nested = "app/docs/[[...slug]]/layout.tsx";
  return { path: nested, source: read(nested) };
}

test("desktop docs chrome has search and GitHub and no version or theme toggle", () => {
  const { source } = docsLayoutSource();
  assert.match(source, /searchToggle=\{\{\s*enabled:\s*true/);
  assert.doesNotMatch(source, /githubUrl=/);
  assert.doesNotMatch(source, /links=\{/);
  assert.match(source, /themeSwitch=\{\{\s*enabled:\s*false/);
  assert.match(source, /collapsible:\s*false/);
  assert.match(source, /DocsDesktopHeader/);
  assert.match(source, /DocsSiteHeader/);
  assert.doesNotMatch(source, /KitVersionLabel/);
  assert.doesNotMatch(source, /data-kit-version/);
  assert.doesNotMatch(source, /MobileHeader/);
});

test("ComponentPage first-screen order is example, Use it, install, then guidance", () => {
  const page = read("features/docs/ui/component-page.tsx");
  const example = page.indexOf('id="example"');
  const usage = page.indexOf('id="usage-and-states"');
  const install = page.indexOf('id="install-or-copy"');
  const guidance = page.indexOf('id="guidance"');
  const props = page.indexOf('id="props"');
  assert.ok(example >= 0 && usage > example, "Use it must follow the preview");
  assert.ok(install > usage, "install must follow Use it");
  assert.ok(guidance > install, "guidance must follow install");
  assert.ok(props > guidance, "props must follow guidance");
  assert.match(page, /sections\.guidance/);
});

test("primary Button well is the four-action row", () => {
  const demo = read("components/demos/button-demo.tsx");
  assert.match(demo, /buttonCopy\.createApp/);
  assert.match(demo, /variant="outline"/);
  assert.match(demo, /buttonCopy\.details/);
  assert.match(demo, /variant="ghost"/);
  assert.match(demo, /buttonCopy\.cancel/);
  assert.match(demo, /variant="destructive"/);
  assert.match(demo, /buttonCopy\.delete/);
  assert.doesNotMatch(demo, /buttonCopy\.hint/);
  assert.doesNotMatch(demo, /buttonCopy\.docsLink/);
  assert.doesNotMatch(demo, /buttonCopy\.small/);
  assert.doesNotMatch(demo, /buttonCopy\.disabled/);
  assert.doesNotMatch(demo, /buttonCopy\.saving/);
  assert.doesNotMatch(demo, /size="sm"|size="lg"|size="icon"/);
});

test("button copy drops hint, disabled, and added after the well trim", () => {
  const copy = read("components/demos/i18n/button-copy.ts");
  assert.doesNotMatch(copy, /\bhint:/);
  assert.doesNotMatch(copy, /\bdisabled:/);
  assert.doesNotMatch(copy, /\badded:/);
});

test("Look select shows the resolved look name when unpinned", () => {
  const source = read("components/demo-style-scope.tsx");
  assert.match(source, /demoStyleScopeCopy\.followSite/);
  assert.match(source, /identities\.find\(\(item\) => item\.id === look\)\?\.label/);
});

test("ButtonSizesDemo still documents extra sizes, icon, asChild, and saving", () => {
  const demo = read("components/demos/button-sizes-demo.tsx");
  assert.match(demo, /buttonCopy\.small/);
  assert.match(demo, /buttonCopy\.large/);
  assert.match(demo, /buttonCopy\.saving/);
  assert.match(demo, /size="icon"/);
  assert.match(demo, /asChild/);
  assert.match(demo, /buttonCopy\.docsLink/);
});

test("docs chrome keeps header search and does not duplicate it in a fumadocs slot", () => {
  const slots = read("ui/site-chrome-slots.ts");
  const docsStart = slots.indexOf("export const docsChromeSlots");
  assert.notEqual(docsStart, -1, "missing docsChromeSlots");
  const docs = slots.slice(docsStart);
  assert.doesNotMatch(docs, /searchTrigger/);
  assert.doesNotMatch(docs, /themeSwitch/);
  assert.match(docs, /container:\s*DocsContainer/);
  assert.match(docs, /root:\s*DocsSidebar/);
});

test("phone docs page tree is a kit Drawer in the docs shell, not an in-flow list", () => {
  const css = read("app/docs-shell-tokens.css");
  const container = read("ui/docs-container.tsx");
  const sidebar = read("ui/docs-sidebar.tsx");
  const header = read("ui/mobile-header.tsx");
  assert.doesNotMatch(container, /gridTemplate\s*:/);
  assert.doesNotMatch(container, /grid-template\s*:/);
  assert.doesNotMatch(container, /\bstyle=/);
  assert.doesNotMatch(container, /useSidebar/);
  assert.match(sidebar, /id="nd-sidebar"/);
  assert.equal((sidebar.match(/id="nd-sidebar"/g) ?? []).length, 1);
  assert.match(sidebar, /max-md:hidden/);
  assert.match(sidebar, /md:hidden/);
  assert.match(sidebar, /<Drawer direction="left" mobile="side"/);
  assert.match(sidebar, /DrawerTrigger asChild/);
  assert.match(sidebar, /DrawerTitle/);
  assert.match(sidebar, /DrawerCloseButton/);
  assert.match(sidebar, /siteChromeCopy\.nav\.docsPages/);
  assert.match(sidebar, /siteChromeCopy\.nav\.docsNavigation/);
  assert.doesNotMatch(sidebar, /<SidebarDrawer|<SidebarContent/);
  assert.doesNotMatch(sidebar, /nd-sidebar-mobile/);
  assert.doesNotMatch(sidebar, /openNavigation/);
  assert.doesNotMatch(header, /siteChromeCopy\.nav\.docsPages/);
  assert.doesNotMatch(header, /Drawer direction="left"/);
  assert.match(css, /\[data-sidebar-placeholder\]/);
  assert.match(css, /#nd-sidebar/);
  assert.match(css, /width < 48rem/);
  assert.doesNotMatch(css, /--fd-sidebar-width:\s*100%/);
  assert.match(css, /#nd-docs-layout:not\(:has\(#nd-sidebar\)\)/);
  assert.match(css, /--fd-sidebar-col:\s*0px/);
  assert.match(css, /Fumadocs 16\.17\.10/);
  assert.doesNotMatch(css, /Cmd\/Ctrl\+B|data-sidebar-panel/);
});

test("docs page-tree items are a flex column with 44px rows, not unstyled /base leaves", () => {
  const sidebar = read("ui/docs-sidebar.tsx");
  assert.match(sidebar, /flex min-h-target w-full items-center/);
  assert.match(sidebar, /<Stack gap="tight"/);
  assert.match(sidebar, /SidebarFolderContent/);
  assert.doesNotMatch(sidebar, /fumadocs-ui\/layouts\/docs\/slots\/sidebar/);
});

test("docs layout on UI routes uses the job-grouped tree helper", () => {
  const { source } = docsLayoutSource();
  assert.match(source, /docsLayoutTree/);
  assert.match(source, /source\.pageTree/);
});

test("component pages turn off the TOC and the TOC popover", () => {
  const page = read("app/docs/[[...slug]]/page.tsx");
  assert.match(page, /page\.data\.componentPage/);
  assert.match(page, /tableOfContent:\s*\{\s*enabled:\s*false/);
  assert.match(page, /tableOfContentPopover:\s*\{\s*enabled:\s*false/);
});

test("component-page title tokens are 2.5rem / 500 without a raw 40px font-size", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  assert.match(css, /\[data-component-page\]/);
  assert.match(css, /--zk-type-doc-h1-size:\s*clamp\(2rem,\s*1\.7rem \+ 1\.2vw,\s*2\.5rem\)/);
  assert.match(css, /--zk-type-doc-h1-weight:\s*500/);
  assert.match(css, /--zk-type-doc-h1-leading:\s*1\.12/);
  assert.match(css, /--zk-type-doc-h1-tracking:\s*-0\.03em/);
  assert.doesNotMatch(css, /font-size:\s*40px/);
  const typography = stripComments(read("app/docs-typography.css"));
  assert.match(typography, /#nd-page h1[\s\S]*font-size:\s*var\(--zk-type-doc-h1-size\)/);
  assert.match(typography, /#nd-page h1[\s\S]*font-weight:\s*var\(--zk-type-doc-h1-weight\)/);
  assert.match(
    css,
    /#nd-page \[data-component-page\] h1\[data-slot="heading"\][\s\S]*font-size:\s*var\(--zk-type-doc-h1-size\)/,
  );
});

test("component-page section H2 tokens are 22px / 500", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  assert.match(css, /--zk-type-h2-size:\s*1\.375rem/);
  assert.match(css, /--zk-type-h2-weight:\s*500/);
});

test("component page owns breadcrumb, H1, lead, Source; wraps is off the header meta row", () => {
  const page = read("features/docs/ui/component-page.tsx");
  const header = page.split("data-component-page-header")[1]?.split("id=\"example\"")[0] ?? "";
  assert.match(header, /data-component-page-breadcrumb/);
  assert.match(header, /<Heading level=\{1\}/);
  assert.match(header, /typeRole="lead"/);
  assert.match(header, /header\.source/);
  assert.doesNotMatch(header, /ComponentWrapsLine/);
  assert.match(page, /ComponentWrapsLine/);
});

test("generator hides the fumadocs title and passes source plus nav group", () => {
  const generate = read("scripts/generate.mjs");
  assert.match(generate, /hidePageTitle:\s*true/);
  assert.match(generate, /source:\s*spec\.source/);
  assert.match(generate, /sourceFile=\{\$\{JSON\.stringify\(spec\.source\)\}/);
  assert.match(generate, /uiSidebarGroupFor\(need\.need, spec\.source\)/);
  assert.match(generate, /from "\.\.\/\.\.\/\.\.\/features\/docs\/ui\/component-page"/);
  assert.match(generate, /from "\.\.\/\.\.\/\.\.\/features\/docs\/ui\/component-preview"/);
  assert.match(generate, /from "\.\.\/\.\.\/\.\.\/features\/docs\/ui\/props-table"/);
  assert.match(generate, /from "\.\.\/\.\.\/\.\.\/features\/docs\/ui\/component-wraps-line"/);
  assert.match(generate, /from "\.\.\/\.\.\/\.\.\/components\/maturity-badge"/);
  assert.match(generate, /"\.\.\/\.\.\/features\/docs\/ui\/component-preview"/);
  assert.doesNotMatch(generate, /from "\.\.\/\.\.\/\.\.\/components\/component-page"/);
});

test("primary preview toolbar is Preview, Code, Look, Dark inside the frame", () => {
  const viewport = read("components/preview-viewport.tsx");
  const preview = read("features/docs/ui/component-preview.tsx");
  assert.match(preview, /quiet=\{Boolean\(a11yRoot\)\}/);
  assert.match(preview, /from "@\/components\/preview-viewport"/);
  assert.match(preview, /from "@\/components\/demos\/registry"/);
  const start = viewport.indexOf("function QuietPreviewToolbar");
  const end = viewport.indexOf("export function PreviewFrame");
  assert.ok(start >= 0 && end > start, "expected QuietPreviewToolbar before PreviewFrame");
  const quietFn = viewport.slice(start, end);
  assert.match(quietFn, /previewViewportCopy\.look/);
  assert.match(quietFn, /previewViewportCopy\.dark/);
  assert.doesNotMatch(quietFn, /previewViewportCopy\.full/);
  assert.doesNotMatch(quietFn, /previewViewportCopy\.mobile/);
  assert.doesNotMatch(quietFn, /previewViewportCopy\.site/);
  assert.doesNotMatch(quietFn, /previewViewportCopy\.light/);
  assert.match(viewport, /data-preview-frame=/);
});

test("reduced-transparency drops stage halos", () => {
  const css = stripComments(read("app/docs-component-page.css"));
  const media = css.match(/@media\s*\(prefers-reduced-transparency:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(media, "expected a reduced-transparency media block");
  assert.match(media[1], /\[data-preview-stage\]/);
  assert.match(media[1], /background-image:\s*var\(--zk-preview-stage-fill\)/);
  assert.doesNotMatch(media[1], /--zk-preview-stage-halos/);
  assert.doesNotMatch(media[1], /@keyframes|animation-name:/);
});

test("dark syntax remaps on component-page wells meet WCAG AA against the well", () => {
  const pageCss = read("app/docs-component-page.css");
  const syntax = stripComments(read("app/code-syntax.css"));
  const well = parseHsl(`hsl(${tokenValue(pageCss, "--zk-code-well")})`);
  const htmlDark = shikiDarkColours(syntax, "html.dark figure.shiki");
  const islandDark = shikiDarkColours(syntax, "figure.shiki.dark");
  const pageDark = shikiDarkColours(syntax, "[data-component-page]");
  assert.ok(htmlDark.length >= 8, "html.dark remaps every syntax role");
  assert.deepEqual(colourCounts(islandDark), colourCounts(htmlDark));
  assert.deepEqual(colourCounts(pageDark), colourCounts(htmlDark));
  for (const colour of htmlDark) {
    const ratio = contrastRatio(parseHsl(colour), well);
    assert.ok(ratio >= 4.5, `${colour} on code well is ${ratio.toFixed(2)}:1`);
  }
});
