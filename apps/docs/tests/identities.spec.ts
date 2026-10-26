import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const GUIDE = `${BASE}/docs/identities-and-theming`;
const IDENTITIES = ["soft", "retro-square"] as const;
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

test("identity switcher changes tokens only, persists, and is labelled", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(GUIDE, { waitUntil: "networkidle" });

  const switcher = identitySelect(page);
  await expect(switcher).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-identity", "soft");

  const soft = {
    radius: await rootVar(page, "--radius"),
    background: await rootVar(page, "--background"),
    font: await page.evaluate(() => getComputedStyle(document.body).fontFamily),
    border: await rootVar(page, "--zk-border-width"),
  };

  await switcher.selectOption("retro-square");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "retro-square");

  const retro = {
    radius: await rootVar(page, "--radius"),
    background: await rootVar(page, "--background"),
    font: await page.evaluate(() => getComputedStyle(document.body).fontFamily),
    border: await rootVar(page, "--zk-border-width"),
  };
  expect(retro.radius).not.toBe(soft.radius);
  expect(retro.background).not.toBe(soft.background);
  expect(retro.font).not.toBe(soft.font);
  expect(retro.border).not.toBe(soft.border);
  expect(retro.font).toContain("Inter Variable");

  const headingFont = await page.evaluate(() => getComputedStyle(document.querySelector("main h1")!).fontFamily);
  expect(headingFont).toContain("Play");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "retro-square");
  await expect(identitySelect(page)).toHaveValue("retro-square");
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).toBe("retro-square");

  await identitySelect(page).selectOption("soft");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "soft");
  expect(await rootVar(page, "--radius")).toBe(soft.radius);
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
  expect(backgrounds.size).toBe(4);
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
        const results = await scan.analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }
}
