// Generates the copy-path theme payload from the package stylesheet.
//
// The registry `theme` item is what a copy-only consumer (shadcn add,
// no npm package) gets. It must carry every custom utility, component
// rule, keyframe and token the copied bricks reference — derived here
// from packages/ui/src/styles.css, never hand-copied. `pnpm
// registry:build` writes the result into registry.json; the drift test
// in theme-tokens.test.mjs compares the committed file against a fresh
// generation, and the copy-css closure test compiles the payload.
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

/** Parse a CSS block body into a shadcn css object (decls + nested rules). */
export function cssObjectFromBody(body) {
  const out = {};
  let i = 0;
  let head = "";
  while (i < body.length) {
    const ch = body[i];
    if (ch === "{") {
      const { body: inner, end } = blockBody(body, i);
      out[head.trim().replace(/\s+/g, " ")] = cssObjectFromBody(inner);
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
    Object.assign(out, cssObjectFromBody(blockBody(css, open).body));
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

/**
 * Full theme payload for the registry `theme` item.
 * @param {string} root repo root
 * @returns {{ cssVars: object, css: object }}
 */
export function generateThemePayload(root) {
  const srcDir = join(root, "packages/ui/src");
  const css = STRIP_COMMENTS(readFileSync(join(srcDir, "styles.css"), "utf8"));
  const identities = STRIP_COMMENTS(readFileSync(join(srcDir, "identities.css"), "utf8"));
  // Sibling sheets styles.css imports also define utilities/keyframes
  // (motion, type roles, signature motion...). Follow its @import list.
  let siblings = "";
  for (const match of css.matchAll(/@import\s+"\.\/([\w./-]+\.css)"/g)) {
    if (match[1] === "identities.css") continue;
    siblings += `\n${STRIP_COMMENTS(readFileSync(join(srcDir, match[1]), "utf8"))}`;
  }
  const used = classTokensFromSources(join(root, "registry/ui"));
  const utilities = utilitiesFromCss(css + siblings);

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
  // Density scope rule (single definition site in styles.css).
  const density = findBlock(css, ":root,\n[data-identity-scope]");
  cssPayload[":root, [data-identity-scope]"] = cssObjectFromBody(density);

  const light = {
    ...varsFromBody(findBlock(css, ":root")),
    ...varsFromBody(findBlock(identities, ":root")),
    // Shared identity defaults (--spacing, fonts, radii) live in the
    // `:root[data-identity], [data-identity-scope][data-identity]` block.
    ...varsFromBody(findBlock(identities, ":root[data-identity],")),
  };
  const dark = varsFromBody(findBlock(css, "\n.dark"));
  const theme = varsFromBody(findBlock(css, "@theme inline"));
  // Sibling sheets may add :root/@theme vars (motion tokens, type scale).
  for (const match of siblings.matchAll(/(?::root|@theme[^{]*)\s*\{/g)) {
    const { body } = blockBody(siblings, siblings.indexOf("{", match.index));
    Object.assign(match[0].startsWith("@theme") ? theme : light, varsFromBody(body));
  }

  return {
    cssVars: { light, dark, theme },
    css: cssPayload,
  };
}
