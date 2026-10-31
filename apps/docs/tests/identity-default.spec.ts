import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { assertA11yGate } from "./a11y-helpers";

// Relative paths: the config baseURL decides the port.
const PAGE = "/docs/getting-started";
const DEFAULT = DEFAULT_IDENTITY;

type Seen = Array<string | null>;

/** Records every value `data-identity` takes on <html>, from the first script on. */
async function recordIdentity(page: Page) {
  await page.addInitScript(() => {
    const seen: Seen = [];
    (window as unknown as { __identitySeen: Seen }).__identitySeen = seen;
    const read = () => document.documentElement?.getAttribute("data-identity") ?? null;
    seen.push(read());
    // Observe the document, so the watch starts before <html> is created.
    new MutationObserver(() => seen.push(read())).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-identity"],
    });
    // The head is parsed and the body is about to render: the identity must already be set.
    document.addEventListener("DOMContentLoaded", () => seen.push(`dcl:${read()}`));
  });
}

const seenValues = (page: Page) =>
  page.evaluate(() => (window as unknown as { __identitySeen: Seen }).__identitySeen);

const identityValues = (seen: Seen) => seen.filter((value) => value !== null && !value.startsWith("dcl:"));

test("a first-time visitor gets Tide before the first paint, with no change after", async ({ page }) => {
  expect(DEFAULT).toBe("tide");
  await recordIdentity(page);
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
  const seen = await seenValues(page);
  expect(identityValues(seen)).toEqual([DEFAULT]);
  expect(seen).toContain(`dcl:${DEFAULT}`);
});

test("a stored choice still wins over the default", async ({ page }) => {
  await recordIdentity(page);
  await page.addInitScript(() => localStorage.setItem("zk-identity", "mist"));
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  expect(identityValues(await seenValues(page))).toEqual(["mist"]);
});

test("a stored volt choice is kept", async ({ page }) => {
  await recordIdentity(page);
  await page.addInitScript(() => localStorage.setItem("zk-identity", "volt"));
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
  expect(identityValues(await seenValues(page))).toEqual(["volt"]);
});

test("the soft look (mist) stays selectable and is kept", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.getByRole("combobox", { name: "Identity" }).first().selectOption("mist");
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
});

test("the desktop chooser marks the default", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const chooser = page.getByRole("combobox", { name: "Identity" }).first();
  await expect(chooser).toHaveValue(DEFAULT);
  await expect(chooser.locator(`option[value="${DEFAULT}"]`)).toHaveText(/\(default\)/);
  await expect(chooser.locator(`option[value="mist"]`)).not.toHaveText(/default/);
});

test("the phone chooser marks the default and keeps mist selectable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const label = DEFAULT.slice(0, 1).toUpperCase() + DEFAULT.slice(1);
  await page.getByRole("button", { name: new RegExp(`^Identity: ${label}`) }).click();
  const group = page.getByRole("radiogroup", { name: "Identity" });
  await expect(group.getByRole("radio", { name: new RegExp(label) })).toHaveAttribute("aria-checked", "true");
  await expect(group.getByRole("radio", { name: new RegExp(label) })).toContainText("Default");
  await group.getByRole("radio", { name: /Mist/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
});

for (const theme of ["light", "dark"] as const) {
  test(`the default passes the a11y gate in ${theme}`, async ({ page }) => {
    await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
    await page.evaluate(() => document.fonts.ready);
    await assertA11yGate(page);
  });
}

test("reduced motion is respected under the default identity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
  const longest = await page.evaluate(() => {
    let max = 0;
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const style = getComputedStyle(el);
      for (const value of style.animationDuration.split(",")) {
        const ms = parseFloat(value) * (value.includes("ms") ? 1 : 1000);
        if (Number.isFinite(ms)) max = Math.max(max, ms);
      }
    }
    return max;
  });
  expect(longest).toBeLessThanOrEqual(10);
});
