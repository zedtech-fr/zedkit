import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Guide fences with preview="<DemoKey>" render their live demo above the code.
test.describe("guide previews", () => {
  test("getting started shows the Save / Delete buttons it builds", async ({ page }) => {
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    const live = page.getByText("Live preview", { exact: true });
    await expect(live).toHaveCount(1);
    const frame = live.locator("xpath=ancestor::*[.//button[normalize-space()='Save']][1]");
    await expect(frame.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(frame.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("admin dashboard guide shows the table, drawer and confirm dialog", async ({ page }) => {
    await page.goto("/docs/build-an-admin-dashboard", { waitUntil: "networkidle" });
    await expect(page.getByText("Live preview", { exact: true })).toHaveCount(1);
    const row = page.getByRole("row", { name: /reports-api/ });
    await expect(row).toBeVisible();
    await expect(page.getByRole("row", { name: /billing-worker/ })).toBeVisible();
    await row.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: "Edit reports-api" })).toBeVisible();
    await page.keyboard.press("Escape");
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("dialog", { name: "Delete reports-api?" })).toBeVisible();
    const results = await new AxeBuilder({ page }).include("[role=dialog]").analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("reveal-on-scroll preview reveals its three tasks", async ({ page }) => {
    await page.goto("/docs/ui/animate-entrances-and-hover-feedback-with-css-utilities", { waitUntil: "networkidle" });
    const stage = page.locator("[data-stagger]").filter({ hasText: "Publish the sale banner" });
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute("data-stagger", "in");
    await expect(stage.getByText("Publish the sale banner")).toBeVisible();
  });

  test("a no-preview excuse renders no preview for route-only files", async ({ page }) => {
    await page.goto("/docs/ui/render-a-route-as-a-modal-over-the-list", { waitUntil: "networkidle" });
    await expect(page.getByText("Live preview", { exact: true })).toHaveCount(0);
  });
});
