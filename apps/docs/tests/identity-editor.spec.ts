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

  test("warns when light text matches the background and Fix restores it", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Foreground").fill("0 0% 100%");
    const chip = page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/);
    await expect(chip).toBeVisible();
    await page.getByRole("button", { name: "Fix light text" }).click();
    await expect(chip).toHaveCount(0);
  });

  test("keeps the dark preview in the URL", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
    expect(page.url()).toContain("theme=dark");
    await expect
      .poll(() =>
        page.locator('[data-slot="identity-editor-preview"]').evaluate((node) => node.classList.contains("dark")),
      )
      .toBe(true);
    await page.goto(`${PAGE}?theme=dark`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Suggest applies a service patch after Apply", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { current: Record<string, unknown> };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { tokens: { ...posted.current, spacing: "0.5rem" } },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("more space");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Review these token changes.")).toBeVisible();
    await expect(page.getByText("spacing: 0.25rem → 0.5rem")).toBeVisible();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.5rem");
  });

  test("Suggest falls back to a keyword match when the service is off", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      await route.fulfill({ status: 503, contentType: "application/json", json: { disabled: true } });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("editorial serif ink");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Suggest is offline. Keyword match instead.")).toBeVisible();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.24rem");
  });

  test("passes the a11y gate on the panel", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await assertA11yGate(page, "[data-slot=identity-editor]");
  });
});

