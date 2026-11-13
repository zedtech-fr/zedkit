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
      muted: parseTriplet(tokenValue(body, "muted", `mist ${mode} styles.css`)),
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
    muted: parseTriplet(tokenValue(body, "muted", label)),
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
    lightPageMuted: parseTriplet(tokenValue(lightPage, "muted", "light page muted")),
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

function chromePalette(id, mode) {
  const shell = loadShell();
  if (mode === "light") {
    return {
      background: shell.lightPageBackground,
      foreground: shell.lightPageForeground,
      muted: shell.lightPageMuted,
      mutedForeground: shell.lightMutedForeground,
    };
  }
  const palette = identityPalette(id, "dark");
  return {
    background: palette.background,
    foreground: palette.foreground,
    muted: palette.muted,
    mutedForeground: palette.mutedForeground,
  };
}

function docsCssFiles() {
  const skip = new Set(["node_modules", ".next", "out"]);
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".css")) out.push(path);
    }
  }
  walk(app);
  return out;
}

function ruleDecls(body) {
  const map = new Map();
  for (const part of body.split(";")) {
    const split = part.indexOf(":");
    if (split < 0) continue;
    const prop = part.slice(0, split).trim();
    if (prop) map.set(prop, part.slice(split + 1).trim());
  }
  return map;
}

function isActiveTabSelector(selector) {
  if (!/\[data-state=(["']?)active\1\]/.test(selector)) return false;
  return /tabs-trigger|data-look-tab|\[role=(["']?)tab\1\]/.test(selector);
}

function isForegroundToken(value) {
  return /hsl\(\s*var\(\s*--foreground\s*\)\s*\)/.test(value ?? "");
}

function looksSelector(selector) {
  return /data-look-tab/.test(selector) || /#home-page/.test(selector);
}

function foregroundOnForegroundOverlays(css, rel = "fixture.css") {
  const hits = [];
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? "").replace(/\s+/g, " ").trim();
    if (!isActiveTabSelector(selector)) continue;
    const decls = ruleDecls(match[2] ?? "");
    const ink = decls.get("color");
    if (!isForegroundToken(ink)) continue;
    const fill = decls.get("background-color") ?? decls.get("background");
    const invertedFill = isForegroundToken(fill) || (looksSelector(selector) && !fill);
    if (invertedFill) hits.push(`${rel}: ${selector}`);
  }
  return hits;
}

/** Declared selected/unselected pairs for every docs segmented control this ticket lists. */
const DOCS_TABLISTS = [
  {
    name: "home looks pills",
    selected: ["background", "foreground"],
    unselected: ["mutedForeground", "background"],
  },
  {
    name: "adoption primary (Install/Copy)",
    selected: ["foreground", "background"],
    unselected: ["mutedForeground", "background"],
  },
  {
    name: "adoption secondary (package manager)",
    selected: ["foreground", "background"],
    unselected: ["mutedForeground", "muted"],
  },
  {
    name: "preview Preview/Code",
    selected: ["foreground", "muted"],
    unselected: ["mutedForeground", "background"],
  },
  {
    name: "identity editor Classic/Expert",
    selected: ["foreground", "background"],
    unselected: ["mutedForeground", "muted"],
  },
  {
    name: "catalog Tabs demos",
    selected: ["foreground", "background"],
    unselected: ["mutedForeground", "muted"],
  },
  {
    name: "preview display segments",
    selected: ["foreground", "muted"],
    unselected: ["mutedForeground", "background"],
  },
];

test("look tabs selected chip keeps 4.5:1 inverted ink on fill", () => {
  const shell = loadShell();
  assert.doesNotMatch(shell.css, /#home-page \[data-slot="tabs-trigger"\]\[data-state="active"\]/);
  const looks = read(join(app, "app/(home)/_home/home-identity-looks-tabs.tsx"));
  // Evidence emulateMedia reducedMotion=reduce; a CSS snap inside the
  // no-preference gate never applies, so the kit color fade is measured.
  assert.match(looks, /className="[^"]*\btransition-none\b/);
  const homeCss = stripComments(read(homeCssPath));
  assert.doesNotMatch(homeCss, /#home-page \[data-look-tab\][^{]*\{[^}]*transition\s*:/);
  const rule = ruleBody(
    homeCss,
    /^#home-page \[data-look-tab\]\[data-state="active"\]$/,
    "look tab selected",
  );
  assert.match(rule.replace(/\s+/g, " "), /background-color:\s*hsl\(var\(--foreground\)\)/);
  assert.match(rule.replace(/\s+/g, " "), /color:\s*hsl\(var\(--background\)\)/);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      const palette = chromePalette(id, mode);
      const ratio = contrast(palette.background, palette.foreground);
      assert.ok(ratio >= AA, `${id} ${mode} look tab selected ${ratio.toFixed(2)}`);
    }
  }
});

test("docs CSS has no active look-tab foreground-on-foreground overlay", () => {
  const hits = docsCssFiles().flatMap((file) =>
    foregroundOnForegroundOverlays(read(file), file.slice(app.length + 1)),
  );
  assert.deepEqual(hits, []);
});

test("overlay scanner flags restored foreground ink on the inverted look-tab fill", () => {
  const original = `html.dark[data-identity] #home-page [data-slot="tabs-trigger"][data-state="active"] { color: hsl(var(--foreground)); }`;
  const renamed = `#home-page [role="tab"][data-state="active"] { color: hsl(var(--foreground)); }`;
  const bothTokens = `[data-look-tab][data-state="active"] { background-color: hsl(var(--foreground)); color: hsl(var(--foreground)); }`;
  const pin = `#home-page [data-look-tab][data-state="active"] { background-color: hsl(var(--foreground)); color: hsl(var(--background)); }`;
  const kitLike = `[data-slot="tabs-trigger"][data-state="active"] { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }`;
  assert.equal(foregroundOnForegroundOverlays(original).length, 1);
  assert.equal(foregroundOnForegroundOverlays(renamed).length, 1);
  assert.equal(foregroundOnForegroundOverlays(bothTokens).length, 1);
  assert.deepEqual(foregroundOnForegroundOverlays(pin), []);
  assert.deepEqual(foregroundOnForegroundOverlays(kitLike), []);
});

test("look tabs unselected labels keep 4.5:1 muted ink on the track", () => {
  const looks = read(join(app, "app/(home)/_home/home-identity-looks-tabs.tsx"));
  assert.match(looks, /className="[^"]*\bbg-background\b/);
  for (const id of IDENTITIES) {
    for (const mode of MODES) {
      const palette = chromePalette(id, mode);
      const ratio = contrast(palette.mutedForeground, palette.background);
      assert.ok(ratio >= AA, `${id} ${mode} look tab unselected ${ratio.toFixed(2)}`);
    }
  }
});

test("look tabs inner Text has no colour utility", () => {
  const looks = read(join(app, "app/(home)/_home/home-identity-looks-tabs.tsx"));
  const text = looks.match(/<Text as="span"[^>]*>/);
  assert.ok(text, "look tab label Text");
  assert.doesNotMatch(text[0], /className=/);
  assert.doesNotMatch(text[0], /variant=/);
});

test("docs tablists still declare the token pairs this file checks", () => {
  const looks = read(join(app, "app/(home)/_home/home-identity-looks-tabs.tsx"));
  assert.match(looks, /data-\[state=active\]:bg-foreground/);
  assert.match(looks, /data-\[state=active\]:text-background/);
  const adoption = read(join(app, "features/docs/ui/adoption-panel.tsx"));
  assert.match(adoption, /text-muted-foreground/);
  assert.match(adoption, /data-\[state=active\]:bg-transparent/);
  assert.match(adoption, /data-\[state=active\]:text-foreground/);
  const preview = read(join(app, "components/preview-viewport.tsx"));
  assert.match(preview, /data-\[state=active\]:bg-muted/);
  assert.match(preview, /data-\[state=active\]:text-foreground/);
  assert.match(preview, /aria-pressed:bg-muted/);
  assert.match(preview, /aria-pressed:text-foreground/);
  const editor = read(join(app, "components/identity-look-form.tsx"));
  assert.match(editor, /<TabsTrigger value="simple">/);
  assert.match(editor, /<TabsTrigger value="expert">/);
  assert.doesNotMatch(editor, /<TabsTrigger[^>]*className=/);
  const kit = read(join(root, "packages/ui/src/layout/tabs.tsx"));
  assert.match(kit, /bg-muted/);
  assert.match(kit, /text-muted-foreground/);
  assert.match(kit, /data-\[state=active\]:bg-background/);
  assert.match(kit, /data-\[state=active\]:text-foreground/);
  const demos = [
    read(join(app, "components/demos/tabs-demo.tsx")),
    read(join(app, "components/demos/tabs-controlled-demo.tsx")),
    read(join(app, "components/demos/scroll-gallery-demo.tsx")),
  ];
  for (const src of demos) {
    assert.match(src, /<TabsTrigger/);
    assert.doesNotMatch(src, /<TabsTrigger[^>]*className=/);
  }
});

test("docs segmented controls keep 4.5:1 on their declared pairs", () => {
  for (const control of DOCS_TABLISTS) {
    for (const id of IDENTITIES) {
      for (const mode of MODES) {
        const palette = chromePalette(id, mode);
        const selected = contrast(palette[control.selected[0]], palette[control.selected[1]]);
        const unselected = contrast(palette[control.unselected[0]], palette[control.unselected[1]]);
        assert.ok(
          selected >= AA,
          `${control.name} ${id} ${mode} selected ${selected.toFixed(2)}`,
        );
        assert.ok(
          unselected >= AA,
          `${control.name} ${id} ${mode} unselected ${unselected.toFixed(2)}`,
        );
      }
    }
  }
});
