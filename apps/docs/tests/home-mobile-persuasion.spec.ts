import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

function ratio(fontSize: number, lineHeight: number) {
  return lineHeight / fontSize;
}

test.describe("home mobile persuasion type (L2a)", () => {
  test.use({ viewport: MOBILE });

  test("section intros and card copy meet the 16px / 1.45–1.6 floor", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#entry-points .home-metadata-copy").first().waitFor();

    const readings = await page.evaluate(() => {
      const read = (el: Element | null | undefined) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return { fontSize, lineHeight };
      };

      const scenarios = document.querySelector("#scenarios");
      const scenarioIntro = scenarios?.querySelector('[data-slot="heading"] + [data-slot="text"]');
      const scenarioGoal = scenarios?.querySelector(".text-home-persuasion");

      const entryPoints = document.querySelector("#entry-points");
      const entryIntro = entryPoints?.querySelector('[data-slot="heading"] + [data-slot="text"]');
      const entrySummary = entryPoints?.querySelector(".rounded-xl.border .text-home-persuasion");
      const entryMeta = entryPoints?.querySelector(".home-metadata-copy");

      return {
        scenarioIntro: read(scenarioIntro),
        scenarioGoal: read(scenarioGoal),
        entryIntro: read(entryIntro),
        entrySummary: read(entrySummary),
        entryMeta: read(entryMeta),
      };
    });

    for (const [label, value] of Object.entries(readings)) {
      if (label === "entryMeta") continue;
      expect(value, label).not.toBeNull();
      if (!value) continue;
      expect(value.fontSize, `${label} font-size`).toBeGreaterThanOrEqual(16);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeGreaterThanOrEqual(1.45);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeLessThanOrEqual(1.61);
    }

    // Tide default: entry meta follows Tide --text-xs (0.9375rem = 15px), still
    // below the 16px body floor. Was <=13 under Volt. Flag for L2/L3 if the
    // meta scale needs revisiting with the new default.
    expect(readings.entryMeta?.fontSize ?? 99).toBeLessThanOrEqual(15);
  });
});
