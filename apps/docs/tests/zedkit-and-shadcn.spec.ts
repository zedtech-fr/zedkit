import { expect, test } from "@playwright/test";

const PAGE = "http://127.0.0.1:3100/docs/zedkit-and-shadcn";

test("zedkit and shadcn guide links to catalog and package.json", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "npm install vs registry" })).toBeVisible();
  await expect(page.getByRole("link", { name: "packages/ui/package.json" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Getting started" })).toBeVisible();
});
