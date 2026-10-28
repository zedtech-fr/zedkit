import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const CONFIRM_DIALOG_DOC = `${BASE}/docs/ui/confirm-destructive-actions`;

test("confirm-dialog component page exposes catalog a11y and troubleshooting in the DOM", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Accessibility", level: 2 })).toBeVisible();
  await expect(page.getByText(/role="dialog"/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Troubleshooting", level: 2 })).toBeVisible();
  await expect(page.getByText(/onConfirm` runs synchronously then closes/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Registry source", level: 2 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("registry brick name keeps a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  const brick = page.locator("[data-registry-brick]");
  await expect(brick.getByText("confirm-dialog", { exact: true })).toBeVisible();
  await expect(brick.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("registry brick name light/dark (#762)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
      const brick = page.locator("[data-registry-brick]");
      await brick.scrollIntoViewIfNeeded();
      await expect(brick).toBeVisible();
      await brick.screenshot({ path: `test-results/registry-brick-${mode}.png` });
    });
  }
});
