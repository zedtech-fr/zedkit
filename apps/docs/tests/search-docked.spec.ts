import { expect, test } from "@playwright/test";

/**
 * Phone search with the software keyboard up: the open bar is docked to the bottom of the visual
 * viewport, right on top of the keyboard, and the results sit directly above it, inside the visual viewport.
 * Playwright has no keyboard: a visual viewport that shrinks (and, like iOS, may be scrolled down) stands in.
 */
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const PHONE = { width: 390, height: 844 };
const KEYBOARD = 336;
const CASES = [
  { name: "viewport at the top", offsetTop: 0 },
  { name: "page scrolled by the browser", offsetTop: 48 },
] as const;

type Hooks = { __keyboard: (open: boolean) => void };

for (const identity of IDENTITIES) {
  for (const { name, offsetTop } of CASES) {
    test(`bar docked on the keyboard, results above it (${identity}, ${name})`, async ({ page }) => {
      await page.setViewportSize(PHONE);
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
        [identity, KEYBOARD, offsetTop],
      );
      await page.goto("/docs");
      await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
      const toggle = page.getByRole("button", { name: "Search the documentation" });
      const pill = page.getByRole("search");
      const restBox = (await toggle.boundingBox())!;
      await toggle.click();
      const input = page.getByRole("searchbox");
      await expect(input).toBeFocused();
      const restOpen = (await pill.boundingBox())!;
      await page.evaluate(() => (window as unknown as Hooks).__keyboard(true));
      await input.fill("ai");
      const sheet = page.locator("#phone-search-results");
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("link").first()).toBeVisible();

      const viewportBottom = PHONE.height - KEYBOARD;
      // Docked: the bar's bottom edge is the visual viewport's bottom edge, no gap.
      await expect.poll(async () => viewportBottom - (await pill.boundingBox())!.y - (await pill.boundingBox())!.height).toBeLessThanOrEqual(1);
      const bar = (await pill.boundingBox())!;
      expect(viewportBottom - (bar.y + bar.height)).toBeGreaterThanOrEqual(-1);
      // It still unrolls to the left from the button: the button keeps its right edge and the bar is wide.
      const button = (await toggle.boundingBox())!;
      expect(Math.abs(button.x + button.width - (restBox.x + restBox.width))).toBeLessThanOrEqual(1);
      expect(bar.width).toBeGreaterThan(PHONE.width * 0.8);
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.x + bar.width).toBeLessThanOrEqual(PHONE.width);
      expect(bar.height).toBeGreaterThanOrEqual(43.5);
      expect(button.width).toBeGreaterThanOrEqual(43.5);

      // Results: right above the bar, fully inside the visual viewport, header and first line visible.
      const box = (await sheet.boundingBox())!;
      expect(bar.y - (box.y + box.height)).toBeGreaterThanOrEqual(0);
      expect(bar.y - (box.y + box.height)).toBeLessThanOrEqual(12);
      expect(box.y).toBeGreaterThanOrEqual(offsetTop + 16 - 2);
      expect(box.y + box.height).toBeLessThanOrEqual(viewportBottom);
      const header = (await sheet.locator("p").first().boundingBox())!;
      expect(header.y).toBeGreaterThanOrEqual(box.y);
      const first = (await sheet.getByRole("link").first().boundingBox())!;
      expect(first.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
      expect(first.y + first.height).toBeLessThanOrEqual(box.y + box.height + 1);
      await sheet.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
      expect(Math.abs((await sheet.locator("p").first().boundingBox())!.y - box.y)).toBeLessThanOrEqual(2);

      // Phone ergonomics: the field reads at 16px or more.
      expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

      // Keyboard down: back to the resting place.
      await page.evaluate(() => (window as unknown as Hooks).__keyboard(false));
      await expect.poll(async () => Math.abs((await pill.boundingBox())!.y - restOpen.y)).toBeLessThanOrEqual(1);
    });
  }
}

test("a short phone with the keyboard up keeps the first result line in view", async ({ page }) => {
  const phone = { width: 360, height: 640 };
  await page.setViewportSize(phone);
  await page.addInitScript(
    ([keyboard]) => {
      const listeners = new Set<() => void>();
      const state = { open: false };
      Object.defineProperty(window, "visualViewport", {
        configurable: true,
        value: {
          offsetTop: 0,
          get height() { return window.innerHeight - (state.open ? (keyboard as number) : 0); },
          addEventListener: (_: string, fn: () => void) => listeners.add(fn),
          removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
        },
      });
      Object.defineProperty(window, "__keyboard", {
        value: (open: boolean) => { state.open = open; listeners.forEach((fn) => fn()); },
      });
    },
    [300],
  );
  await page.goto("/docs");
  await page.getByRole("button", { name: "Search the documentation" }).click();
  await page.evaluate(() => (window as unknown as Hooks).__keyboard(true));
  await page.getByRole("searchbox").fill("ai");
  const sheet = page.locator("#phone-search-results");
  await expect(sheet.getByRole("link").first()).toBeVisible();
  await expect.poll(async () => (await sheet.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(14);
  const box = (await sheet.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(phone.height - 300);
});
