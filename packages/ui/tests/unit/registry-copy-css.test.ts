import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

// C-01 closure: a copy-only consumer (shadcn add, no npm package) must
// get working CSS for every class the copied bricks use. Differential
// oracle: compile the copied sources against (A) the real package
// stylesheet and (B) ONLY the distributed registry payload. Every class
// rule A generates for a copied-source token must also exist in B.

const here = dirname(fileURLToPath(import.meta.url));
const uiRoot = join(here, "..", "..");
const repo = join(uiRoot, "..", "..");
const registryUi = join(repo, "registry", "ui");

type CssObject = { [key: string]: string | CssObject };

function serialize(obj: CssObject): string {
  return Object.entries(obj)
    .map(([key, value]) => (typeof value === "string" ? `${key}: ${value};` : `${key} { ${serialize(value)} }`))
    .join("\n");
}

function varsBlock(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `--${name}: ${value};`)
    .join("\n");
  return `${selector} { ${body} }`;
}

function classTokens(dir: string): Set<string> {
  const tokens = new Set<string>();
  for (const name of readdirSync(dir)) {
    if (!/\.(tsx|ts)$/.test(name)) continue;
    const source = readFileSync(join(dir, name), "utf8");
    for (const match of source.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`$]*)`/g)) {
      const literal = match[1] ?? match[2] ?? match[3] ?? "";
      for (const raw of literal.split(/\s+/)) {
        if (!raw || raw.includes("[") || raw.includes("(") || raw.includes("/")) continue;
        const base = (raw.split(":").pop() ?? "").replace(/^!/, "").replace(/!$/, "");
        if (/^[a-z][\w-]*$/i.test(base)) tokens.add(base);
      }
    }
  }
  return tokens;
}

async function compile(css: string, name: string): Promise<string> {
  const dir = join(uiRoot, "tests", ".tmp-copy-css");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, css);
  try {
    return (await postcss([tailwindcss()]).process(css, { from: file })).css;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function hasRule(compiled: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\.${escaped}[\\s{:.]`).test(compiled);
}

describe("registry copy CSS closure", () => {
  it("registry payload generates every class the real stylesheet generates for copied bricks", async () => {
    const registry = JSON.parse(readFileSync(join(repo, "registry.json"), "utf8")) as {
      items: { name: string; css?: CssObject; cssVars?: Record<string, Record<string, string>> }[];
    };
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    const theme: Record<string, string> = {};
    const cssChunks: string[] = [];
    for (const item of registry.items) {
      Object.assign(light, item.cssVars?.light ?? {});
      Object.assign(dark, item.cssVars?.dark ?? {});
      Object.assign(theme, item.cssVars?.theme ?? {});
      if (item.css) cssChunks.push(serialize(item.css));
    }
    const payloadCss = [
      '@import "tailwindcss";',
      `@source "${registryUi}";`,
      varsBlock("@theme inline", theme),
      varsBlock(":root", light),
      varsBlock(".dark", dark),
      ...cssChunks,
    ].join("\n");
    const realCss = `@import "${join(uiRoot, "src", "styles.css")}";\n@source "${registryUi}";`;

    const [real, payload] = await Promise.all([
      compile(realCss, "real.css"),
      compile(payloadCss, "payload.css"),
    ]);

    const missing: string[] = [];
    for (const token of classTokens(registryUi)) {
      if (hasRule(real, token) && !hasRule(payload, token)) missing.push(token);
    }
    expect(missing.sort()).toEqual([]);
  }, 120000);
});
