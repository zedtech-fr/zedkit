import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("docs index uses UI and Core & server area headings (#417)", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Four areas", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "UI (`@zedtech/zedkit-ui`)", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Core & server (`core`, `server`, `nest`)", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("### Admin UI", { exact: false })).toHaveCount(0);
});
