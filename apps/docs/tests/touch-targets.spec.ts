import { expect, test } from "@playwright/test";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const PAGES = ["/", "/docs/ui/call-out-a-notice-or-an-error-state"];

test.use({ viewport: { width: 390, height: 844 } });

for (const identity of IDENTITIES) {
  for (const path of PAGES) {
    test(`buttons, fields and tabs are at least 44px tall on a phone (${identity}, ${path})`, async ({ page }) => {
      await page.addInitScript((id) => localStorage.setItem("zk-identity", id), identity);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
      const small = await page.evaluate(() => {
        const found: string[] = [];
        for (const el of document.querySelectorAll("main button, main input, main select, main textarea, main [role='tab'], main a[class*='h-control-height']")) {
          const box = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (box.width === 0 || box.height === 0 || style.visibility === "hidden") continue;
          if (el.closest("[inert], [aria-hidden='true']")) continue;
          // Heading anchors are decoration revealed on hover; the heading itself stays the target.
          if (el.textContent === "Copy Anchor Link") continue;
          if (box.height < 43.5) found.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 24)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
        }
        return found;
      });
      expect(small).toEqual([]);
    });
  }
}
