import { expect, test } from "@playwright/test";

import { featuredRegistryBrick, registryBrickNames } from "../content/registry-site";
import { registryShadcnGithubCommand } from "../lib/registry-shadcn-github-command";

const BASE = "http://127.0.0.1:3100";
const PACKAGE_CMD = "pnpm add @zedtech/zedkit-ui";
const REGISTRY_CMD = registryShadcnGithubCommand(featuredRegistryBrick);
const REGISTRY_COMPONENT_COUNT = registryBrickNames.filter((name) => name !== "theme").length;

test.describe("home install or copy section", () => {
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
    const proofs = page.locator("#proofs");
    await expect(installOrCopy).toBeVisible();

    const aiBox = await aiSetup.boundingBox();
    const blockBox = await installOrCopy.boundingBox();
    const proofsBox = await proofs.boundingBox();
    expect(aiBox && blockBox && proofsBox).toBeTruthy();
    expect(blockBox!.y).toBeGreaterThan(aiBox!.y);
    expect(blockBox!.y).toBeLessThan(proofsBox!.y);

    await page.getByRole("button", { name: "Copy package install command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PACKAGE_CMD);

    await page.getByRole("button", { name: "Copy shadcn registry command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(REGISTRY_CMD);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  async function expectSingleLineCommand(page: import("@playwright/test").Page, label: string) {
    const pre = page.getByLabel(label, { exact: true });
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

  test("commands stay on one line with horizontal scroll at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expectSingleLineCommand(page, "Package install command");
    await expectSingleLineCommand(page, "shadcn registry add command");
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

  test("copy buttons sit inside the command block", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const blocks = page.locator("#install-or-copy [data-install-command]");
    await expect(blocks).toHaveCount(2);
    for (let i = 0; i < 2; i += 1) {
      const block = blocks.nth(i);
      const copy = block.getByRole("button");
      await expect(copy).toBeVisible();
      const inside = await copy.evaluate((btn) => {
        const shell = btn.closest("[data-install-command]");
        return shell?.contains(btn) ?? false;
      });
      expect(inside).toBe(true);
    }
  });

  test("choice cards match height at laptop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const heights = await page.locator("#install-or-copy [data-install-path-card]").evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
    );
    expect(heights).toHaveLength(2);
    expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThanOrEqual(4);
  });

  test("registry catalog link replaces the brick pill wall", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.locator("#install-or-copy [data-registry-bricks]")).toHaveCount(0);
    await expect(
      page.getByRole("link", {
        name: `${REGISTRY_COMPONENT_COUNT} components available in the registry → Catalog`,
      }),
    ).toHaveAttribute("href", "/docs");
  });

  test.describe("install section light/dark", () => {
    for (const mode of ["light", "dark"] as const) {
      test(`mist ${mode} at 390px`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 900 });
        await page.addInitScript((theme) => {
          localStorage.setItem("zk-identity", "mist");
          localStorage.setItem("theme", theme);
        }, mode);
        await page.goto(BASE, { waitUntil: "networkidle" });
        const section = page.locator("#install-or-copy");
        await section.scrollIntoViewIfNeeded();
        await expectSingleLineCommand(page, "Package install command");
        await section.screenshot({ path: `test-results/home-install-section-${mode}-390.png` });
      });

      test(`mist ${mode} at 1280px`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.addInitScript((theme) => {
          localStorage.setItem("zk-identity", "mist");
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
