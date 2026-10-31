import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

function ratio(fontSize: number, lineHeight: number) {
  return lineHeight / fontSize;
}

test.describe("home mobile persuasion type (L2a)", () => {
  test.use({ viewport: MOBILE });

  test("section intros and card copy meet the 16px / 1.45–1.6 floor", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#use-cases [role='tabpanel']").waitFor();

    const readings = await page.evaluate(() => {
      const read = (el: Element | null | undefined) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return { fontSize, lineHeight };
      };

      const useCases = document.querySelector("#use-cases");
      const casesIntro = useCases?.querySelector('[data-slot="text"]');
      const casesWhy = useCases?.querySelector('[role="tabpanel"] p');

      const components = document.querySelector("#components");
      const componentsIntro = components?.querySelector('[data-slot="text"]');
      const componentsCopy = components?.querySelector(".text-home-persuasion");

      return {
        casesIntro: read(casesIntro),
        casesWhy: read(casesWhy),
        componentsIntro: read(componentsIntro),
        componentsCopy: read(componentsCopy),
      };
    });

    for (const [label, value] of Object.entries(readings)) {
      expect(value, label).not.toBeNull();
      if (!value) continue;
      expect(value.fontSize, `${label} font-size`).toBeGreaterThanOrEqual(16);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeGreaterThanOrEqual(1.45);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeLessThanOrEqual(1.61);
    }
  });
});
