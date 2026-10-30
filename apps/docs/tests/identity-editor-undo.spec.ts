import { expect, test, type Page } from "@playwright/test";

const PAGE = "/docs/ui/design-your-identity";

async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

test.describe("identity editor undo and apply confirmation", () => {
  test("Undo restores the last draft after Reset", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
  });

  test("Apply to the whole site confirms on the page", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });
});
