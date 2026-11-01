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

test("registry brick label has no decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "registry copy" }).click();
  const brick = page.locator("[data-registry-brick]");
  await brick.scrollIntoViewIfNeeded();
  await expect(brick.getByText("confirm-dialog", { exact: true })).toBeVisible();
  await expect(brick.locator("svg[aria-hidden='true']")).toHaveCount(0);
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
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-variant']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-size']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-asChild']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-onClick']")).toHaveCount(0);
  const inherited = props.locator("details");
  await expect(inherited).toBeVisible();
  await inherited.locator("summary").click();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-inherited-onClick']")).toBeVisible();
});

test("component page TOC lists the live sections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const toc = page.locator("#nd-toc");
  await expect(toc.getByRole("link", { name: "Preview" })).toHaveAttribute("href", "#example");
  await expect(toc.getByRole("link", { name: "Guidance" })).toHaveAttribute("href", "#guidance");
  await expect(toc.getByRole("link", { name: "Install or copy" })).toHaveAttribute("href", "#install-or-copy");
  await expect(toc.getByRole("link", { name: "Props" })).toHaveAttribute("href", "#props");
  await expect(page.getByRole("heading", { name: "At a glance" })).toHaveCount(0);
});

test("dialog page offers registry copy on the same anatomy", async ({ page }) => {
  await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
  await expect(page.getByRole("tab", { name: "registry copy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "At a glance" })).toHaveCount(0);
  await expect(page.locator("[data-component-preview]").first()).toBeVisible();
  await expect(page.locator("#usage-and-states")).toContainText("DialogClose");
  await expect(page.locator("#install-or-copy")).toContainText("getting started");
});

test("button registry tab shows the local import", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "registry copy" }).click();
  await expect(page.getByText('import { Button } from "@/components/ui/button"')).toBeVisible();
  await expect(page.locator("#example")).not.toContainText("saveRef");
});

test.describe("registry brick name light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
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

test("guidance answers the reader's questions and sits right after the example", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const guidance = page.locator("#guidance");
  await expect(guidance.getByText("Who is it for?")).toBeVisible();
  await expect(guidance.getByText("When should I use it?")).toBeVisible();
  await expect(guidance.getByText("When should I pick something else?")).toBeVisible();
  const example = await page.locator("#example").boundingBox();
  const props = await page.locator("#props").boundingBox();
  const box = await guidance.boundingBox();
  expect(box!.y).toBeGreaterThan(example!.y);
  expect(box!.y).toBeLessThan(props!.y);
});
