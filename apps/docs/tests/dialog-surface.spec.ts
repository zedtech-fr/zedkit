import { expect, test, type Page } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

async function expectOverlayChromeMatchesPanel(page: Page): Promise<void> {
  const ok = await page.evaluate(() => {
    const panel = document.querySelector('[data-slot="dialog-content"]');
    if (!panel) return false;
    const panelBg = getComputedStyle(panel).backgroundColor;
    const match = (el: Element | null) => {
      if (!el) return true;
      const bg = getComputedStyle(el).backgroundColor;
      return bg === "transparent" || bg === "rgba(0, 0, 0, 0)" || bg === panelBg;
    };
    return (
      match(document.querySelector('[data-slot="dialog-header"]')) &&
      match(document.querySelector('[data-slot="dialog-footer"]'))
    );
  });
  expect(ok).toBe(true);
}

for (const identity of DOCS_SHIPPED_IDENTITIES) {
  for (const mode of ["light", "dark"] as const) {
    for (const [device, width, height] of [
      ["desktop", 1280, 900],
      ["phone", 390, 844],
    ] as const) {
      test(`dialog demo ${identity} ${mode} ${device}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
        const preview = page.locator("[data-component-preview]").first();
        await pinDemoLook(preview, identity, mode);
        await page.getByRole("button", { name: "Open dialog" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(400);
        await expectOverlayChromeMatchesPanel(page);
        await expect(dialog).toHaveScreenshot(`dialog-${identity}-${mode}-${device}.png`, {
          animations: "disabled",
          maxDiffPixelRatio: 0.02,
        });
        await page.keyboard.press("Escape");
      });

      test(`confirm dialog demo ${identity} ${mode} ${device}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto("/docs/ui/confirm-destructive-actions", { waitUntil: "networkidle" });
        const preview = page.locator("[data-component-preview]").first();
        await pinDemoLook(preview, identity, mode);
        await page.getByRole("button", { name: "Delete" }).first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(400);
        await expectOverlayChromeMatchesPanel(page);
        await expect(dialog).toHaveScreenshot(`confirm-${identity}-${mode}-${device}.png`, {
          animations: "disabled",
          maxDiffPixelRatio: 0.02,
        });
        await page.keyboard.press("Escape");
      });
    }
  }
}
