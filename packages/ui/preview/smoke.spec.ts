import { expect, test } from "@playwright/test";

const SECTIONS = ["primitives", "overlays", "data-table", "layout", "wizard"];

test("gallery renders every section with no errors (light)", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  await page.goto("/");
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator("text=Page 1 of 0")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open dialog" })).toBeVisible();
  expect(problems).toEqual([]);
  await page.screenshot({ path: "test-results/gallery-light.png", fullPage: true });
});

test("gallery renders the dark theme with no errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  await page.goto("/dark");
  await expect(page.locator("html.dark")).toHaveCount(1);
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  expect(problems).toEqual([]);
  await page.screenshot({ path: "test-results/gallery-dark.png", fullPage: true });
});
