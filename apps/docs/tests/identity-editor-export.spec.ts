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
});
