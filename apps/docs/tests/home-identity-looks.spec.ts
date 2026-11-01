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
  const looks = page.locator("[data-home-identity-looks]");
  await looks.scrollIntoViewIfNeeded();
  const tabs = looks.getByRole("tablist", { name: "Visual identities" });
  await expect(tabs).toBeVisible();
  await expect(looks.getByRole("tab")).toHaveCount(6);
  const stage = looks.locator("[data-home-identity-stage]");
  await expect(stage).toHaveAttribute("data-identity", "mist");
  for (const identity of IDENTITIES) {
    await looks.getByRole("tab", { name: identity.name }).click();
    await expect(stage).toHaveAttribute("data-identity", identity.id);
  }
  await looks.getByRole("tab", { name: "Mist" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(looks.getByRole("tab", { name: "Press" })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
});

test("mobile looks does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    await expect(looks.getByRole("tablist")).toBeVisible();
    const box = await looks.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px looks width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px looks right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});
