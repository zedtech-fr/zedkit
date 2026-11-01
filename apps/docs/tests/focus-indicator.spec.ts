import { expect, test } from "@playwright/test";

import { assertFocusVisibleRing, focusWithKeyboard, readFocusIndicator } from "./a11y-helpers";

/**
 * The focus assertion reads what the browser paints. Each case is a plain page
 * with one button; the negative cases must fail the same helper the demo specs use.
 */
async function pageWith(page: import("@playwright/test").Page, css: string) {
  await page.setContent(`<style>body{background:#fff;margin:24px}button{all:unset;padding:8px 16px;background:#eee;color:#111}${css}</style><button>Save</button>`);
  const button = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(button);
  return button;
}

test("an outline counts as a focus indicator", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:2px solid #1d4ed8}");
  expect((await readFocusIndicator(button)).kind).toBe("outline");
  await assertFocusVisibleRing(button);
});

test("a box-shadow ring added by focus counts", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px #1d4ed8}");
  expect((await readFocusIndicator(button)).kind).toBe("ring");
  await assertFocusVisibleRing(button);
});

test("removing the focus indicator fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:none}");
  expect((await readFocusIndicator(button)).kind).toBe("none");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a resting drop shadow is not a focus state", async ({ page }) => {
  const button = await pageWith(page, "button{box-shadow:0 1px 2px rgba(0,0,0,.4)}button:focus-visible{outline:none}");
  expect((await readFocusIndicator(button)).kind).toBe("none");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a ring too faint against its background fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:2px solid #f3f3f3}");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a pointer-style focus is rejected, not waved through", async ({ page }) => {
  await page.setContent(`<style>button:focus-visible{outline:2px solid #1d4ed8}</style><button>Save</button>`);
  const button = page.getByRole("button", { name: "Save" });
  await button.click();
  await expect(assertFocusVisibleRing(button)).rejects.toThrow(/keyboard/);
});

test("a hairline ring fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:1px solid #1d4ed8}");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test.describe("the kit's own button", () => {
  const PAGE = "/docs/ui/trigger-actions-with-buttons";

  test("paints a real indicator on keyboard focus", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    await assertFocusVisibleRing(button);
  });

  test("fails once its indicator is removed", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "[data-slot='button']:focus-visible{outline:none!important;box-shadow:none!important}" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    await expect(assertFocusVisibleRing(button)).rejects.toThrow();
  });
});

test.describe("controls whose own styles used to hide the ring", () => {
  test("home identity tabs, docs Preview/Code tabs and the hero selects paint a real indicator", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const tab = page.locator("[data-home-identity-looks]").getByRole("tab", { name: "Mist" });
    await tab.scrollIntoViewIfNeeded();
    await focusWithKeyboard(tab);
    await assertFocusVisibleRing(tab);
    for (const name of ["Identity for this demo", "Color mode for this demo", "Table preview mode"]) {
      const select = page.getByRole("combobox", { name });
      await select.scrollIntoViewIfNeeded();
      await focusWithKeyboard(select);
      await assertFocusVisibleRing(select);
    }
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const preview = page.getByRole("tab", { name: "Preview" }).first();
    await focusWithKeyboard(preview);
    await assertFocusVisibleRing(preview);
  });

  test("forced colors keep drawing the focus outline", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    const outline = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });
});
