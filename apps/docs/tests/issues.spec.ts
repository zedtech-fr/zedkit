import { expect, test, type Page } from "@playwright/test";

import { homeHeroCopy } from "../app/(home)/_home/i18n/home-hero-copy";

async function firstIssueRow(page: Page) {
  const rows = page.locator("main details[data-issues-row]");
  if ((await rows.count()) === 0) return null;
  return rows.first();
}

test("issue rows are native closed accordions that expand in place", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/issues");
  const first = await firstIssueRow(page);
  if (first === null) {
    await expect(page.getByText(/No public runs yet|Could not load public runs/)).toBeVisible();
    return;
  }
  await expect(first).not.toHaveAttribute("open");
  const summary = first.locator(":scope > summary");
  await expect(summary).toBeVisible();
  const box = await summary.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  await expect(summary.getByRole("link")).toHaveCount(0);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: "Timeline" })).toHaveCount(0);
  await expect(first.getByRole("link", { name: /GitHub issue #/ })).toBeVisible();
});

test("open=first and a home illustration click open the first accordion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: homeHeroCopy.heroIllustration.viewPublicRun }).click();
  await expect(page).toHaveURL(/\/issues\?open=first/);
  const fromHome = await firstIssueRow(page);
  if (fromHome !== null) await expect(fromHome).toHaveAttribute("open", "");
  expect(errors).toEqual([]);

  await page.goto("/issues#first", { waitUntil: "networkidle" });
  const fromHash = await firstIssueRow(page);
  if (fromHash !== null) await expect(fromHash).toHaveAttribute("open", "");

  const deep = page.locator("main details[data-issues-row]").nth(1);
  if ((await deep.count()) === 0) return;
  const deepId = await deep.getAttribute("id");
  expect(deepId).toBeTruthy();
  await page.goto(`/issues#${deepId}`, { waitUntil: "networkidle" });
  await expect(deep).toHaveAttribute("open", "");
  await expect(page.locator("main details[data-issues-row]").first()).not.toHaveAttribute("open");
});
