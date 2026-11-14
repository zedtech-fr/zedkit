import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const GETTING_STARTED_INSTALL = "/docs/getting-started#install-or-copy";

test.describe("home paste no longer points at Getting started install", () => {
  async function openHome(page: Page, width = 1280) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const paste = page.locator("#paste");
    await paste.scrollIntoViewIfNeeded();
    return paste;
  }

  test("home no longer hosts adoption tabs; Getting started keeps the install heading", async ({ page }) => {
    const paste = await openHome(page);
    await expect(page.getByRole("heading", { name: "Start your way", level: 2 })).toHaveCount(0);
    await expect(page.locator("#install-or-copy")).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "How to adopt" })).toHaveCount(0);
    await expect(paste.locator("[data-home-full-steps]")).toHaveCount(0);
    await expect(paste.locator("[data-home-paste-lands]")).toBeVisible();

    const response = await page.goto(GETTING_STARTED_INSTALL, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Install or copy", level: 2 })).toBeVisible();
  });

  for (const width of [320, 390, 768]) {
    test(`fits ${width}px: no sideways page scroll${width < 640 ? ", 44px copy target" : ""}`, async ({ page }) => {
      const paste = await openHome(page, width);
      const measure = await paste.evaluate((root) => {
        const copy = [...root.querySelectorAll("button")].map((el) => ({
          name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName,
          rect: el.getBoundingClientRect(),
        }));
        return {
          small: copy
            .filter(({ rect }) => rect.height > 0 && (rect.height < 43.5 || rect.width < 43.5))
            .map(({ name, rect }) => `${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      if (width < 640) expect(measure.small).toEqual([]);
      expect(measure.overflow).toBeLessThanOrEqual(0);
    });
  }

  for (const mode of ["light", "dark"] as const) {
    test(`passes the a11y gate on the paste band (${mode})`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      const paste = await openHome(page);
      const timeline = paste.locator("[data-animate-stagger]");
      await expect(timeline).toHaveAttribute("data-animate-state", "in");
      await expect(timeline.locator(":scope > li").last()).toHaveCSS("opacity", "1");
      await assertA11yGate(page, "#paste");
      await page.screenshot({ path: `test-results/home-paste-${mode}.png` });
    });
  }
});
