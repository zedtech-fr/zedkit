import { expect, test, type Page } from "@playwright/test";

const footerLink = (page: Page, name: string) =>
  page.locator("footer").getByRole("link", { name, exact: true });

test.describe("site shell", () => {
  test("home footer and header links", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByText("zedkit, by Zed Tech · MIT")).toBeVisible();
    await expect(footerLink(page, "GitHub (opens in a new tab)")).toBeVisible();
    const header = page.locator("#nd-nav");
    await expect(header.getByRole("link", { name: "Docs", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toBeVisible();
    await expect(header.getByRole("link", { name: "Get started", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guides" })).toHaveCount(0);
  });

  test("founder door: the honest no-code-first guide is still reachable (#1078)", async ({ page }) => {
    await page.goto("/docs/start-without-writing-code", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Start without writing code" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What zedkit is not" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Try the demo editor" }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("note list example explains itself and links back to the pattern doc (#1094)", async ({ page }) => {
    await page.goto("/examples/note-list", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "how the pattern is enforced" }),
    ).toHaveAttribute("href", "/docs/quality/enforce-feature-folder-ports-and-adapters");
    await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();
  });

  test("footer offers Docs and Catalog next steps (#1098)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
    await expect(footer.getByRole("link", { name: "Catalog", exact: true })).toHaveAttribute("href", "/catalog");
  });

  test("docs and 404 share the footer", async ({ page }) => {
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.getByText("zedkit, by Zed Tech · MIT")).toBeVisible();
    await page.goto("/missing-page", { waitUntil: "networkidle" });
    await expect(page.getByText("zedkit, by Zed Tech · MIT")).toBeVisible();
    await expect(footerLink(page, "zedtech.fr (opens in a new tab)")).toBeVisible();
  });
});
