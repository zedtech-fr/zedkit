import { expect, test } from "@playwright/test";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test.use({ viewport: { width: 360, height: 740 } });

for (const identity of IDENTITIES) {
  test(`code blocks keep a single frame and scroll inside it (${identity}, 360px)`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem("zk-identity", id), identity);
    await page.goto("/docs/add-seo-to-nextjs");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    const frame = page.locator("figure.shiki").first();
    await expect(frame).toBeVisible();
    const result = await frame.evaluate((figure) => {
      const pre = figure.querySelector("pre");
      const scroller = figure.querySelector('[role="region"]');
      const box = figure.getBoundingClientRect();
      const style = pre ? getComputedStyle(pre) : null;
      return {
        right: box.right,
        left: box.left,
        figureBorder: parseFloat(getComputedStyle(figure).borderTopWidth),
        preBorder: style ? parseFloat(style.borderTopWidth) : -1,
        preShadow: style?.boxShadow ?? "",
        scrolls: scroller ? scroller.scrollWidth >= scroller.clientWidth : false,
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(result.figureBorder).toBeGreaterThan(0);
    expect(result.preBorder).toBe(0);
    expect(result.preShadow).toBe("none");
    expect(result.left).toBeGreaterThanOrEqual(0);
    expect(result.right).toBeLessThanOrEqual(360);
    expect(result.scrolls).toBe(true);
    expect(result.docOverflow).toBeLessThanOrEqual(0);
  });
}
