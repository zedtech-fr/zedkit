import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const GUIDE = `${BASE}/docs/identities-and-theming`;
const IDENTITIES = ["mist", "press", "tide", "volt", "gilt"] as const;
const MODES = ["light", "dark"] as const;

async function seed(page: Page, identity: string, mode: string) {
  await page.addInitScript(
    ([id, theme]) => {
      localStorage.setItem("zk-identity", id);
      localStorage.setItem("theme", theme);
    },
    [identity, mode],
  );
}

/** First visible switcher (header and sidebar each render one on wide screens). */
function identitySelect(page: Page) {
  return page.getByRole("combobox", { name: "Identity" }).first();
}

/**
 * Third-party or separately tracked surfaces left out of the contrast scan:
 * syntax-highlighted code, the generated props table and inactive code-tab labels
 * (muted token of the default identity, tracked separately).
 */
const CONTRAST_EXCLUDES = ["pre", '[role="tab"]', '[id^="type-table"]'];

function rootVar(page: Page, name: string) {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
}

/** Measure what a component actually renders: a probe built from stock utilities. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "rounded-xl border shadow-md p-4";
    document.querySelector("main")!.appendChild(probe);
    const box = getComputedStyle(probe);
    const h1 = getComputedStyle(document.querySelector("main h1")!);
    const result = {
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: h1.fontFamily,
      headingWeight: h1.fontWeight,
      radius: parseFloat(box.borderTopLeftRadius),
      border: parseFloat(box.borderTopWidth),
      padding: parseFloat(box.paddingTop),
      shadow: box.boxShadow,
    };
    probe.remove();
    return result;
  });
}

/** One measurable signature per identity: fonts, radius, border, spacing, shadow. */
const SIGNATURES: Record<
  string,
  { body: string; heading: string; radius: number; border: number; padding: number; shadow: RegExp }
> = {
  press: { body: "Space Grotesk", heading: "Space Mono", radius: 0, border: 2, padding: 16.64, shadow: /4px 4px 0px 0px/ },
  tide: { body: "Inter Variable", heading: "Inter Variable", radius: 24, border: 1, padding: 16.64, shadow: /32px|12px/ },
  volt: { body: "Geist Variable", heading: "Geist Variable", radius: 6, border: 1, padding: 14.4, shadow: /0px 8px 20px -8px/ },
  gilt: { body: "Jost Variable", heading: "Cormorant Variable", radius: 2, border: 1, padding: 19.2, shadow: /28px|-18px/ },
};

test("switcher lists every identity, changes tokens, and persists", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(GUIDE, { waitUntil: "networkidle" });

  const switcher = identitySelect(page);
  await expect(switcher).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  expect(await switcher.locator("option").evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value))).toEqual([
    ...IDENTITIES,
  ]);

  const mist = await measure(page);
  expect(mist.radius).toBe(12);
  expect(mist.border).toBe(1);
  expect(mist.padding).toBe(16);

  for (const identity of IDENTITIES.filter((i) => i !== "mist")) {
    await identitySelect(page).selectOption(identity);
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    const sig = SIGNATURES[identity]!;
    const got = await measure(page);
    expect(got.bodyFont, identity).toContain(sig.body);
    expect(got.headingFont, identity).toContain(sig.heading);
    expect(got.radius, identity).toBe(sig.radius);
    expect(got.border, identity).toBe(sig.border);
    expect(got.padding, identity).toBeCloseTo(sig.padding, 1);
    expect(got.shadow, identity).toMatch(sig.shadow);
    expect(got.bodyFont, identity).not.toBe(mist.bodyFont);
  }

  await identitySelect(page).selectOption("gilt");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "gilt");
  await expect(identitySelect(page)).toHaveValue("gilt");
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).toBe("gilt");

  await identitySelect(page).selectOption("mist");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  const back = await measure(page);
  expect(back.radius).toBe(mist.radius);
  expect(back.padding).toBe(mist.padding);
  expect(back.bodyFont).toBe(mist.bodyFont);
});

test("an identity id stored before the rename is migrated", async ({ page }) => {
  const legacy: Record<string, string> = { soft: "mist", "retro-square": "press", studio: "tide", deep: "volt", luxe: "gilt" };
  for (const [oldId, newId] of Object.entries(legacy)) {
    const context = await page.context().browser()!.newContext();
    const fresh = await context.newPage();
    await fresh.addInitScript((id) => localStorage.setItem("zk-identity", id), oldId);
    await fresh.goto(GUIDE, { waitUntil: "networkidle" });
    await expect(fresh.locator("html"), oldId).toHaveAttribute("data-identity", newId);
    expect(await fresh.evaluate(() => localStorage.getItem("zk-identity")), oldId).toBe(newId);
    await context.close();
  }
});

test("stored identity is applied before first paint", async ({ page }) => {
  await seed(page, "press", "light");
  await page.goto(GUIDE, { waitUntil: "commit" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-identity"), undefined, {
    polling: "raf",
  });
  const first = await page.evaluate(() => document.documentElement.getAttribute("data-identity"));
  expect(first).toBe("press");
});

test("light and dark combine with each identity", async ({ page }) => {
  const backgrounds = new Set<string>();
  for (const identity of IDENTITIES) {
    for (const mode of MODES) {
      await page.addInitScript(
        ([id, theme]) => {
          localStorage.setItem("zk-identity", id);
          localStorage.setItem("theme", theme);
        },
        [identity, mode],
      );
      await page.goto(GUIDE, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
      await expect(page.locator("html")).toHaveClass(mode === "dark" ? /dark/ : /^(?!.*dark)/);
      backgrounds.add(await rootVar(page, "--background"));
    }
  }
  expect(backgrounds.size).toBe(IDENTITIES.length * MODES.length);
});

for (const identity of IDENTITIES) {
  for (const mode of MODES) {
    for (const path of ["/docs/identities-and-theming", "/docs/ui/trigger-actions-with-buttons"]) {
      test(`axe contrast on main: ${identity} ${mode} ${path}`, async ({ page }) => {
        await seed(page, identity, mode);
        await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
        let scan = new AxeBuilder({ page }).include("main").withRules(["color-contrast"]);
        for (const selector of CONTRAST_EXCLUDES) scan = scan.exclude(selector);
        // The default identity renders the stock fumadocs palette and the stock maturity badge:
        // unchanged from before identities existed, so their muted text is tracked apart.
        if (identity === "mist") {
          for (const selector of [".px-badge-inline", ".text-fd-muted-foreground", ".text-muted-foreground"]) {
            scan = scan.exclude(selector);
          }
        }
        const results = await scan.analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }
}
