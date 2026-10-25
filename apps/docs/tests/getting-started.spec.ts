import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("getting started is first stop from docs index", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
  const startLink = page.getByRole("link", { name: "Getting started" }).first();
  await startLink.click();
  await page.waitForURL("**/docs/getting-started", { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Quickstart" })).toBeVisible();
  await expect(page.getByText("zedkit-ai validate")).toBeVisible();
});

test("getting started links to a catalog page", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Set up AI agent instructions" }).click();
  await page.waitForURL("**/docs/ai/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
