import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

test.describe("home dashboard mobile (#388)", () => {
  test.use({ viewport: MOBILE });

  test("single card chrome, toolbar row, compact row actions", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const bordered = await page.locator("[data-home-dashboard-card]").evaluate((card) => {
      const demo = card.querySelector('[aria-label="Interactive admin dashboard demo"]');
      if (!demo) return { ok: false, reason: "demo missing" };
      const cardBorder = getComputedStyle(card).borderTopWidth;
      const demoBorder = getComputedStyle(demo).borderTopWidth;
      return { ok: cardBorder !== "0px" && demoBorder === "0px", cardBorder, demoBorder };
    });
    expect(bordered, JSON.stringify(bordered)).toMatchObject({ ok: true });

    const toolbar = page.locator("[data-demo-toolbar]");
    await expect(toolbar).toBeVisible();
    const toolbarRow = toolbar.locator("> div").last();
    const tops = await toolbarRow.locator("button, [role=combobox]").evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().top),
    );
    expect(tops.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(4);

    const actionStacks = page.locator("[data-demo-row-actions]");
    await expect(actionStacks.first()).toBeVisible();
    const stacked = await actionStacks.first().evaluate((row) => {
      const buttons = row.querySelectorAll("button");
      if (buttons.length < 2) return { ok: false };
      const tops = [...buttons].map((b) => b.getBoundingClientRect().top);
      return { ok: Math.max(...tops) - Math.min(...tops) < 4, tops };
    });
    expect(stacked, JSON.stringify(stacked)).toMatchObject({ ok: true });

    await expect(page.getByText("Page 1 of 1")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
});
