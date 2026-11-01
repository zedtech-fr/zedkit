import { expect, test } from "@playwright/test";

import { registryShadcnGithubCommand } from "../lib/registry-shadcn-github-command";
import { featuredRegistryBrick } from "../content/registry-site";

const BASE = "http://127.0.0.1:3100";
const PACKAGE_CMD = "pnpm add @zedtech/zedkit-ui";
const REGISTRY_CMD = registryShadcnGithubCommand(featuredRegistryBrick);

test.describe("home install or copy section", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("placement, clipboard, and mobile width at 390px", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Get started", level: 2 })).toBeVisible();

    const installOrCopy = page.locator("#install-or-copy");
    const components = page.locator("#components");
    await expect(installOrCopy).toBeVisible();

    await expect(installOrCopy.locator("[data-install-command]")).toHaveCount(1);
    await installOrCopy.getByRole("button", { name: "Copy package install command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PACKAGE_CMD);

    await page.getByRole("tab", { name: "Copy source" }).click();
    await expect(installOrCopy.locator("[data-install-command]")).toHaveCount(1);
    await page.getByRole("button", { name: "Copy shadcn registry command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(REGISTRY_CMD);

    const entryPoints = page.locator("#entry-points");
    const aiBox = await entryPoints.locator("#ai-setup").boundingBox();
    const blockBox = await installOrCopy.boundingBox();
    const componentsBox = await components.boundingBox();
    expect(aiBox && blockBox && componentsBox).toBeTruthy();
    expect(blockBox!.y).toBeLessThan(componentsBox!.y);
    expect(componentsBox!.y).toBeLessThan(aiBox!.y);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  async function expectSingleLineCommand(page: import("@playwright/test").Page, label: string) {
    const pre = page.locator("#install-or-copy").getByRole("region", { name: label, exact: true });
    await expect(pre).toBeVisible();
    const box = await pre.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        whiteSpace: style.whiteSpace,
      };
    });
    expect(["pre", "nowrap"]).toContain(box.whiteSpace);
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight + 1);
  }

  test("npm tab keeps the package command once in Get started (not in the hero)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator("[data-home-hero-lead] [data-install-command]")).toHaveCount(0);
    await expect(page.locator("#install-or-copy [data-install-command]")).toHaveCount(1);
    await page.getByRole("tab", { name: "Copy source" }).click();
    await expect(page.locator("#install-or-copy [data-install-command]")).toHaveCount(1);
    await expectSingleLineCommand(page, "shadcn registry add command");
  });

  test("copy buttons sit inside the command block", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Copy source" }).click();
    const block = page.locator("#install-or-copy [data-install-command]").first();
    await expect(block).toBeVisible();
    const copy = block.getByRole("button");
    await expect(copy).toBeVisible();
    const inside = await copy.evaluate((btn) => {
      const shell = btn.closest("[data-install-command]");
      return shell?.contains(btn) ?? false;
    });
    expect(inside).toBe(true);
    await copy.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(REGISTRY_CMD);
  });

  test("install path tabs switch the visible command", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator("#install-or-copy [data-install-command]")).toHaveCount(1);
    await page.getByRole("tab", { name: "Copy source" }).click();
    await expect(page.getByRole("region", { name: "shadcn registry add command" })).toBeVisible();
    await page.getByRole("tab", { name: "npm", exact: true }).click();
    await expect(page.getByRole("region", { name: "Package install command" })).toBeVisible();
    await expect(page.locator("#install-or-copy [data-install-command]")).toHaveCount(1);
  });

  test.skip("choice cards match height at laptop width — removed with tabbed install", async () => {});

  test.describe("install section light/dark", () => {
    for (const mode of ["light", "dark"] as const) {
      test(`mist ${mode} at 390px`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 900 });
        await page.addInitScript((theme) => {
          localStorage.setItem("zk-docs-site-identity", "mist");
          localStorage.setItem("zk-docs-site-identity-opt-in", "1");
          localStorage.setItem("theme", theme);
        }, mode);
        await page.goto(BASE, { waitUntil: "networkidle" });
        const section = page.locator("#install-or-copy");
        await section.scrollIntoViewIfNeeded();
        await page.getByRole("tab", { name: "Copy source" }).click();
        await expectSingleLineCommand(page, "shadcn registry add command");
        await section.screenshot({ path: `test-results/home-install-section-${mode}-390.png` });
      });

      test(`mist ${mode} at 1280px`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.addInitScript((theme) => {
          localStorage.setItem("zk-docs-site-identity", "mist");
          localStorage.setItem("zk-docs-site-identity-opt-in", "1");
          localStorage.setItem("theme", theme);
        }, mode);
        await page.goto(BASE, { waitUntil: "networkidle" });
        const section = page.locator("#install-or-copy");
        await section.scrollIntoViewIfNeeded();
        await section.screenshot({ path: `test-results/home-install-section-${mode}-1280.png` });
      });
    }
  });
});
