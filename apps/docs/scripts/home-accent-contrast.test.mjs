import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const AA = 4.5;
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"];
const MODES = ["light", "dark"];

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(app, "../..");
const identityDir = join(root, "packages/ui/src/identities");
const stylesPath = join(root, "packages/ui/src/styles.css");
const identitiesCssPath = join(root, "packages/ui/src/identities.css");
const shellPath = join(app, "app/docs-shell-tokens.css");
const homeCssPath = join(app, "app/(home)/_home/home.css");
const homeLookTabsPath = join(app, "app/(home)/_home/home-identity-looks-tabs.tsx");

function read(path) {
  return readFileSync(path, "utf8");
}

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

function resolveTriplet(value, lookup, label) {
  const varMatch = value.match(/^var\(--([a-z0-9-]+)(?:,\s*([^)]+))?\)$/i);
  if (!varMatch) return parseTriplet(value);
  const resolved = lookup[varMatch[1]] ?? varMatch[2]?.trim();
  if (!resolved) throw new Error(`unresolved ${value} in ${label}`);
  return parseTriplet(resolved);
}

function stylesThemeBody(theme) {
  const css = read(stylesPath);
  const parts = css.split(/\.dark\s*\{/);
  const body = theme === "light" ? parts[0] : parts[1];
  if (!body) throw new Error(`styles.css ${theme} block missing`);
  return body;
}

function identityPalette(id, mode) {
  if (id === "mist") {
    const body = stylesThemeBody(mode);
    return {
      background: parseTriplet(tokenValue(body, "background", `mist ${mode} styles.css`)),
      foreground: parseTriplet(tokenValue(body, "foreground", `mist ${mode} styles.css`)),
      mutedForeground: parseTriplet(tokenValue(body, "muted-foreground", `mist ${mode} styles.css`)),
      primaryForeground: parseTriplet(tokenValue(body, "primary-foreground", `mist ${mode} styles.css`)),
    };
  }
  const css = read(join(identityDir, `${id}.css`));
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
    mutedForeground: parseTriplet(tokenValue(body, "muted-foreground", label)),
    primaryForeground: parseTriplet(tokenValue(body, "primary-foreground", label)),
  };
}

function loadShell() {
  const css = read(shellPath);
  const site = ruleBody(css, /^html\[data-docs-shell\]\[data-identity\]$/, "html docs-shell identity");
  const lightPage = ruleBody(
    css,
    /^html\[data-docs-shell\]:not\(\.dark\):not\(\[data-identity="custom"\]\)$/,
    "light docs-shell page",
  );
  const paste = ruleBody(css, /^#home-page #paste\[data-slot="section"\]$/, "#paste section");
  const badge = ruleBody(
    css,
    /^#home-page \[data-home-paste-lands\] \[data-slot="badge"\]$/,
    "paste kit badge remap",
  );
  const caption = ruleBody(css, /^#home-page \[data-identity-caption\]$/, "looks caption");
  const lookup = {
    "zk-site-action": tokenValue(site, "zk-site-action", "site-action"),
    "zk-site-action-foreground": tokenValue(site, "zk-site-action-foreground", "site-action-foreground"),
  };
  return {
    css,
    lookup,
    band: parseTriplet(lookup["zk-site-action"]),
    fill: parseTriplet(lookup["zk-site-action-foreground"]),
    lightPageBackground: parseTriplet(tokenValue(lightPage, "background", "light page")),
    lightPageForeground: parseTriplet(tokenValue(lightPage, "foreground", "light page foreground")),
    lightMutedForeground: parseTriplet(tokenValue(lightPage, "muted-foreground", "light muted-foreground")),
    pasteForeground: resolveTriplet(tokenValue(paste, "foreground", "#paste foreground"), lookup, "#paste"),
    pasteBackground: resolveTriplet(tokenValue(paste, "background", "#paste background"), lookup, "#paste"),
    badgePrimary: resolveTriplet(tokenValue(badge, "primary", "badge --primary"), lookup, "badge"),
    badgePrimaryForeground: resolveTriplet(
      tokenValue(badge, "primary-foreground", "badge --primary-foreground"),
      lookup,
      "badge",
    ),
    badgeAccentForeground: resolveTriplet(
      tokenValue(badge, "accent-foreground", "badge --accent-foreground"),
      lookup,
      "badge",
    ),
    captionRule: caption,
  };
}

test("identity CSS files plus mist cover the six shipped looks", () => {
  const files = readdirSync(identityDir)
    .filter((file) => file.endsWith(".css"))
    .map((file) => file.replace(/\.css$/, ""));
  assert.deepEqual([...files, "mist"].sort(), [...IDENTITIES].sort());
  assert.equal(IDENTITIES.includes("custom"), false);
});

test("paste band does not pin Glass light --accent", () => {
  const css = read(shellPath);
  const paste = ruleBody(css, /^#home-page #paste\[data-slot="section"\]$/, "#paste section");
  assert.doesNotMatch(paste, /262 85% 70%/);
  assert.doesNotMatch(css, /262 85% 70%/);
});

test("paste kit badges keep 4.5:1 fill and ink on zinc in every identity and mode", () => {
  const shell = loadShell();
  assert.deepEqual(shell.badgePrimary, shell.band);
  assert.deepEqual(shell.badgeAccentForeground, shell.band);
  assert.deepEqual(shell.badgePrimaryForeground, shell.fill);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      const palette = identityPalette(id, mode);
      const inkOnFill = contrast(shell.badgePrimary, shell.badgePrimaryForeground);
      const fillOnBand = contrast(shell.badgePrimaryForeground, shell.band);
      const uiInkOnFill = contrast(shell.badgeAccentForeground, shell.badgePrimaryForeground);
      assert.ok(inkOnFill >= AA, `${id} ${mode} AI ink on fill ${inkOnFill.toFixed(2)}`);
      assert.ok(uiInkOnFill >= AA, `${id} ${mode} UI ink on fill ${uiInkOnFill.toFixed(2)}`);
      assert.ok(fillOnBand >= AA, `${id} ${mode} fill on zinc ${fillOnBand.toFixed(2)}`);
      if (mode === "dark") {
        assert.notDeepEqual(
          shell.badgePrimaryForeground,
          palette.primaryForeground,
          `${id} dark chip fill must not be identity --primary-foreground`,
        );
      }
    }
  }
});

test("paste highlighted file note keeps 4.5:1 inverted ink on zinc in every identity and mode", () => {
  const shell = loadShell();
  const ratio = contrast(shell.pasteForeground, shell.pasteBackground);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      identityPalette(id, mode);
      assert.ok(ratio >= AA, `${id} ${mode} file note ${ratio.toFixed(2)}`);
    }
  }
});

test("looks caption keeps 4.5:1 muted text on the page in every identity and mode", () => {
  const shell = loadShell();
  assert.match(shell.captionRule.replace(/\s+/g, " "), /color:\s*hsl\(var\(--muted-foreground\)\)/);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      const palette = identityPalette(id, mode);
      const fg = mode === "light" ? shell.lightMutedForeground : palette.mutedForeground;
      const bg = mode === "light" ? shell.lightPageBackground : palette.background;
      const ratio = contrast(fg, bg);
      assert.ok(ratio >= AA, `${id} ${mode} caption ${ratio.toFixed(2)}`);
      assert.notDeepEqual(bg, shell.band, `${id} ${mode} caption is on the page, not zinc`);
    }
  }
});

test("light caption uses shell white, not Glass page fill", () => {
  const shell = loadShell();
  const glass = identityPalette("glass", "light");
  assert.notDeepEqual(shell.lightPageBackground, glass.background);
  assert.deepEqual(shell.lightPageBackground, parseTriplet("0 0% 100%"));
});

test("html mist caption reads stock styles.css, not the scoped-mist reset", () => {
  const mistLight = identityPalette("mist", "light");
  const scoped = ruleBody(
    read(identitiesCssPath),
    /^\[data-identity-scope\]\[data-identity="mist"\]$/,
    "scoped mist",
  );
  const scopedSubtle = parseTriplet(tokenValue(scoped, "zk-subtle-foreground", "scoped mist subtle"));
  assert.notDeepEqual(mistLight.mutedForeground, scopedSubtle);
});

test("look tabs selected chip keeps 4.5:1 inverted ink on fill", () => {
  const shell = loadShell();
  assert.doesNotMatch(shell.css, /#home-page \[data-slot="tabs-trigger"\]\[data-state="active"\]/);
  // Evidence emulates reduced motion. A snap inside the no-preference gate never
  // runs; ungated transition: none in home.css fails the motion-gate test.
  const tabs = read(homeLookTabsPath);
  assert.match(tabs, /data-look-tab=""[\s\S]*?transition-none/);
  assert.doesNotMatch(stripComments(read(homeCssPath)), /\[data-look-tab\][^{]*\{[^}]*transition/);
  const rule = ruleBody(
    read(homeCssPath),
    /^#home-page \[data-look-tab\]\[data-state="active"\]$/,
    "look tab selected",
  );
  assert.match(rule.replace(/\s+/g, " "), /background-color:\s*hsl\(var\(--foreground\)\)/);
  assert.match(rule.replace(/\s+/g, " "), /color:\s*hsl\(var\(--background\)\)/);
  const lightRatio = contrast(shell.lightPageBackground, shell.lightPageForeground);
  assert.ok(lightRatio >= AA, `light shell look tab ${lightRatio.toFixed(2)}`);
  for (const id of IDENTITIES) {
    const palette = identityPalette(id, "dark");
    const ratio = contrast(palette.background, palette.foreground);
    assert.ok(ratio >= AA, `${id} dark look tab ${ratio.toFixed(2)}`);
  }
});
