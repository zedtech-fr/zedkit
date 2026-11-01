import { expect, test, type Page } from "@playwright/test";

/** The pinned hero names its three examples; the current one is the one on screen. */
async function current(page: Page) {
  return page.$$eval("[data-scroll-scenes-progress] li", (items) => {
    const dark = (color: string) => Number(color.match(/\d+/)?.[0]) < 60;
    return items.filter((item) => dark(getComputedStyle(item).color)).map((item) => item.textContent);
  });
}

async function visibleScene(page: Page) {
  return page.$$eval("[data-home-hero-visuals] > [data-scroll-scene]", (scenes) =>
    scenes.find((scene) => Number(getComputedStyle(scene).opacity) > 0.9)?.getAttribute("data-scroll-scene"),
  );
}

test("desktop: the label under the card follows the example scrolled into view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-scroll-scenes-progress] li")).toHaveText(["Data table", "Detail panel", "Date picker"]);
  const expected: Record<number, [string, string]> = {
    0: ["admin", "Data table"],
    900: ["drawer", "Detail panel"],
    1500: ["calendar", "Date picker"],
  };
  for (const [y, [scene, label]] of Object.entries(expected)) {
    await page.evaluate((top) => scrollTo(0, top), Number(y));
    await expect.poll(() => visibleScene(page), { message: `scene at ${y}` }).toBe(scene);
    await expect.poll(() => current(page), { message: `label at ${y}` }).toEqual([label]);
  }
});

test("phone: one example, no step labels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-scroll-scenes-progress]")).toBeHidden();
});

test("reduced motion: the examples stay still and the labels stay out", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-scroll-scenes-progress]")).toBeHidden();
  await expect(page.locator("[data-home-hero-visuals] > [data-scroll-scene]:visible")).toHaveCount(1);
});

for (const width of [320, 360, 390]) {
  test(`${width}px: the hero's chosen look is readable in full and the page does not scroll sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    const select = page.getByRole("combobox", { name: /identity|look|style/i }).first();
    await select.scrollIntoViewIfNeeded();
    const fit = await select.evaluate((node) => {
      const value = node.querySelector("[data-slot='select-value']") ?? node;
      return {
        width: node.getBoundingClientRect().width,
        clipped: value.scrollWidth > value.clientWidth + 1,
        text: (value.textContent ?? "").trim(),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(fit.text.length, `${width}px shows a name`).toBeGreaterThan(2);
    expect(fit.width, `${width}px select width`).toBeGreaterThanOrEqual(100);
    expect(fit.clipped).toBe(false);
    expect(fit.overflow).toBeLessThanOrEqual(1);
  });
}
