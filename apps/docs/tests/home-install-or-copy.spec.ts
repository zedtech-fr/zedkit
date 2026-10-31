import { expect, test } from "@playwright/test";

import { featuredRegistryBrick, registryBrickNames } from "../content/registry-site";
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

    await expect(page.getByRole("heading", { name: "Start building", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Install it or copy it", level: 3 })).toBeVisible();

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

  test("commands read in full at 360px without internal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const field = page.getByLabel("shadcn registry add command");
    await expect(field).toBeVisible();
    const box = await field.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      value: (el as HTMLTextAreaElement).value,
    }));
    expect(box.value).toBe(REGISTRY_CMD);
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight + 1);
  });

  test("neither choice card is mostly empty at laptop width (#1088)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const cards = page.locator("#install-or-copy [data-slot='card']");
    await expect(cards).toHaveCount(2);
    const emptyBottoms = await cards.evaluateAll((nodes) =>
      nodes.map((card) => {
        const rect = card.getBoundingClientRect();
        const content = card.querySelector("[data-slot='card-content']") ?? card;
        const last = content.lastElementChild?.getBoundingClientRect();
        return last ? Math.round(rect.bottom - last.bottom) : Math.round(rect.height);
      }),
    );
    // Tide is the site default: its larger type scale leaves ~122px under the
    // shorter card (was <=96 under Volt). Still guards against hollow cards.
    for (const empty of emptyBottoms) expect(empty).toBeLessThanOrEqual(128);
  });

  test("published brick names keep a decorative icon", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const list = page.locator("#install-or-copy [data-registry-bricks]");
    await expect(list.locator("[data-registry-brick]")).toHaveCount(registryBrickNames.length);
    await expect(list.locator("svg[aria-hidden='true']")).toHaveCount(registryBrickNames.length);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(true);
  });

  test.describe("home brick list light/dark (#769)", () => {
    for (const mode of ["light", "dark"] as const) {
      test(`mist ${mode}`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.addInitScript((theme) => {
          localStorage.setItem("zk-identity", "mist");
          localStorage.setItem("theme", theme);
        }, mode);
        await page.goto(BASE, { waitUntil: "networkidle" });
        const list = page.locator("#install-or-copy [data-registry-bricks]");
        await list.scrollIntoViewIfNeeded();
        await expect(list.getByText("badge", { exact: true })).toBeVisible();
        await list.screenshot({ path: `test-results/home-brick-list-${mode}.png` });
      });
    }
  });
});
