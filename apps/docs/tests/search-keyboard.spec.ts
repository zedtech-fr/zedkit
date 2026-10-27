import { expect, test, type Page } from "@playwright/test";

/** The bar unrolls from the magnifier when it opens; measure only once that travel is over. */
const settled = (page: Page) =>
  page.waitForFunction(() => (document.querySelector("[data-search-bar]")?.getAnimations().length ?? 1) === 0);


/**
 * Phone search with the software keyboard up: the bar is anchored at the top of what can be seen and does
 * not follow the keyboard; the results sheet right under it stays entirely inside the visual viewport.
 * Playwright has no keyboard: a visual viewport that shrinks (and, like iOS, may be scrolled down) stands in.
 */
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const PHONES = [
  { name: "iPhone 13", width: 390, height: 844, keyboard: 336 },
  { name: "short phone", width: 360, height: 640, keyboard: 300 },
] as const;
const OFFSETS = [
  { name: "viewport at the top", offsetTop: 0 },
  { name: "page scrolled by the browser", offsetTop: 48 },
] as const;

type Hooks = { __keyboard: (open: boolean) => void };

for (const identity of IDENTITIES) {
  for (const phone of PHONES) {
    for (const { name, offsetTop } of OFFSETS) {
      test(`bar at the top, whole panel inside the visible viewport (${identity}, ${phone.name}, ${name})`, async ({ page }) => {
        await page.setViewportSize({ width: phone.width, height: phone.height });
        await page.addInitScript(
          ([id, keyboard, top]) => {
            localStorage.setItem("zk-identity", id as string);
            const listeners = new Set<() => void>();
            const state = { open: false };
            Object.defineProperty(window, "visualViewport", {
              configurable: true,
              value: {
                // The visual viewport ends where the keyboard starts; it may start lower than the layout top.
                get offsetTop() { return state.open ? (top as number) : 0; },
                get height() { return window.innerHeight - (state.open ? (keyboard as number) : 0) - this.offsetTop; },
                addEventListener: (_: string, fn: () => void) => listeners.add(fn),
                removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
              },
            });
            Object.defineProperty(window, "__keyboard", {
              value: (open: boolean) => { state.open = open; listeners.forEach((fn) => fn()); },
            });
          },
          [identity, phone.keyboard, offsetTop],
        );
        await page.goto("/docs");
        await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
        const toggle = page.getByRole("button", { name: "Search the documentation" });
        const restBox = (await toggle.boundingBox())!;
        await toggle.click();
        await settled(page);
        const input = page.getByRole("searchbox");
        await expect(input).toBeFocused();
        const bar = page.getByRole("search");
        const before = (await bar.boundingBox())!;
        await page.evaluate(() => (window as unknown as Hooks).__keyboard(true));
        await input.fill("ai");
        const sheet = page.locator("#phone-search-results");
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole("link").first()).toBeVisible();

        const visibleTop = offsetTop;
        const visibleBottom = phone.height - phone.keyboard;
        // Anchored at the top of the visible area, a little air above it; it does not follow the keyboard.
        await expect.poll(async () => (await bar.boundingBox())!.y).toBeGreaterThanOrEqual(visibleTop + 8);
        const top = (await bar.boundingBox())!;
        expect(top.y).toBeLessThanOrEqual(visibleTop + 24);
        expect(top.x).toBeGreaterThanOrEqual(0);
        expect(top.x + top.width).toBeLessThanOrEqual(phone.width);
        expect(top.height).toBeGreaterThanOrEqual(43.5);
        expect(top.y + top.height).toBeLessThanOrEqual(visibleBottom);
        if (offsetTop === 0) expect(Math.abs(top.y - before.y)).toBeLessThanOrEqual(1);

        // The floating magnifier is gone while the bar is open: nothing is left above the keyboard.
        await expect(toggle).toBeHidden();
        expect(await page.locator("[data-search-pill] button[aria-label='Search the documentation']").evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");

        // The whole panel (bar + results) lies inside the visible viewport, results right under the bar.
        const box = (await sheet.boundingBox())!;
        expect(box.y - (top.y + top.height)).toBeGreaterThanOrEqual(0);
        expect(box.y - (top.y + top.height)).toBeLessThanOrEqual(12);
        expect(box.y).toBeGreaterThanOrEqual(visibleTop);
        expect(box.y + box.height).toBeLessThanOrEqual(visibleBottom);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(phone.width);
        const header = (await sheet.locator("p").first().boundingBox())!;
        expect(header.y).toBeGreaterThanOrEqual(box.y);
        const first = (await sheet.getByRole("link").first().boundingBox())!;
        expect(first.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
        expect(first.y + first.height).toBeLessThanOrEqual(box.y + box.height + 1);
        await sheet.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
        expect(Math.abs((await sheet.locator("p").first().boundingBox())!.y - box.y)).toBeLessThanOrEqual(2);

        // Phone ergonomics: field 16px or more, targets 44px or more, no sideways scroll.
        expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
        expect((await page.getByRole("button", { name: "Close search" }).boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
        expect(restBox.width).toBeGreaterThanOrEqual(43.5);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

        // Keyboard down: the sheet may grow again but stays on screen; Escape closes and returns focus.
        await page.evaluate(() => (window as unknown as Hooks).__keyboard(false));
        await expect.poll(async () => (await sheet.boundingBox())!.y + (await sheet.boundingBox())!.height).toBeLessThanOrEqual(phone.height);
        await page.keyboard.press("Escape");
        await expect(input).toHaveCount(0);
        await expect(toggle).toBeVisible();
        await expect(toggle).toBeFocused();
      });
    }
  }
}
