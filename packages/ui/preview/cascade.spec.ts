/* global document, getComputedStyle -- used inside page.evaluate */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { tryCatchAsync } from "@zedtech/zedkit-core";
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

async function compileRegistryPayload(): Promise<string> {
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
    // The consumer-applied slot marker: in a real app the consumer's own
    // markup is scanned; here the test markup is not a scanned source.
    '@source inline("zk-query");',
    vars("@theme inline", theme),
    vars(":root", light),
    vars(".dark", dark),
    ...chunks,
  ].join("\n");
  const dir = join(uiRoot, "preview", ".tmp-copy-css");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "payload.css");
  writeFileSync(file, fixture);
  const result = await tryCatchAsync(() => postcss([tailwindcss()]).process(fixture, { from: file }));
  rmSync(dir, { recursive: true, force: true });
  if (!result.ok) throw result.error;
  return result.value.css;
}

test("registry-only payload renders the copied Dialog overlay (C-01)", async ({ page }) => {
  const compiled = await compileRegistryPayload();
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

test("registry-only payload paints the copied Button (copy install)", async ({ page }) => {
  const compiled = await compileRegistryPayload();
  const classes =
    "box-border inline-flex cursor-pointer items-center justify-center gap-button-gap rounded-md text-dense font-medium bg-primary text-primary-foreground shadow h-control-height px-button-pad py-control-block-lg";
  await page.setContent(`<style>${compiled}</style><button type="button" class="${classes}">Save</button>`);
  const paint = await page.evaluate(() => {
    const el = document.querySelector("button")!;
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      height: el.getBoundingClientRect().height,
      size: Number.parseFloat(s.fontSize),
      duration: s.transitionDuration,
    };
  });
  expect(paint.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(paint.background).not.toBe("rgb(239, 239, 239)");
  expect(paint.height).toBeGreaterThanOrEqual(36);
  expect(paint.size).toBeGreaterThanOrEqual(13);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mobile = await page.evaluate(() => {
    const el = document.querySelector("button")!;
    return { height: el.getBoundingClientRect().height, duration: getComputedStyle(el).transitionDuration };
  });
  expect(mobile.height).toBeGreaterThanOrEqual(44);
});

test("registry-only payload carries the card sizing recipe (D-C2 copy row)", async ({ page }) => {
  const compiled = await compileRegistryPayload();
  // Card markup as copied by registry/ui/card.tsx (Surface classes + recipe radius utility).
  const card =
    '<div data-slot="card" data-size="sm" class="border bg-card text-card-foreground shadow-md rounded-(--zk-card-radius)">' +
    '<div data-slot="card-header" class="flex flex-col">' +
    '<div data-slot="card-title" class="leading-none font-semibold tracking-tight">T</div>' +
    '<div data-slot="card-description" class="text-muted-foreground">D</div></div></div>';
  await page.setContent(
    `<style>${compiled}</style>` +
      `<div class="zk-query" style="width:320px" data-copy-slot="narrow">${card}</div>` +
      `<div class="zk-query" style="width:800px" data-copy-slot="wide">${card}</div>`,
  );
  await page.evaluate(() => document.documentElement.setAttribute("data-identity", "mist"));
  const out = await page.evaluate(() => {
    const read = (slot: string) => {
      const el = document.querySelector(`[data-copy-slot="${slot}"] [data-slot="card"]`)!;
      const header = el.querySelector('[data-slot="card-header"]')!;
      return {
        pad: getComputedStyle(header).paddingTop,
        radius: getComputedStyle(el).borderTopLeftRadius,
        title: getComputedStyle(el.querySelector('[data-slot="card-title"]')!).fontSize,
      };
    };
    return { narrow: read("narrow"), wide: read("wide") };
  });
  expect(out.narrow).toEqual({ pad: "12px", radius: "8px", title: "13px" });
  expect(out.wide).toEqual({ pad: "16px", radius: "12px", title: "14px" });
});

type Recipe = { pad: string; gap: string; radius: string; title: string; body: string };

async function cardRecipe(page: import("@playwright/test").Page, testid: string): Promise<Recipe> {
  return page.evaluate((id) => {
    const card = document.querySelector(`[data-testid="${id}"]`)!;
    const header = card.querySelector('[data-slot="card-header"]')!;
    const title = card.querySelector('[data-slot="card-title"]')!;
    const body = card.querySelector('[data-slot="card-description"]')!;
    return {
      pad: getComputedStyle(header).paddingTop,
      gap: getComputedStyle(header).gap,
      radius: getComputedStyle(card).borderTopLeftRadius,
      title: getComputedStyle(title).fontSize,
      body: getComputedStyle(body).fontSize,
    };
  }, testid);
}

test("card sizing contract: size x slot matrix (D-C2)", async ({ page }) => {
  // Real apps set an identity on <html>; the kit type scale scopes to it.
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-identity", "mist");
    const narrow = ["slot-sm-narrow", "slot-lg-narrow", "slot-nested", "slot-density", "slot-section", "slot-skel-narrow"];
    const wide = ["slot-sm-wide", "slot-lg-wide", "slot-container-query", "slot-override", "slot-skel-wide"];
    for (const id of narrow) (document.querySelector(`[data-testid="${id}"]`) as HTMLElement).style.width = "320px";
    for (const id of wide) (document.querySelector(`[data-testid="${id}"]`) as HTMLElement).style.width = "800px";
    document.querySelector('[data-testid="slot-section"]')!.setAttribute("data-wide", "");
  });
  // Section specimen: measure narrow first, then widen its slot.
  const sectionNarrow = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="section-recipe"]')!).paddingTop,
  );
  expect(sectionNarrow).toBe("32px");

  expect(await cardRecipe(page, "card-sm-narrow")).toEqual({ pad: "12px", gap: "6px", radius: "8px", title: "13px", body: "12px" });
  expect(await cardRecipe(page, "card-sm-wide")).toEqual({ pad: "16px", gap: "8px", radius: "12px", title: "14px", body: "13px" });
  expect(await cardRecipe(page, "card-lg-narrow")).toEqual({ pad: "20px", gap: "12px", radius: "16px", title: "17px", body: "14px" });
  expect(await cardRecipe(page, "card-lg-wide")).toEqual({ pad: "32px", gap: "20px", radius: "24px", title: "24px", body: "17px" });
  const skelNarrow = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="skel-lg-narrow"]')!;
    const s = getComputedStyle(el);
    return { pad: s.paddingTop, radius: s.borderTopLeftRadius };
  });
  const skelWide = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="skel-lg-wide"]')!;
    const s = getComputedStyle(el);
    return { pad: s.paddingTop, radius: s.borderTopLeftRadius };
  });
  expect(skelNarrow).toEqual({ pad: "20px", radius: "16px" });
  expect(skelWide).toEqual({ pad: "32px", radius: "24px" });
  // Size and space are separable inputs.
  const smWide = await cardRecipe(page, "card-sm-wide");
  const lgNarrow = await cardRecipe(page, "card-lg-narrow");
  expect(smWide).not.toEqual(lgNarrow);
  // Genuinely nested: inner follows its own narrow slot, outer keeps wide lg.
  expect(await cardRecipe(page, "card-nested-sm")).toEqual({ pad: "12px", gap: "6px", radius: "8px", title: "13px", body: "12px" });
  // Default recipe steps in a Container query slot; no slot = base recipe.
  expect(await cardRecipe(page, "card-default-wide")).toEqual({ pad: "32px", gap: "12px", radius: "16px", title: "17px", body: "14px" });
  expect(await cardRecipe(page, "card-no-query")).toEqual({ pad: "20px", gap: "12px", radius: "16px", title: "17px", body: "14px" });
  // Density composes: glass scope (--spacing .32rem), sm base pad = x3.
  const density = await cardRecipe(page, "card-density");
  expect(Number.parseFloat(density.pad)).toBeCloseTo(15.36, 1);
  // Override seams: consumer utility on the part wins over the recipe.
  const overridePad = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="card-override-header"]')!).paddingTop,
  );
  expect(overridePad).toBe("0px");
  // Recipe-var override seam: consumer sets the instance property.
  await page.evaluate(() => {
    (document.querySelector('[data-testid="card-override"]') as HTMLElement).style.setProperty("--zk-card-title", "32px");
  });
  const overrideTitle = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="card-override"] [data-slot="card-title"]')!).fontSize,
  );
  expect(overrideTitle).toBe("32px");
  // Wide section slot steps sm -> md rhythm.
  await page.evaluate(() => {
    (document.querySelector('[data-testid="slot-section"]') as HTMLElement).style.width = "800px";
  });
  const sectionWide = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-testid="section-recipe"]')!).paddingTop,
  );
  expect(sectionWide).toBe("48px");
});

test("card lg title does not change with viewport when the slot is fixed", async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-identity", "mist");
    (document.querySelector('[data-testid="slot-lg-wide"]') as HTMLElement).style.width = "500px";
  });
  await page.setViewportSize({ width: 600, height: 800 });
  const at600 = (await cardRecipe(page, "card-lg-wide")).title;
  await page.setViewportSize({ width: 800, height: 800 });
  await page.evaluate(() => {
    (document.querySelector('[data-testid="slot-lg-wide"]') as HTMLElement).style.width = "500px";
  });
  const at800 = (await cardRecipe(page, "card-lg-wide")).title;
  expect(at600).toBe(at800);
  expect(at600).toBe("24px");
});

test("card sizing contract: user font size 200% moves type and threshold (D-C2)", async ({ page }) => {
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-identity", "mist");
    (document.querySelector('[data-testid="slot-sm-wide"]') as HTMLElement).style.width = "800px";
    (document.querySelector('[data-testid="slot-sm-narrow"]') as HTMLElement).style.width = "320px";
  });
  // rem doubles: sm base recipe at doubled type; the 800px slot is now
  // below the 30rem (=960px) threshold, so wide and narrow agree.
  const narrow = await cardRecipe(page, "card-sm-narrow");
  const wide = await cardRecipe(page, "card-sm-wide");
  expect(narrow.title).toBe("26px");
  expect(wide).toEqual(narrow);
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
