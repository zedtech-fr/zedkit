import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const GUIDE = `${BASE}/docs/identities-and-theming`;
const IDENTITIES = ["soft", "retro-square", "studio", "deep", "luxe"] as const;
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
  "retro-square": { body: "Space Grotesk", heading: "Space Mono", radius: 0, border: 2, padding: 16.64, shadow: /4px 4px 0px 0px/ },
  studio: { body: "Inter Variable", heading: "Inter Variable", radius: 24, border: 1, padding: 16.64, shadow: /32px|12px/ },
  deep: { body: "Geist Variable", heading: "Geist Variable", radius: 6, border: 1, padding: 14.4, shadow: /0px 8px 20px -8px/ },
  luxe: { body: "Jost Variable", heading: "Cormorant Variable", radius: 2, border: 1, padding: 19.2, shadow: /28px|-18px/ },
};

test("switcher lists every identity, changes tokens, and persists", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(GUIDE, { waitUntil: "networkidle" });

  const switcher = identitySelect(page);
  await expect(switcher).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-identity", "soft");
  expect(await switcher.locator("option").evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value))).toEqual([
    ...IDENTITIES,
  ]);

  const soft = await measure(page);
  expect(soft.radius).toBe(12);
  expect(soft.border).toBe(1);
  expect(soft.padding).toBe(16);

  for (const identity of IDENTITIES.filter((i) => i !== "soft")) {
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
    expect(got.bodyFont, identity).not.toBe(soft.bodyFont);
  }

  await identitySelect(page).selectOption("luxe");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "luxe");
  await expect(identitySelect(page)).toHaveValue("luxe");
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).toBe("luxe");

  await identitySelect(page).selectOption("soft");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "soft");
  const back = await measure(page);
  expect(back.radius).toBe(soft.radius);
  expect(back.padding).toBe(soft.padding);
  expect(back.bodyFont).toBe(soft.bodyFont);
});

test("code blocks, tables and chrome follow the identity tokens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  async function surfaces() {
    return page.evaluate(() => {
      const pre = document.querySelector("main pre");
      const th = document.querySelector("main th");
      const nav = document.querySelector("#nd-nav") ?? document.querySelector("header");
      const preStyle = pre ? getComputedStyle(pre) : null;
      return {
        preRadius: preStyle ? parseFloat(preStyle.borderTopLeftRadius) : -1,
        preBorder: preStyle ? parseFloat(preStyle.borderTopWidth) : -1,
        thTransform: th ? getComputedStyle(th).textTransform : "",
        navBorder: nav ? parseFloat(getComputedStyle(nav).borderBottomWidth) : -1,
      };
    });
  }

  await page.goto(GUIDE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "soft");
  const soft = await surfaces();
  expect(soft.thTransform, "soft keeps the stock table head").not.toBe("uppercase");

  await identitySelect(page).selectOption("retro-square");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "retro-square");
  const retro = await surfaces();
  expect(retro.preRadius, "retro pre radius").toBe(0);
  expect(retro.preBorder, "retro pre border").toBe(2);
  expect(retro.thTransform, "retro table head").toBe("uppercase");
  expect(retro.navBorder, "retro nav border").toBe(2);

  await identitySelect(page).selectOption("luxe");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "luxe");
  const luxe = await surfaces();
  expect(luxe.preRadius, "luxe pre radius").toBe(2);
  expect(luxe.preBorder, "luxe pre border").toBe(1);
  expect(luxe.navBorder, "luxe nav border").toBe(1);
});

test("code blocks and chrome follow the identity in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seed(page, "luxe", "dark");
  await page.goto(GUIDE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "luxe");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const got = await page.evaluate(() => {
    const pre = document.querySelector("main pre");
    const nav = document.querySelector("#nd-nav") ?? document.querySelector("header");
    return {
      preBorder: pre ? parseFloat(getComputedStyle(pre).borderTopWidth) : -1,
      navBorder: nav ? parseFloat(getComputedStyle(nav).borderBottomWidth) : -1,
    };
  });
  expect(got.preBorder, "luxe dark pre border").toBe(1);
  expect(got.navBorder, "luxe dark nav border").toBe(1);
});

test("stored identity is applied before first paint", async ({ page }) => {
  await seed(page, "retro-square", "light");
  await page.goto(GUIDE, { waitUntil: "commit" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-identity"), undefined, {
    polling: "raf",
  });
  const first = await page.evaluate(() => document.documentElement.getAttribute("data-identity"));
  expect(first).toBe("retro-square");
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
        if (identity === "soft") {
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
