import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DRAWER_PAGE = "/docs/ui/slide-in-a-drawer-panel";
const MOBILE = { width: 390, height: 844 };

test.describe("drawer mobile sheet (refs #425)", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("opens as a bottom sheet with motion, context, and close target", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (event) => errors.push(String(event)));
    await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 400));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThanOrEqual(viewport.height * 0.92);
      expect(box.y).toBeGreaterThan(0);
      expect(box.height).toBeLessThan(viewport.height);
    }
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "bottom");

    const overlay = page.locator("[data-vaul-overlay]");
    await expect(overlay).toBeVisible();
    const transition = await dialog.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transition).not.toBe("0s");

    const close = dialog.getByRole("button", { name: "Close" });
    const closeBox = await close.boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.width).toBeGreaterThanOrEqual(44);
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    }

    const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

    await overlay.click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Open drawer" }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe("drawer desktop side panel", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("right drawer on wide viewport", async ({ page }) => {
    await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "right");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
