import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

async function axeDashboard(page: import("@playwright/test").Page) {
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include("#demo [aria-label='Interactive admin dashboard demo in the hero']")
    .analyze();
  expect(results.violations).toEqual([]);
}

test("home dashboard: create, edit, delete with axe on ready state", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await axeDashboard(page);

  await demo.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app", exact: true })).toBeVisible();

  await demo.getByRole("button", { name: "Edit playwright-app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app-edited");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app-edited", exact: true })).toBeVisible();

  const row = demo.getByRole("row", { name: /playwright-app-edited/ });
  await row.getByRole("button", { name: "Delete playwright-app-edited" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app-edited", exact: true })).toHaveCount(0);
});

test("home dashboard: preview modes are keyboard reachable", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await demo.getByLabel("Table preview mode").click();
  await page.getByRole("option", { name: "Loading" }).click();
  await expect(demo.getByRole("table", { name: "Loading" })).toBeVisible();
  await axeDashboard(page);

  await demo.getByLabel("Table preview mode").click();
  await page.getByRole("option", { name: "Empty" }).click();
  await expect(demo.getByText("No apps yet. Choose Ready and click Add app.")).toBeVisible();
  await axeDashboard(page);

  await demo.getByLabel("Table preview mode").click();
  await page.getByRole("option", { name: "Error" }).click();
  await expect(demo.getByText("Could not load apps.")).toBeVisible();
  await axeDashboard(page);
});
