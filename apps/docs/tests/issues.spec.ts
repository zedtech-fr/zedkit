import { expect, test } from "@playwright/test";

test("issue rows are native closed accordions that expand in place", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/issues");
  const rows = page.locator("main details[data-issues-row]");
  if ((await rows.count()) === 0) {
    await expect(page.getByText(/No public runs yet|Could not load public runs/)).toBeVisible();
    return;
  }
  const first = rows.first();
  await expect(first).not.toHaveAttribute("open");
  const summary = first.locator(":scope > summary");
  await expect(summary).toBeVisible();
  const box = await summary.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: "Timeline" })).toBeVisible();
});
