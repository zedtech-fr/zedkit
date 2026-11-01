import { expect, test } from "@playwright/test";

const IDENTITIES = [
  { id: "mist", name: "Mist" },
  { id: "press", name: "Press" },
  { id: "tide", name: "Tide" },
  { id: "volt", name: "Volt" },
  { id: "maison", name: "Maison" },
  { id: "glass", name: "Glass" },
] as const;

test("tabs switch the stage identity without leaving the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const showcase = page.locator("[data-home-identity-showcase]");
  await showcase.scrollIntoViewIfNeeded();
  const tabs = showcase.getByRole("tablist", { name: "Visual identities" });
  await expect(tabs).toBeVisible();
  await expect(showcase.getByRole("tab")).toHaveCount(6);
  const stage = showcase.locator("[data-home-identity-stage]");
  await expect(stage).toHaveAttribute("data-identity", "mist");
  for (const identity of IDENTITIES) {
    await showcase.getByRole("tab", { name: identity.name }).click();
    await expect(stage).toHaveAttribute("data-identity", identity.id);
  }
  await showcase.getByRole("tab", { name: "Mist" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(showcase.getByRole("tab", { name: "Press" })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
});

test("mobile showcase does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const showcase = page.locator("[data-home-identity-showcase]");
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase.getByRole("tablist")).toBeVisible();
    const box = await showcase.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px showcase width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px showcase right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});
