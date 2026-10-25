import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("home shows scenarios and reaches a doc page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "zedkit", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start from your situation" })).toBeVisible();
  const scenarioLink = page.getByRole("link", { name: "Open the doc page" }).first();
  await expect(scenarioLink).toBeVisible();
  await scenarioLink.click();
  await page.waitForURL("**/docs/**", { timeout: 10000 });
  expect(errors).toEqual([]);
});

test("home search opens from the header", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
});
