import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
] as const;

const HOME = "/";

async function assertShellIdentity(page: import("@playwright/test").Page) {
  await expect(page.locator("#nd-nav select, #nd-mobile-nav select")).toHaveCount(0);
  await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toHaveCount(0);
}

async function assertNoVisibleNativeSelectOnHome(page: import("@playwright/test").Page) {
  const visible = await page.locator('main select:not([aria-hidden="true"])').evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = window.getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden";
    }).length,
  );
  expect(visible).toBe(0);
}

async function assertNoLatestInHero(page: import("@playwright/test").Page) {
  await expect(page.getByText(/^Latest in v/)).toHaveCount(0);
}

async function assertOmittedIdentityDocsRedirect(page: import("@playwright/test").Page) {
  for (const path of [
    "/docs/ui/design-your-identity",
    "/docs/ui/switch-the-visual-identity-with-one-attribute",
  ]) {
    const response = await page.goto(path, { waitUntil: "commit" });
    expect(response?.status(), path).toBeLessThan(400);
    await expect(page).not.toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}(\\?|$)`));
  }
}

test("omitted identity doc URLs redirect away from catalog pages", async ({ page }) => {
  await assertOmittedIdentityDocsRedirect(page);
});

for (const theme of ["light", "dark"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`clean storage shell QA ${theme} ${viewport.width}px`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
      await page.setViewportSize(viewport);
      await page.goto(HOME, { waitUntil: "networkidle" });
      await assertShellIdentity(page);
      await assertNoVisibleNativeSelectOnHome(page);
      await assertNoLatestInHero(page);
    });

    test(`dirty legacy storage shell QA ${theme} ${viewport.width}px`, async ({ page }) => {
      await page.addInitScript((mode) => {
        localStorage.setItem("theme", mode);
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("zk-identity-custom", ":root{--spacing:0.5rem}");
      }, theme);
      await page.setViewportSize(viewport);
      await page.goto(HOME, { waitUntil: "networkidle" });
      await assertShellIdentity(page);
      await assertNoVisibleNativeSelectOnHome(page);
      await assertNoLatestInHero(page);
    });
  }
}
