import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const PAGE = "/docs/ui/design-your-identity";

async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

test.describe("identity editor page", () => {
  test("writes spacing onto the draft card and into the URL", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Design your identity" })).toBeVisible();
    await expect(page.getByText("Change spacing first, then watch the card.", { exact: true })).toBeVisible();
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    expect(page.url()).toContain("spacing=0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    expect(new URL(page.url()).searchParams.has("spacing")).toBe(false);
  });

  test("keeps the chosen look in the URL and restores it on load", async ({ page }) => {
    await page.goto(`${PAGE}?identity=press`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Look")).toHaveValue("press");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.24rem");
  });

  test("passes the a11y gate on the panel", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await assertA11yGate(page, "[data-slot=identity-editor]");
  });
});
