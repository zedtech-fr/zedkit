import { expect, test, type Page } from "@playwright/test";

const PAGE = "/features/identity-editor";

async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

async function draftBackground(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--background").trim(),
  );
}

test.describe("identity editor undo", () => {
  test("Undo restores the last draft after Reset", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
    await page.getByLabel("--spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
  });

  test("undo of a dark colour lets a later light edit rewrite it on the draft", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("--background", { exact: true }).fill("120 40% 20%");
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("--background", { exact: true }).fill("0 0% 95%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await expect.poll(() => draftBackground(page)).toMatch(/^0 0% 5(\.0)?%$/);
  });

  test("undo of a light edit keeps an earlier dark override on the draft", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("--background", { exact: true }).fill("120 40% 20%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("--background", { exact: true }).fill("0 0% 95%");
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByLabel("--background", { exact: true }).fill("0 0% 90%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await expect.poll(() => draftBackground(page)).toBe("120 40% 20%");
  });
});
