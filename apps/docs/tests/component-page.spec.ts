import { expect, test } from "@playwright/test";

const CONFIRM_DIALOG_DOC = "/docs/ui/confirm-destructive-actions";
const BUTTON_DOC = "/docs/ui/trigger-actions-with-buttons";

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
  await expect(page.getByRole("heading", { name: "Install or copy", level: 2 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("confirm-dialog preview precedes install (#R2 template)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  const install = page.getByRole("heading", { name: "Install or copy", level: 2 });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  expect((await preview.boundingBox())!.y).toBeLessThan((await install.boundingBox())!.y);
});

test("registry brick name keeps a decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "registry copy" }).click();
  const brick = page.locator("[data-registry-brick]");
  await brick.scrollIntoViewIfNeeded();
  await expect(brick.getByText("confirm-dialog", { exact: true })).toBeVisible();
  await expect(brick.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("button reference page shows a full button before scroll at 390 (#R2)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Button", level: 1 })).toBeVisible();
  const preview = page.locator("[data-component-preview]").first();
  const create = preview.getByRole("button", { name: "Create app" });
  await expect(create).toBeVisible();
  const box = await create.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
});

test("button reference page surfaces variant and size in props without search (#R2)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "View props table" }).click();
  const props = page.locator("#props");
  await props.scrollIntoViewIfNeeded();
  await expect(props).toContainText("variant");
  await expect(props).toContainText("size");
  await expect(page.getByRole("button", { name: /inherited HTML attributes/i })).toBeVisible();
});

test.describe("registry brick name light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: "registry copy" }).click();
      const brick = page.locator("[data-registry-brick]");
      await brick.scrollIntoViewIfNeeded();
      await expect(brick).toBeVisible();
      await brick.screenshot({ path: `test-results/registry-brick-${mode}.png` });
    });
  }
});
