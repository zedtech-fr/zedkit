import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

test("button demo shows sizes and disabled states (#1065)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.getByRole("button", { name: "Small" })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Default", exact: true })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Large" })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Add item" })).toBeVisible();
  await expect(preview.getByRole("button", { name: "Disabled" })).toBeDisabled();
  await expect(preview.getByRole("button", { name: "Saving…" })).toBeDisabled();
});

test("button page renders catalog accessibility guidance (#1082)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const accessibility = page.getByRole("heading", { name: "Accessibility", level: 2 });
  await accessibility.scrollIntoViewIfNeeded();
  await expect(accessibility).toBeVisible();
  await expect(page.locator("main")).toContainText("Native button");
  const props = page.getByRole("heading", { name: "Props", level: 2 });
  expect((await accessibility.boundingBox())!.y).toBeGreaterThan((await props.boundingBox())!.y);
});

test.describe("button demo a11y + themes (#152)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}: names, axe, screenshot`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(PAGE, { waitUntil: "networkidle" });

      const preview = page.locator("[data-component-preview]").first();
      await preview.scrollIntoViewIfNeeded();
      const create = preview.getByRole("button", { name: "Create app" });
      await expect(create).toBeVisible();
      await expect(preview.getByRole("button", { name: "Cancel" })).toBeVisible();
      await expect(preview.getByRole("button", { name: "Delete" })).toBeVisible();
      await expect(preview.getByRole("link", { name: "Docs link" })).toBeVisible();

      if (mode === "light") {
        await create.focus();
        await expect(create).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(preview.getByRole("button", { name: "Cancel" })).toBeFocused();
      }

      await assertA11yGate(page, "[data-component-preview]");
      await preview.screenshot({ path: `test-results/button-demo-${mode}.png` });

      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways).toBeLessThanOrEqual(1);
    });
  }
});
