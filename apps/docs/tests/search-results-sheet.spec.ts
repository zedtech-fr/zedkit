import { expect, test } from "@playwright/test";

// Default look only: the identity matrix lives in search-keyboard.spec.ts.
const PHONES = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 13", width: 390, height: 844 },
];
const KEYBOARD = 336;
/** The visual viewport sits this far down the layout viewport (iOS scrolls it when the keyboard opens). */
const OFFSET_TOP = 24;

type Keyboard = { __keyboard: (open: boolean) => void };

// Playwright has no software keyboard: stand in a visual viewport that shrinks and shifts the way iOS's does.
for (const phone of PHONES) {
  test(`results keep their first line in view under the bar (${phone.name})`, async ({ page }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.addInitScript(
      ([keyboard, offsetTop]) => {
        const listeners = new Set<() => void>();
        const state = { open: false };
        Object.defineProperty(window, "visualViewport", {
          configurable: true,
          value: {
            get offsetTop() { return state.open ? (offsetTop as number) : 0; },
            get height() { return window.innerHeight - (state.open ? (keyboard as number) : 0) - this.offsetTop; },
            addEventListener: (_: string, fn: () => void) => listeners.add(fn),
            removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
          },
        });
        Object.defineProperty(window, "__keyboard", {
          value: (open: boolean) => { state.open = open; listeners.forEach((fn) => fn()); },
        });
      },
      [KEYBOARD, OFFSET_TOP],
    );
    await page.goto("/docs");
    await page.getByRole("button", { name: "Search the documentation" }).click();
    const input = page.getByRole("searchbox");
    await expect(input).toBeFocused();
    await page.evaluate(() => (window as unknown as Keyboard).__keyboard(true));
    await input.fill("ai");
    const sheet = page.locator("#phone-search-results");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link").first()).toBeVisible();
    const header = sheet.locator("p").first();
    await expect(header).toBeVisible();
    const pill = page.getByRole("search");

    // Settled: sheet under the bar, above the keyboard, header and first result fully inside it.
    const visibleBottom = phone.height - KEYBOARD;
    await expect.poll(async () => (await sheet.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(OFFSET_TOP + 8);
    const box = (await sheet.boundingBox())!;
    const pillBox = (await pill.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(pillBox.y + pillBox.height);
    expect(box.y + box.height).toBeLessThanOrEqual(visibleBottom);
    const headerBox = (await header.boundingBox())!;
    expect(headerBox.y).toBeGreaterThanOrEqual(box.y);
    expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(box.y + box.height);
    const firstBox = (await sheet.getByRole("link").first().boundingBox())!;
    expect(firstBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);

    // The list scrolls inside the sheet, the header stays pinned on top.
    await sheet.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await expect.poll(() => sheet.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(Math.abs((await header.boundingBox())!.y - box.y)).toBeLessThanOrEqual(2);

    // A new query starts back at the top.
    await input.fill("tab");
    await expect.poll(() => sheet.evaluate((el) => el.scrollTop)).toBe(0);

    // Keyboard down: the sheet may grow again but never leaves the screen.
    await page.evaluate(() => (window as unknown as Keyboard).__keyboard(false));
    await expect.poll(async () => (await sheet.boundingBox())!.y + (await sheet.boundingBox())!.height).toBeLessThanOrEqual(phone.height);
  });
}
