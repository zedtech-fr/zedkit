import { expect, test } from "@playwright/test";

const IDENTITIES = [
  { id: "mist", name: "Mist" },
  { id: "press", name: "Press" },
  { id: "tide", name: "Tide" },
  { id: "volt", name: "Volt" },
  { id: "maison", name: "Maison" },
  { id: "glass", name: "Glass" },
] as const;

test("tabs switch the stage identity without leaving the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const looks = page.locator("[data-home-identity-looks]");
  await looks.scrollIntoViewIfNeeded();
  const tabs = looks.getByRole("tablist", { name: "Visual identities" });
  await expect(tabs).toBeVisible();
  await expect(looks.getByRole("tab")).toHaveCount(6);
  const stage = looks.locator("[data-home-identity-stage]");
  await expect(stage).toHaveAttribute("data-identity", "mist");
  for (const identity of IDENTITIES) {
    await looks.getByRole("tab", { name: identity.name }).click();
    await expect(stage).toHaveAttribute("data-identity", identity.id);
    // The facts card speaks in the identity it describes.
    await expect(looks.locator("[data-home-identity-facts]:visible")).toHaveAttribute("data-identity", identity.id);
    await expect(looks.locator("[data-home-identity-facts]:visible h3")).toHaveText(identity.name);
  }
  await looks.getByRole("tab", { name: "Mist" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(looks.getByRole("tab", { name: "Press" })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
});

test("mobile looks does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    await expect(looks.getByRole("tablist")).toBeVisible();
    const box = await looks.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px looks width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px looks right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});

test("the demo keeps its promises: Discard restores, Save keeps, Delete confirms and restores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const stage = page.locator("[data-home-identity-stage]");
  await stage.scrollIntoViewIfNeeded();
  const name = stage.getByRole("textbox", { name: "Workspace" });
  const status = stage.locator("[data-home-identity-status]");

  await name.fill("Harbor Staging");
  await expect(status).toHaveText("Unsaved changes.");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Console");
  await expect(status).toHaveText("Changes discarded.");

  await name.fill("Harbor Staging");
  await stage.getByRole("button", { name: "Save changes" }).click();
  await expect(status).toHaveText("Changes saved.");
  await name.fill("Something else");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Staging");

  await stage.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this project?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(status).not.toContainText("deleted");
  await stage.getByRole("button", { name: "Delete project" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
  await expect(status).toContainText("Project deleted");
  await stage.getByRole("button", { name: "Restore project" }).click();
  await expect(stage.getByRole("button", { name: "Delete project" })).toBeVisible();
});
