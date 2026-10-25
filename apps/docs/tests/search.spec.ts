import { expect, test } from "@playwright/test";

// Local dev (`pnpm dev`) and the CI smoke job both serve the docs on :3100.
const BASE = "http://127.0.0.1:3100";

test("search finds grouped results and navigates", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  // "review" matches "Preview" sections via 1-edit typo tolerance.
  await dialog.locator("input").fill("review");
  // Scope to the listbox: the dialog also contains the ESC close button.
  const results = dialog.locator('[role="listbox"] [role="option"]');
  await expect(results.first()).toBeVisible({ timeout: 10000 });
  // Grouped context: section crumb next to the result title.
  await expect(dialog.getByText("Docs").first()).toBeVisible();
  await results.first().click();
  await page.waitForURL("**/docs/**", { timeout: 10000 });
  expect(errors).toEqual([]);
});

test("unknown query shows the empty state", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("zzzqqqwry");
  await expect(dialog.getByText("No results found")).toBeVisible({
    timeout: 10000,
  });
});

test("keyboard navigates to a result", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("button");
  const results = dialog.locator('[role="listbox"] [role="option"]');
  await expect(results.first()).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/docs/**", { timeout: 10000 });
});

test("escape closes the search dialog", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
