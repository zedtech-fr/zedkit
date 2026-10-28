import { expect, test } from "@playwright/test";

import { featuredRegistryBrick } from "../content/registry-site";
import { registryShadcnAddCommand } from "../lib/registry-shadcn-command";

const BASE = "http://127.0.0.1:3100";
const SITE_URL = "https://zedkit.app";
const PACKAGE_CMD = "pnpm add @zedtech/zedkit-ui";
const REGISTRY_CMD = registryShadcnAddCommand(SITE_URL, featuredRegistryBrick);

test.describe("home install or copy block (#419)", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("placement, clipboard, and mobile width at 390px", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    await expect(page.getByRole("link", { name: "Install or copy" }).first()).toBeVisible();

    const aiSetup = page.locator("#ai-setup");
    const installOrCopy = page.locator("#install-or-copy");
    const scenarios = page.locator("#scenarios");
    await expect(installOrCopy).toBeVisible();

    const aiBox = await aiSetup.boundingBox();
    const blockBox = await installOrCopy.boundingBox();
    const scenariosBox = await scenarios.boundingBox();
    expect(aiBox && blockBox && scenariosBox).toBeTruthy();
    expect(blockBox!.y).toBeGreaterThan(aiBox!.y);
    expect(blockBox!.y).toBeLessThan(scenariosBox!.y);

    await page.getByRole("button", { name: "Copy package install command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PACKAGE_CMD);

    await page.getByRole("button", { name: "Copy shadcn registry command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(REGISTRY_CMD);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
