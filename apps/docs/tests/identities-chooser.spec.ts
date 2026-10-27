import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

// Relative paths: the config baseURL decides the port.
const PAGES = ["/", "/docs/getting-started"] as const;
const IDS = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

/** Picks an identity through the header chooser (desktop), as a visitor would. */
async function choose(page: Page, id: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  await page.getByRole("combobox", { name: "Identity" }).first().selectOption(id);
  await expect(page.locator("html")).toHaveAttribute("data-identity", id);
}

test("the header chooser lists the six identities, stock look until one is chosen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  await expect(page.locator("html")).not.toHaveAttribute("data-identity", /.*/);
  const chooser = page.getByRole("combobox", { name: "Identity" }).first();
  await expect(chooser).toBeVisible();
  expect(await chooser.locator("option").evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))).toEqual([...IDS]);
});

for (const id of IDS) {
  test.describe(`${id} chosen from the header`, () => {
    test("is kept across pages and reloads", async ({ page }) => {
      await choose(page, id);
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-identity", id);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-identity", id);
    });

    for (const theme of ["light", "dark"] as const) {
      test(`passes the a11y gate (contrast included) in ${theme}`, async ({ page }) => {
        await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
        await choose(page, id);
        for (const path of PAGES) {
          await page.goto(path, { waitUntil: "networkidle" });
          await expect(page.locator("html")).toHaveAttribute("data-identity", id);
          await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
          await page.evaluate(() => document.fonts.ready);
          await assertA11yGate(page);
        }
      });
    }

    for (const width of [360, 390] as const) {
      test(`does not overflow at ${width}px`, async ({ page }) => {
        await choose(page, id);
        await page.setViewportSize({ width, height: 800 });
        for (const path of PAGES) {
          await page.goto(path, { waitUntil: "networkidle" });
          await expect(page.locator("html")).toHaveAttribute("data-identity", id);
          await page.evaluate(() => document.fonts.ready);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow).toBeLessThanOrEqual(0);
        }
      });
    }
  });
}
