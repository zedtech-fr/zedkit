import { expect, test, type Page } from "@playwright/test";

const PHONES = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 13", width: 390, height: 844 },
] as const;
const KEYBOARD = 336;
const OFFSET_TOP = 24;

type Keyboard = { __keyboard: (open: boolean) => void };

for (const phone of PHONES) {
  test(`results stay in view when the keyboard is open (${phone.name})`, async ({ page }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.addInitScript(
      ([keyboard, offsetTop]) => {
        const listeners = new Set<() => void>();
        const state = { open: false };
        Object.defineProperty(window, "visualViewport", {
          configurable: true,
          value: {
            get offsetTop() {
              return state.open ? (offsetTop as number) : 0;
            },
            get height() {
              return window.innerHeight - (state.open ? (keyboard as number) : 0) - this.offsetTop;
            },
            addEventListener: (_: string, fn: () => void) => listeners.add(fn),
            removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
          },
        });
        Object.defineProperty(window, "__keyboard", {
          value: (open: boolean) => {
            state.open = open;
            listeners.forEach((fn) => fn());
          },
        });
      },
      [KEYBOARD, OFFSET_TOP],
    );
    await page.goto("/docs");
    await page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const input = dialog.locator("input").first();
    await expect(input).toBeFocused();
    await page.evaluate(() => (window as unknown as Keyboard).__keyboard(true));
    await input.fill("ai");
    const first = dialog.getByRole("link").first();
    await expect(first).toBeVisible({ timeout: 10000 });
    const visibleBottom = phone.height - KEYBOARD;
    const linkBox = (await first.boundingBox())!;
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(visibleBottom);
    await page.evaluate(() => (window as unknown as Keyboard).__keyboard(false));
    await expect(first).toBeVisible();
  });
}
