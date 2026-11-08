/* global document, getComputedStyle -- used inside page.evaluate */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

// Behavior checks against the real compiled package CSS (the gallery page
// carries it). jsdom cannot resolve cascade layers or custom-property
// inheritance, which is exactly what these regressions lived in.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

type CssObject = { [key: string]: string | CssObject };

function serializeCss(obj: CssObject): string {
  return Object.entries(obj)
    .map(([key, value]) => (typeof value === "string" ? `${key}: ${value};` : `${key} { ${serializeCss(value)} }`))
    .join("\n");
}

test("registry-only payload renders the copied Dialog overlay (C-01)", async ({ page }) => {
  const here = dirname(fileURLToPath(import.meta.url));
  const uiRoot = join(here, "..");
  const repo = join(uiRoot, "..", "..");
  const registry = JSON.parse(readFileSync(join(repo, "registry.json"), "utf8")) as {
    items: { name: string; css?: CssObject; cssVars?: Record<string, Record<string, string>> }[];
  };
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const theme: Record<string, string> = {};
  const chunks: string[] = [];
  for (const item of registry.items) {
    Object.assign(light, item.cssVars?.light ?? {});
    Object.assign(dark, item.cssVars?.dark ?? {});
    Object.assign(theme, item.cssVars?.theme ?? {});
    if (item.css) chunks.push(serializeCss(item.css));
  }
  const vars = (selector: string, vars: Record<string, string>) =>
    `${selector} { ${Object.entries(vars).map(([n, v]) => `--${n}: ${v};`).join("\n")} }`;
  const fixture = [
    '@import "tailwindcss";',
    `@source "${join(repo, "registry", "ui")}";`,
    vars("@theme inline", theme),
    vars(":root", light),
    vars(".dark", dark),
    ...chunks,
  ].join("\n");
  const dir = join(uiRoot, "preview", ".tmp-copy-css");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "payload.css");
  writeFileSync(file, fixture);
  let compiled: string;
  try {
    compiled = (await postcss([tailwindcss()]).process(fixture, { from: file })).css;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // Overlay markup as copied by registry/ui/dialog.tsx.
  await page.setContent(
    `<style>${compiled}</style><div data-slot="dialog-overlay" class="fixed pin-fill z-overlay dialog-scrim"></div>`,
  );
  const out = await page.evaluate(() => {
    const el = document.querySelector('[data-slot="dialog-overlay"]')!;
    const rect = el.getBoundingClientRect();
    return { w: rect.width, h: rect.height, bg: getComputedStyle(el).backgroundColor };
  });
  const viewport = page.viewportSize()!;
  expect(out.w).toBe(viewport.width);
  expect(out.h).toBe(viewport.height);
  expect(out.bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(out.bg).not.toBe("transparent");
});

test("consumer utility overrides Switch height (C-03)", async ({ page }) => {
  const heights = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML =
      '<button data-slot="switch" id="plain"></button>' +
      '<button data-slot="switch" id="over" class="h-control-height-lg"></button>';
    document.body.append(host);
    const plain = document.getElementById("plain")!;
    const over = document.getElementById("over")!;
    return {
      plain: getComputedStyle(plain).height,
      over: getComputedStyle(over).height,
    };
  });
  expect(heights.plain).toBe("20px");
  expect(heights.over).toBe("40px");
});

test("consumer type role overrides hero title size (C-03)", async ({ page }) => {
  // The kit's override seam is cn(): conflicting roles resolve last-wins
  // (proven in tests/unit/utils.test.ts), then the surviving utility must
  // actually paint (it did not when the hero role was an unlayered rule
  // winning over layered utilities). `merged` is cn()'s output there.
  const merged = "text-page-title";
  const sizes = await page.evaluate((overClass) => {
    const host = document.createElement("div");
    host.innerHTML =
      '<h1 id="hero" class="text-hero-title">x</h1>' +
      `<h1 id="over" class="${overClass}">x</h1>`;
    document.body.append(host);
    return {
      hero: getComputedStyle(document.getElementById("hero")!).fontSize,
      over: getComputedStyle(document.getElementById("over")!).fontSize,
    };
  }, merged);
  expect(sizes.hero).toBe("48px");
  expect(sizes.over).toBe("24px");
});

test("nested identity scope keeps its own density (C-02)", async ({ page }) => {
  const out = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML =
      '<div data-identity-scope="" data-identity="press">' +
      '<div id="outer-gap" class="gap-stack-sm" style="display:flex"><i></i><i></i></div>' +
      '<div data-identity-scope="" data-identity="glass">' +
      '<div id="inner-gap" class="gap-stack-sm" style="display:flex"><i></i><i></i></div>' +
      '<span id="inner-icon" class="size-icon" style="display:block"></span>' +
      "</div></div>";
    document.body.append(host);
    const gap = (id: string) => getComputedStyle(document.getElementById(id)!).gap;
    return {
      outer: gap("outer-gap"),
      inner: gap("inner-gap"),
      icon: getComputedStyle(document.getElementById("inner-icon")!).width,
    };
  });
  // press --spacing .20rem -> gap-sm x2 = 6.4px; glass .32rem -> 10.24px; icon x4 glass = 20.48px.
  expect(out.outer).toBe("6.4px");
  expect(out.inner).toBe("10.24px");
  expect(Number.parseFloat(out.icon)).toBeCloseTo(20.48, 1);
});
