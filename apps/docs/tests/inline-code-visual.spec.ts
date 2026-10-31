import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const MOBILE = { width: 390, height: 844 };
const BUTTON = `${BASE}/docs/ui/trigger-actions-with-buttons`;

test.describe("quiet inline code (#zk-chips)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("zk-identity", "tide");
    });
  });

  test("home brick grid and npx field at 390px", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(BASE, { waitUntil: "networkidle" });
    const list = page.locator("#install-or-copy [data-registry-bricks]");
    await list.scrollIntoViewIfNeeded();
    await expect(list.locator("[data-registry-brick]").first()).toBeVisible();
    await expect(list.locator("svg[aria-hidden='true']")).toHaveCount(0);
    const field = page.getByLabel("shadcn registry add command");
    const nowrap = await field.evaluate((el) => getComputedStyle(el).whiteSpace);
    expect(nowrap).toBe("nowrap");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(true);
    await list.screenshot({ path: "test-results/home-bricks-390-tide.png" });
  });

  test("button page props and prose at 390px", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(BUTTON, { waitUntil: "networkidle" });
    const propCode = page.locator('[id^="type-table"] code').first();
    await expect(propCode).toBeVisible();
    const chipBorder = await propCode.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(chipBorder).toBe(0);
    const proseCode = page.locator("#nd-page .prose :not(pre) > code").first();
    await expect(proseCode).toBeVisible();
    const proseBorder = await proseCode.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(proseBorder).toBe(0);
    await page.locator("main").screenshot({ path: "test-results/button-page-390-tide.png" });
  });

  test("button page desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BUTTON, { waitUntil: "networkidle" });
    await page.locator('[id^="type-table"]').first().scrollIntoViewIfNeeded();
    await page.locator("main").screenshot({ path: "test-results/button-page-desktop-tide.png" });
  });
});
