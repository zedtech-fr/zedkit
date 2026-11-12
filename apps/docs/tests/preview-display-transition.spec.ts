import { expect, test, type Locator } from "@playwright/test";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

async function layout(preview: Locator) {
  return preview.evaluate((root) => {
    const tabs = root.querySelector("[role='tablist']")!.getBoundingClientRect();
    const row = root.querySelector<HTMLElement>("[data-preview-display]")!;
    const rect = row.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const controls = [...row.querySelectorAll("select, button")]
      .filter((node) => node.checkVisibility())
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { visible: box.width > 0 && box.height > 0, inView: box.left >= 0 && box.right <= vw };
      });
    return {
      beside: Math.abs(rect.top - tabs.top) < 40,
      rowWidth: rect.width,
      vw,
      controls,
      pageOverflow: document.documentElement.scrollWidth - vw,
      toggleVisible: [...root.querySelectorAll("button")].some(
        (button) => button.textContent === "Display" && button.getBoundingClientRect().width > 0,
      ),
    };
  });
}

test("primary Look and Dark stay on the in-card toolbar when the window widens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.getByRole("button", { name: "Display", exact: true })).toHaveCount(0);
  const phone = await layout(preview);
  expect(phone.controls.length).toBeGreaterThanOrEqual(2);
  expect(phone.controls.every((control) => control.visible && control.inView)).toBe(true);
  expect(phone.pageOverflow).toBeLessThanOrEqual(1);

  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const wide = await layout(preview);
    expect(wide.toggleVisible, `${width}px: no Display toggle on the primary toolbar`).toBe(false);
    if (width >= 1024) {
      expect(wide.beside, `${width}px: Look/Dark share the tab row`).toBe(true);
    }
    expect(wide.controls.length, `${width}px: Look and Dark`).toBeGreaterThanOrEqual(2);
    expect(wide.controls.every((control) => control.visible && control.inView), `${width}px: reachable`).toBe(true);
    await preview.getByLabel("Look").selectOption("press");
    await expect(preview.locator("[data-preview-surface]")).toHaveAttribute("data-identity", "press");
    await preview.getByLabel("Look").selectOption("mist");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => {
      const back = await layout(preview);
      return back.controls.length >= 2 && back.controls.every((control) => control.visible && control.inView);
    }, { message: "Look and Dark stay in view on a phone once the row has settled" })
    .toBe(true);
});
