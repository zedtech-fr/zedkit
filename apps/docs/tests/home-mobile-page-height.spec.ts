import { expect, test } from "@playwright/test";

import { HOME_MOBILE_PAGE_MAX_SCROLL_PX } from "@/ui/home/home-rhythm";

const MOBILE = { width: 390, height: 844 };

test.describe("home mobile page height (L2e)", () => {
  test.use({ viewport: MOBILE });

  test("the home page fits the audit scroll budget on a phone", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const height = await page.evaluate(() => document.querySelector("#home-page")?.scrollHeight ?? 0);
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThanOrEqual(HOME_MOBILE_PAGE_MAX_SCROLL_PX);
  });
});
