import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

async function axeDashboard(page: import("@playwright/test").Page) {
  const demo = page.getByLabel("Interactive admin dashboard demo");
  await expect(demo).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[aria-label="Interactive admin dashboard demo"]').analyze();
  expect(results.violations).toEqual([]);
}

test("home dashboard: create, edit, delete with axe on ready state", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await axeDashboard(page);

  await page.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByRole("cell", { name: "playwright-app" })).toBeVisible();

  await page.getByRole("row", { name: /playwright-app/ }).getByRole("button", { name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app-edited");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("cell", { name: "playwright-app-edited" })).toBeVisible();

  const row = page.getByRole("row", { name: /playwright-app-edited/ });
  await row.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("cell", { name: "playwright-app-edited" })).toHaveCount(0);
});

test("home dashboard: preview modes are keyboard reachable", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByLabel("Table preview").click();
  await page.getByRole("option", { name: "Loading" }).click();
  await expect(page.getByRole("table", { name: "Loading" })).toBeVisible();
  await axeDashboard(page);

  await page.getByLabel("Table preview").click();
  await page.getByRole("option", { name: "Empty" }).click();
  await expect(page.getByText("No apps yet. Choose Ready and click Add app.")).toBeVisible();
  await axeDashboard(page);

  await page.getByLabel("Table preview").click();
  await page.getByRole("option", { name: "Error" }).click();
  await expect(page.getByText("Could not load apps.")).toBeVisible();
  await axeDashboard(page);
});
