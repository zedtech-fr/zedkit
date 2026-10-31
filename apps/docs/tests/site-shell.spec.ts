import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const footerLink = (page: Page, name: string) =>
  page.locator("footer").getByRole("link", { name, exact: true });

test.describe("site shell", () => {
  test("home footer and header links", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "MIT License")).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "Documentation", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guides" })).toBeVisible();
  });

  test("founder door: footer entry opens the honest no-code-first guide (#1078)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(footerLink(page, "Start without writing code")).toBeVisible();
    await page.goto(`${BASE}/docs/start-without-writing-code`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Start without writing code" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What zedkit is not" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Design your identity" }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("docs and 404 share the footer", async ({ page }) => {
    await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await page.goto(`${BASE}/missing-page`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "Report a bug")).toBeVisible();
  });
});
