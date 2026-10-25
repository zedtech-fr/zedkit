import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const footerLink = (page: Page, name: string) => page.getByRole("link", { name, exact: true });

test.describe("site shell", () => {
  test("home footer and header links", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "MIT License")).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "Documentation", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guides" })).toBeVisible();
  });

  test("docs and 404 share the footer", async ({ page }) => {
    await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await page.goto(`${BASE}/missing-page`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "Report a bug")).toBeVisible();
  });
});
