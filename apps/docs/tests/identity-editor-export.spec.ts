import { expect, test } from "@playwright/test";

const PAGE = "/features/identity-editor";

test.describe("identity editor export", () => {
  test("CSS and JSON fields follow a spacing edit", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect(page.getByLabel("CSS")).toHaveValue(/--spacing:\s*0\.4rem/);
    const json = await page.getByLabel("JSON").inputValue();
    expect(JSON.parse(json) as { spacing: string }).toMatchObject({ spacing: "0.4rem" });
  });

  test("blocks copy until contrast failure is confirmed", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const background = await page.getByLabel("Background", { exact: true }).inputValue();
    await page.getByLabel("Foreground", { exact: true }).fill(background);
    await expect(page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/)).toBeVisible();
    await expect(page.getByText("Copy is blocked until you fix contrast warnings or confirm export.")).toBeVisible();
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Copied CSS")).toHaveCount(0);
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await page.getByRole("button", { name: "Export anyway" }).click();
    await expect(page.getByText("Copied CSS")).toBeVisible();
  });
});
