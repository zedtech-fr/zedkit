import { expect, test } from "@playwright/test";

import { pinDemoLook } from "./a11y-helpers";

test.describe("docs dialog and drawer previews show realistic screens", () => {
  test("dialog: an order sheet with a status, not a stub", async ({ page }) => {
    await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Order details" })).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await expect(dialog.getByText("€101.50")).toBeVisible();
    await expect(dialog.getByText("Awaiting shipment")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Mark as shipped" })).toBeVisible();
  });

  test("dialog: props table lists the root props (#1061)", async ({ page }) => {
    await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Props" })).toBeVisible();
    await expect(page.getByText("onOpenChange?", { exact: true })).toBeVisible();
    await expect(page.getByText("modal?", { exact: true })).toBeVisible();
  });

  test("confirm: the delete flow ends in a visible result", async ({ page }) => {
    await page.goto("/docs/ui/confirm-destructive-actions", { waitUntil: "networkidle" });
    await expect(page.getByText("Website relaunch").first()).toBeVisible();
    await page.getByRole("button", { name: "Delete item" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Delete .Website relaunch.\?/ })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Active").first()).toBeVisible();
    await page.getByRole("button", { name: "Delete item" }).click();
    await dialog.getByRole("button", { name: "Delete project" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("The project and its 14 tasks were deleted.")).toBeVisible();
  });

  test("confirm: custom labels preview keeps access when cancelled, revokes when confirmed", async ({ page }) => {
    await page.goto("/docs/ui/confirm-destructive-actions", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Custom button labels", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Revoke this API key?" })).toBeVisible();
    await dialog.getByRole("button", { name: "Keep access" }).click();
    // Gate: the first dialog must be gone before the page-wide Revoke query
    // below, or it resolves the stale dialog's confirm button (the modal
    // hides the page trigger from the a11y tree) and confirms early.
    await expect(dialog).toBeHidden();
    await expect(page.getByText("In use")).toBeVisible();
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    await dialog.getByRole("button", { name: "Revoke", exact: true }).click();
    await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  });

  test("drawer: a task sheet with details and activity", async ({ page }) => {
    await page.goto("/docs/ui/slide-in-a-drawer-panel", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Task details" })).toBeVisible();
    await expect(dialog.getByText("Review the homepage mockups")).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await expect(dialog.getByText("Activity")).toBeVisible();
    await expect(dialog.getByLabel("Note")).toBeVisible();
  });

  test("drawer: filters bottom sheet and side menu previews open", async ({ page }) => {
    await page.goto("/docs/ui/slide-in-a-drawer-panel", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Filters" })).toBeVisible();
    const handle = sheet.locator("[data-vaul-handle]");
    await expect(handle).toBeVisible();
    const mark = await handle.evaluate((node) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "hsl(var(--muted-foreground) / 0.5)";
      node.append(probe);
      const expected = getComputedStyle(probe).backgroundColor;
      const background = getComputedStyle(node).backgroundColor;
      const box = node.getBoundingClientRect();
      probe.remove();
      return {
        background,
        expected,
        numeric: node.className.includes("bg-muted-foreground/"),
        wide: box.width > box.height,
      };
    });
    expect(mark.background).toBe(mark.expected);
    expect(mark.numeric).toBe(false);
    expect(mark.wide).toBe(true);
    await sheet.getByLabel("Awaiting shipment").click();
    await expect(sheet.getByText("2 status selected.")).toBeVisible();
    await sheet.getByRole("button", { name: "Reset" }).click();
    await expect(sheet.getByText("All orders are shown.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("heading", { name: "Menu" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Billing" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("route modal: an order detail opens over the list and closes", async ({ page }) => {
    await page.goto("/docs/ui/render-a-route-as-a-modal-over-the-list", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open route modal" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Order #1042" })).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the drawer scrim stays lighter than the dialog scrim", async ({ page }) => {
    await page.goto("/docs/ui/slide-in-a-drawer-panel");
    const preview = page.locator("[data-component-preview]").first();
    const open = preview.getByRole("button", { name: "Open drawer" });
    const overlay = page.locator("[data-slot='drawer-overlay']");

    await open.click();
    await expect(overlay).toBeVisible();
    await expect.poll(async () =>
      overlay.evaluate((node) => {
        const probe = document.createElement("div");
        probe.style.backgroundColor = "hsl(var(--overlay) / var(--zk-glass-scrim-alpha))";
        node.append(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        const background = getComputedStyle(node).backgroundColor;
        probe.remove();
        return background === expected && !node.className.includes("bg-overlay/");
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();

    await pinDemoLook(preview, "mist", "dark");
    await open.click();
    await expect(overlay).toBeVisible();
    await expect.poll(async () =>
      overlay.evaluate((node) => {
        const probe = document.createElement("div");
        probe.style.backgroundColor = "color-mix(in oklab, hsl(var(--overlay)) 50%, transparent)";
        node.append(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        const style = getComputedStyle(node);
        probe.remove();
        return style.backgroundColor === expected && style.backdropFilter.includes("blur");
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
  });
});
