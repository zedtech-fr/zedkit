// Generates the copy-path theme payload from the package stylesheet.
//
// The registry `theme` item is what a copy-only consumer (shadcn add,
// no npm package) gets. It must carry every custom utility, component
// rule, keyframe and token the copied bricks reference — derived here
// from packages/ui/src/styles.css, never hand-copied. `pnpm
// registry:build` writes the result into registry.json; the drift test
// in theme-tokens.test.mjs compares the committed file against a fresh
// generation, and the copy-css closure test compiles the payload.
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Brace-matched block body starting at the `{` at `open`. */
function blockBody(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return { body: css.slice(open + 1, i), end: i };
    }
  }
  throw new Error("theme-payload: unclosed block");
}

function findBlock(css, opener) {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`theme-payload: missing ${opener}`);
  return blockBody(css, css.indexOf("{", start)).body;
}

function mergeCssObject(target, source) {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (existing && typeof existing === "object" && typeof value === "object") mergeCssObject(existing, value);
    else target[key] = value;
  }
  return target;
}

/** Parse a CSS block body into a shadcn css object (decls + nested rules). */
export function cssObjectFromBody(body) {
  const out = {};
  let i = 0;
  let head = "";
  while (i < body.length) {
    const ch = body[i];
    if (ch === "{") {
      const { body: inner, end } = blockBody(body, i);
      const key = head.trim().replace(/\s+/g, " ");
      const parsed = cssObjectFromBody(inner);
      // Repeated selectors / @container blocks merge, never clobber.
      if (out[key]) mergeCssObject(out[key], parsed);
      else out[key] = parsed;
      head = "";
      i = end + 1;
      continue;
    }
    if (ch === ";") {
      const decl = head.trim();
      head = "";
      i += 1;
      if (!decl) continue;
      const colon = decl.indexOf(":");
      if (colon < 0) continue;
      out[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
      continue;
    }
    head += ch;
    i += 1;
  }
  const tail = head.trim();
  if (tail) {
    const colon = tail.indexOf(":");
    if (colon > 0) out[tail.slice(0, colon).trim()] = tail.slice(colon + 1).trim();
  }
  return out;
}

function varsFromBody(body) {
  const vars = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

/** Every @utility name -> body in a stylesheet. */
export function utilitiesFromCss(css) {
  const out = new Map();
  for (const match of css.matchAll(/@utility\s+([\w-]+)\s*\{/g)) {
    const open = css.indexOf("{", match.index);
    out.set(match[1], blockBody(css, open).body);
  }
  return out;
}

/** Class tokens used by copied sources (string literals, variants stripped). */
export function classTokensFromSources(dir) {
  const tokens = new Set();
  for (const name of readdirSync(dir)) {
    if (!/\.(tsx|ts)$/.test(name)) continue;
    const source = readFileSync(join(dir, name), "utf8");
    for (const match of source.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`$]*)`/g)) {
      const literal = match[1] ?? match[2] ?? match[3] ?? "";
      for (const raw of literal.split(/\s+/)) {
        if (!raw || raw.includes("[") || raw.includes("(") || raw.includes("/")) continue;
        const base = raw.split(":").pop().replace(/^!/, "").replace(/!$/, "");
        if (/^[a-z][\w-]*$/i.test(base)) tokens.add(base);
      }
    }
  }
  return tokens;
}

function keyframesFromCss(css) {
  const out = {};
  for (const match of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    const open = css.indexOf("{", match.index);
    out[`@keyframes ${match[1]}`] = cssObjectFromBody(blockBody(css, open).body);
  }
  return out;
}

/** Rules inside every @layer components block, as one css object. */
function componentRulesFromCss(css) {
  const out = {};
  for (const match of css.matchAll(/@layer components\s*\{/g)) {
    const open = css.indexOf("{", match.index);
    mergeCssObject(out, cssObjectFromBody(blockBody(css, open).body));
  }
  return out;
}

/** Top-level rules whose selector matches `keep` (must-win library overrides). */
function topLevelRulesFromCss(css, keep) {
  const out = {};
  let i = 0;
  let head = "";
  while (i < css.length) {
    const ch = css[i];
    if (ch === "{") {
      const { body, end } = blockBody(css, i);
      const selector = head.trim().replace(/\s+/g, " ");
      if (selector && !selector.startsWith("@") && keep(selector)) {
        out[selector] = cssObjectFromBody(body);
      }
      head = "";
      i = end + 1;
      continue;
    }
    if (ch === ";" || ch === "}") {
      head = "";
      i += 1;
      continue;
    }
    head += ch;
    i += 1;
  }
  return out;
}

const STRIP_COMMENTS = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const COLOR_ALIAS = /^hsl\(\s*(var\(--[\w-]+\))\s*\)$/;

/** shadcn wraps space-separated HSL. Ship already-wrapped values so it does not wrap twice. */
function wrapLocalHsl(vars) {
  const out = {};
  for (const [key, value] of Object.entries(vars)) {
    const text = String(value).trim();
    const parts = text.split(/\s+/);
    const triplet = parts.length === 3 && parts.slice(1).every((part) => part.includes("%"));
    out[key] = triplet && !text.startsWith("hsl") && !text.startsWith("rgb") ? `hsl(${text})` : text;
  }
  return out;
}

/** `--color-primary: hsl(var(--primary))` becomes `var(--primary)` once --primary is already hsl(). */
function rewriteColorAliases(vars) {
  const out = { ...vars };
  for (const [key, value] of Object.entries(out)) {
    if (!key.startsWith("color-")) continue;
    const match = String(value).trim().match(COLOR_ALIAS);
    if (match) out[key] = match[1];
  }
  return out;
}

function dropColorAliases(vars) {
  const out = { ...vars };
  for (const [key, value] of Object.entries(out)) {
    if (key.startsWith("color-") && COLOR_ALIAS.test(String(value).trim())) delete out[key];
  }
  return out;
}

function postcssFromUi(root) {
  return createRequire(join(root, "packages/ui/package.json"))("postcss");
}

function normalizeSelector(selector) {
  return selector.replace(/\s+/g, " ").trim();
}

function ruleObject(rule) {
  const out = {};
  for (const node of rule.nodes ?? []) {
    if (node.type === "decl") out[node.prop] = node.value;
    else if (node.type === "rule") out[normalizeSelector(node.selector)] = ruleObject(node);
    else if (node.type === "atrule") {
      const key = node.params ? `@${node.name} ${node.params}` : `@${node.name}`;
      out[key] = node.nodes ? ruleObject(node) : {};
    }
  }
  return out;
}

function wrapPath(rule) {
  const path = [];
  for (let node = rule.parent; node && node.type !== "root"; node = node.parent) {
    if (node.type === "atrule") {
      if (node.name === "layer" || node.name === "utility" || node.name === "theme" || node.name === "keyframes") {
        return null;
      }
      path.unshift(node.params ? `@${node.name} ${node.params}` : `@${node.name}`);
    }
  }
  return path;
}

function isColorRoleRule(rule) {
  const selector = normalizeSelector(rule.selector);
  if (selector !== ":root" && selector !== ".dark") return false;
  const primary = (rule.nodes ?? []).find((node) => node.type === "decl" && node.prop === "--primary");
  return Boolean(primary && /^\d/.test(primary.value.trim()));
}

function isTokenSelector(selector) {
  return /:root|\.dark|\[data-identity|\[data-motion/.test(selector);
}

function nestCss(target, path, value) {
  let current = target;
  for (const key of path.slice(0, -1)) {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key];
  }
  const last = path.at(-1);
  if (current[last] && typeof current[last] === "object" && typeof value === "object") {
    mergeCssObject(current[last], value);
  } else current[last] = value;
}

/** Every :root / identity / reduced-motion rule, including later blocks and @media. */
export function tokenRulesFromCss(css, postcss) {
  const out = {};
  const parsed = postcss.parse(css);
  parsed.walkRules((rule) => {
    const path = wrapPath(rule);
    if (!path) return;
    const selector = normalizeSelector(rule.selector);
    const inMotionMedia = path.some((part) => part.includes("prefers-reduced-motion"));
    if (!inMotionMedia && !isTokenSelector(selector)) return;
    if (isColorRoleRule(rule)) return;
    nestCss(out, [...path, selector], ruleObject(rule));
  });
  return out;
}

/**
 * Full theme payload for the registry `theme` item.
 * @param {string} root repo root
 * @returns {{ cssVars: object, css: object }}
 */
export function generateThemePayload(root) {
  const srcDir = join(root, "packages/ui/src");
  const css = STRIP_COMMENTS(readFileSync(join(srcDir, "styles.css"), "utf8"));
  const identities = STRIP_COMMENTS(readFileSync(join(srcDir, "identities.css"), "utf8"));
  const siblingSheets = [];
  for (const match of css.matchAll(/@import\s+"\.\/([\w./-]+\.css)"/g)) {
    if (match[1] === "identities.css") continue;
    siblingSheets.push({ name: match[1], css: STRIP_COMMENTS(readFileSync(join(srcDir, match[1]), "utf8")) });
  }
  const stockSiblings = siblingSheets.filter((sheet) => !sheet.name.startsWith("identities/"));
  const siblings = stockSiblings.map((sheet) => sheet.css).join("\n");
  const used = classTokensFromSources(join(root, "registry/ui"));
  const utilities = utilitiesFromCss(css + siblings);

  used.add("zk-query");
  const cssPayload = {};
  for (const [name, body] of [...utilities.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!used.has(name)) continue;
    cssPayload[`@utility ${name}`] = cssObjectFromBody(body);
  }
  Object.assign(cssPayload, keyframesFromCss(css + siblings));
  cssPayload["@layer components"] = componentRulesFromCss(css + siblings);
  Object.assign(
    cssPayload,
    topLevelRulesFromCss(css, (selector) => /data-vaul|data-sonner/.test(selector)),
  );

  const postcss = postcssFromUi(root);
  const tokenSheets = [css, identities, ...stockSiblings.map((sheet) => sheet.css)];
  for (const sheet of tokenSheets) mergeCssObject(cssPayload, tokenRulesFromCss(sheet, postcss));

  const theme = rewriteColorAliases(varsFromBody(findBlock(css, "@theme inline")));
  for (const sheet of stockSiblings) {
    for (const match of sheet.css.matchAll(/@theme[^{]*\{/g)) {
      Object.assign(theme, rewriteColorAliases(varsFromBody(blockBody(sheet.css, sheet.css.indexOf("{", match.index)).body)));
    }
  }

  return {
    cssVars: {
      light: wrapLocalHsl(dropColorAliases(varsFromBody(findBlock(css, ":root")))),
      dark: wrapLocalHsl(dropColorAliases(varsFromBody(findBlock(css, "\n.dark")))),
      theme,
    },
    css: cssPayload,
  };
}
