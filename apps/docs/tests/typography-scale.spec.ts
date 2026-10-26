import { expect, test } from "@playwright/test";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

/**
 * Type scale guard for the home cards: card title > text >= label, with modest
 * steps between levels, and a call to action that is a real touch target.
 */
for (const identity of IDENTITIES) {
  test(`home cards keep a sober type scale (${identity}, phone)`, async ({ page }) => {
    await page.addInitScript((id) => window.localStorage.setItem("zk-identity", id), identity);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const card = page.locator("#scenarios").locator("div.rounded-lg").first();
    await card.scrollIntoViewIfNeeded();
    const size = (loc: ReturnType<typeof card.locator>) =>
      loc.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    const title = await size(card.locator("div.text-lg").first());
    const label = await size(card.getByText("You want", { exact: true }));
    const text = await size(card.getByText("Do this", { exact: true }).locator("xpath=following-sibling::p"));
    expect(title).toBeGreaterThan(text);
    expect(text).toBeGreaterThanOrEqual(label);
    expect(title / label).toBeLessThanOrEqual(1.9);
    expect(title / text).toBeLessThanOrEqual(1.6);
    const transform = await card
      .getByText("You want", { exact: true })
      .evaluate((el) => getComputedStyle(el).textTransform);
    expect(transform).toBe("uppercase");
    const cta = card.getByRole("link", { name: /Read the docs/ });
    const box = await cta.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  });
}
