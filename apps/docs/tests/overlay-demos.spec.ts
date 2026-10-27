import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const DOC_PAGES = {
  badge: "/docs/ui/show-a-status-or-count-badge",
  dialog: "/docs/ui/open-modal-dialogs",
  drawer: "/docs/ui/slide-in-a-drawer-panel",
} as const;

async function expectNoAxeViolations(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page }).include(selector).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("docs live overlay demos", () => {
  test("badge preview passes axe", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (event) => errors.push(String(event)));
    await page.goto(`${BASE}${DOC_PAGES.badge}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("tab", { name: "Preview" }).first()).toBeVisible();
    await expectNoAxeViolations(page, ".rounded-lg.border.border-border.bg-muted\\/40");
    expect(errors).toEqual([]);
  });

  for (const [name, trigger, path] of [
    ["dialog", "Open dialog", DOC_PAGES.dialog],
    ["drawer", "Open drawer", DOC_PAGES.drawer],
  ] as const) {
    test(`${name}: open → axe → Escape closes`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (event) => errors.push(String(event)));
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: trigger }).click();
      const overlay = page.getByRole("dialog");
      await expect(overlay).toBeVisible({ timeout: 10_000 });
      await expect(overlay.getByRole("heading", { name: "Details" })).toBeVisible();
      await expectNoAxeViolations(page, '[role="dialog"]');
      await page.keyboard.press("Escape");
      await expect(overlay).toBeHidden();
      expect(errors).toEqual([]);
    });
  }
});
