import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");

const SHEETS = ["motion.css", "layout/scroll-scenes.css", "signature-motion.css", "styles.css", "motion/parallax.css"] as const;

describe("in-app motion toggle CSS", () => {
  it.each(SHEETS)("gates %s with :root:not([data-motion=reduce])", (file) => {
    expect(read(file)).toContain(':root:not([data-motion="reduce"])');
  });

  it.each(["motion.css", "signature-motion.css", "styles.css"] as const)(
    "kills always-on motion in %s when data-motion is reduce",
    (file) => {
      expect(read(file)).toContain(':root[data-motion="reduce"]');
    },
  );

  it("keeps ScrollScenes pinning inside the toggle gate, so reduce falls back to the stacked layout", () => {
    const css = read("layout/scroll-scenes.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const gate = css.indexOf(':root:not([data-motion="reduce"])');
    const sticky = css.indexOf("position: sticky");
    expect(gate).toBeGreaterThan(-1);
    expect(sticky).toBeGreaterThan(gate);
  });
});

function utilityBlock(css: string, name: string): string {
  const start = css.indexOf(`@utility ${name}`);
  expect(start).toBeGreaterThan(-1);
  const next = css.indexOf("@utility ", start + 1);
  return css.slice(start, next === -1 ? undefined : next);
}

function reduceMedia(css: string): string {
  const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
  expect(start).toBeGreaterThan(-1);
  const nextRoot = css.indexOf(':root[data-motion="reduce"]', start);
  return css.slice(start, nextRoot === -1 ? undefined : nextRoot);
}

function nestedRule(block: string, selector: string): string {
  const from = block.indexOf(selector);
  expect(from).toBeGreaterThan(-1);
  const brace = block.indexOf("{", from);
  expect(brace).toBeGreaterThan(from);
  let depth = 0;
  for (let i = brace; i < block.length; i += 1) {
    if (block[i] === "{") depth += 1;
    else if (block[i] === "}") {
      depth -= 1;
      if (depth === 0) return block.slice(brace, i + 1);
    }
  }
  throw new Error(`unclosed ${selector}`);
}

describe("hover-lift focus parity", () => {
  const css = read("motion.css");
  const lift = utilityBlock(css, "hover-lift");
  const catalog = readFileSync(join(src, "..", "CATALOG.md"), "utf8");

  it("uses the same lift, shadow, and primary-tinted border on hover, focus-visible, and focus-within", () => {
    expect(lift).toMatch(/@media\s*\(\s*hover:\s*hover\s*\)/);
    expect(lift).toContain(":focus-visible");
    expect(lift).toContain(":focus-within");
    expect(lift).toContain("hsl(var(--primary) / 0.45)");
    expect(lift).toMatch(/border-color\s+var\(--zk-lift-duration/);
    for (const selector of ["&:hover", "&:focus-visible", "&:focus-within"] as const) {
      const body = nestedRule(lift, selector);
      expect(body).toContain("var(--zk-lift-translate");
      expect(body).toContain("var(--zk-lift-shadow");
      expect(body).toContain("hsl(var(--primary) / 0.45)");
    }
  });

  it("keeps border and shadow under reduced motion and only kills translate", () => {
    const media = reduceMedia(css);
    const dataMotion = css.slice(css.indexOf(':root[data-motion="reduce"] .hover-lift'));
    for (const block of [media, dataMotion] as const) {
      expect(block).toMatch(/\.hover-lift:hover/);
      expect(block).toMatch(/\.hover-lift:focus-visible/);
      expect(block).toMatch(/\.hover-lift:focus-within/);
      expect(block).toMatch(/\.hover-lift[^{]*\{[^}]*translate:\s*none/s);
      expect(block).not.toMatch(/\.hover-lift[^{.,]*\{[^}]*box-shadow:\s*none/s);
      expect(block).not.toMatch(/\.hover-lift[^{.,]*\{[^}]*border-color:\s*(?:none|inherit|unset|revert|initial)/s);
    }
    expect(media).toContain("[data-animate-scroll]");
    expect(media).toContain("translate: none !important");
  });

  it("documents keyboard focus-within on the catalog motion need", () => {
    const need = catalog.slice(catalog.indexOf("## Animate entrances and hover feedback with CSS utilities"));
    const a11y = need.slice(need.indexOf("- A11y:"), need.indexOf("\n- Troubleshooting"));
    expect(a11y).toContain("focus-within");
    expect(a11y).toMatch(/border/);
    expect(a11y).toMatch(/:hover[\s\S]*never sticks after a tap/);
    expect(a11y).toMatch(/:focus-within[\s\S]*until blur/);
    expect(a11y).toMatch(/bordered host/);
  });
});
