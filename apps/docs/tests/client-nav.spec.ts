import { expect, test, type Page } from "@playwright/test";

import { siteChromeCopy } from "../components/site-chrome/i18n/site-chrome-copy";

const HOME_NAME = siteChromeCopy.brand.homeAriaLabel;

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) {
      errors.push(message.text().slice(0, 200));
    }
  });
  return errors;
}

async function openPhoneMenu(page: Page) {
  const menu = page.locator("#nd-mobile-nav").getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("desktop client navigation from issues, docs, and catalog stays clean", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("/issues", { waitUntil: "networkidle" });
  await page.locator("#nd-nav").getByRole("link", { name: HOME_NAME }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/docs", { waitUntil: "networkidle" });
  await page.locator("#nd-nav").getByRole("link", { name: "Issues", exact: true }).click();
  await expect(page).toHaveURL("/issues");
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();

  await page.goto("/catalog", { waitUntil: "networkidle" });
  await page.locator("#nd-nav").getByRole("link", { name: "Issues", exact: true }).click();
  await expect(page).toHaveURL("/issues");
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("phone client navigation from issues, docs, and catalog stays clean", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto("/issues", { waitUntil: "networkidle" });
  await page.locator("#nd-mobile-nav").getByRole("link", { name: HOME_NAME }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/docs", { waitUntil: "networkidle" });
  const docsMenu = await openPhoneMenu(page);
  await docsMenu.getByRole("link", { name: "Issues", exact: true }).click();
  await expect(page).toHaveURL("/issues");
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();

  await page.goto("/catalog", { waitUntil: "networkidle" });
  const catalogMenu = await openPhoneMenu(page);
  await catalogMenu.getByRole("link", { name: "Issues", exact: true }).click();
  await expect(page).toHaveURL("/issues");
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible();

  expect(errors).toEqual([]);
});
