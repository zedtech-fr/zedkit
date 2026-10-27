import { expect, test } from "@playwright/test";

// Default look only: every built-in look joins this matrix once the identities are listed in the chooser.
const PHONES = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 13", width: 390, height: 844 },
];
const KEYBOARD = 336;

// Playwright has no software keyboard: stand in a visual viewport that shrinks the way iOS's does.
{
  for (const phone of PHONES) {
    test(`pill keeps air above the keyboard (${phone.name})`, async ({ page }) => {
      await page.setViewportSize({ width: phone.width, height: phone.height });
      await page.addInitScript(
        ([keyboard]) => {
          const listeners = new Set<() => void>();
          const state = { open: false };
          Object.defineProperty(window, "visualViewport", {
            configurable: true,
            value: {
              get height() { return window.innerHeight - (state.open ? (keyboard as number) : 0); },
              offsetTop: 0,
              addEventListener: (_: string, fn: () => void) => listeners.add(fn),
              removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
            },
          });
          Object.defineProperty(window, "__keyboard", {
            value: (open: boolean) => { state.open = open; listeners.forEach((fn) => fn()); },
          });
        },
        [KEYBOARD],
      );
      await page.goto("/docs");
      await page.getByRole("button", { name: "Search the documentation" }).click();
      const pill = page.getByRole("search");
      await expect(page.getByRole("searchbox")).toBeFocused();
      const closedBox = await pill.boundingBox();
      await page.evaluate(() => (window as unknown as { __keyboard: (open: boolean) => void }).__keyboard(true));
      await expect.poll(async () => {
        const box = await pill.boundingBox();
        return box ? phone.height - KEYBOARD - (box.y + box.height) : -1;
      }).toBeGreaterThanOrEqual(16);
      const lifted = await pill.boundingBox();
      expect(lifted?.y ?? -1).toBeGreaterThanOrEqual(0);
      expect(lifted?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((lifted?.x ?? 0) + (lifted?.width ?? 0)).toBeLessThanOrEqual(phone.width);
      await page.evaluate(() => (window as unknown as { __keyboard: (open: boolean) => void }).__keyboard(false));
      await expect.poll(async () => (await pill.boundingBox())?.y ?? -1).toBeCloseTo(closedBox?.y ?? 0, 0);
    });
  }
}
