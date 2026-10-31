import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

function ratio(fontSize: number, lineHeight: number) {
  return lineHeight / fontSize;
}

test.describe("home mobile marketing body type (L2 + P0)", () => {
  test.use({ viewport: MOBILE });

  test("persuasion copy uses the shared 14px body role with comfortable leading", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#home-page #use-cases").scrollIntoViewIfNeeded();

    const readings = await page.evaluate(() => {
      const read = (el: Element | null | undefined) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return { fontSize, lineHeight };
      };

      const getStarted = document.querySelector("#get-started");
      const startCopy = getStarted?.querySelector(".text-home-persuasion");

      const components = document.querySelector("#components");
      const componentsCopy = components?.querySelector(".text-home-persuasion");

      const useCases = document.querySelector("#use-cases");
      const useCaseWhy = useCases?.querySelector(".text-home-persuasion");

      return {
        startCopy: read(startCopy),
        componentsCopy: read(componentsCopy),
        useCaseWhy: read(useCaseWhy),
      };
    });

    for (const [label, value] of Object.entries(readings)) {
      expect(value, label).not.toBeNull();
      if (!value) continue;
      expect(value.fontSize, `${label} font-size`).toBeGreaterThanOrEqual(14);
      expect(value.fontSize, `${label} font-size`).toBeLessThanOrEqual(15);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeGreaterThanOrEqual(1.45);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeLessThanOrEqual(1.61);
    }
  });
});
