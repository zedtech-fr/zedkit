import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("catalog filters persist in the URL and show empty state", async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "UI", exact: true }).click();
  await expect(page).toHaveURL(/area=ui/);
  await page.getByRole("searchbox", { name: "Catalog search" }).fill("zzzz-no-match-zzzz");
  await expect(page).toHaveURL(/q=zzzz/);
  await expect(page.getByText("No catalog entries match")).toBeVisible();
});

test("home links to catalog with curated grid", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Browse full catalog" })).toBeVisible();
  const count = await page.locator("#components .grid > *").count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(8);
});
