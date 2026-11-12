import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { homePasteCopy } from "../ui/home/i18n/home-paste-copy";
import { persistDocsSiteLook, waitForAppliedLook } from "./identity-helpers";

const SHOTS = process.env.HOME_LINK_SHOTS;
const shotPath = (name: string) => (SHOTS ? `${SHOTS}/${name}` : `test-results/${name}`);

for (const theme of ["light", "dark"] as const) {
  for (const { width, name } of [
    { width: 390, name: "390" },
    { width: 1440, name: "1440" },
  ] as const) {
    test(`consistency after ${name}px ${theme}`, async ({ page }) => {
      await persistDocsSiteLook(page, DEFAULT_IDENTITY, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await waitForAppliedLook(page, DEFAULT_IDENTITY, theme);

      if (width >= 768) {
        const header = page.locator("#nd-nav");
        await header.screenshot({ path: shotPath(`consistency-after-${name}-${theme}.png`), animations: "disabled" });
        await expect(header.locator("[data-theme-toggle]").filter({ visible: true })).toHaveCount(0);
        await expect(header.locator('[data-search], [aria-label="Search documentation"]').filter({ visible: true })).toHaveCount(0);
        await expect(header.locator('a[aria-label*="GitHub"]')).toHaveCount(0);
        await expect(header.getByRole("link", { name: "GitHub (opens in a new tab)", exact: true })).toBeVisible();
        await expect(header.getByRole("link", { name: "Get started", exact: true })).toBeVisible();
      }

      await page.locator("#get-started").scrollIntoViewIfNeeded();
      const fullSteps = page.locator("a[data-home-full-steps]");
      await expect(fullSteps).toBeVisible();
      await expect(fullSteps).toHaveAttribute("href", homePasteCopy.fullStepsHref);
      const padding = await fullSteps.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          left: parseFloat(style.paddingLeft),
          right: parseFloat(style.paddingRight),
          top: parseFloat(style.paddingTop),
          bottom: parseFloat(style.paddingBottom),
          cursor: style.cursor,
        };
      });
      expect(padding.left).toBeGreaterThanOrEqual(10);
      expect(padding.right).toBeGreaterThanOrEqual(10);
      expect(padding.top).toBeGreaterThanOrEqual(4);
      expect(padding.bottom).toBeGreaterThanOrEqual(4);
      expect(padding.cursor).not.toBe("default");

      await fullSteps.screenshot({ path: shotPath(`consistency-after-full-steps-${name}-${theme}.png`) });

      await page.locator("#entry-points").scrollIntoViewIfNeeded();
      const entryCtas = [
        "Start with buttons",
        "Start with the Nest bootstrap",
        "Open SEO docs",
        "Open agent setup docs",
        "Read the AI setup guide",
      ] as const;
      for (const label of entryCtas) {
        const link = page.getByRole("link", { name: label });
        await expect(link).toBeVisible();
        const pad = await link.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
          };
        });
        expect(pad.left, label).toBeGreaterThan(0);
        expect(pad.right, label).toBeGreaterThan(0);
      }
      await page
        .locator("#entry-points [data-home-secondary-links]")
        .screenshot({ path: shotPath(`consistency-after-more-in-kit-${name}-${theme}.png`) });
    });
  }
}

test("catalog header keeps search and has no theme toggle or version caption", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const header = page.locator("#nd-nav");
  await expect(header.locator("[data-theme-toggle]").filter({ visible: true })).toHaveCount(0);
  await expect(header.locator("[data-kit-version]")).toHaveCount(0);
  await expect(
    header.locator('[data-search], [aria-label="Search documentation"]').filter({ visible: true }).first(),
  ).toBeVisible();
  const heights = await page.evaluate(() => {
    const measure = (el: Element | null) => (el ? el.getBoundingClientRect().height : 0);
    const nav = document.querySelector("#nd-nav nav");
    return {
      search: measure(nav?.querySelector("[data-search]") ?? null),
      github: measure(nav?.querySelector('a[aria-label*="GitHub"]') ?? null),
    };
  });
  expect(Math.abs(heights.search - heights.github)).toBeLessThanOrEqual(2);
});

for (const theme of ["light", "dark"] as const) {
  test(`home header has no Guides panel at 1440 ${theme}`, async ({ page }) => {
    await persistDocsSiteLook(page, DEFAULT_IDENTITY, theme);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await waitForAppliedLook(page, DEFAULT_IDENTITY, theme);
    const header = page.locator("#nd-nav");
    await expect(header.getByRole("button", { name: "Guides" })).toHaveCount(0);
    await expect(header.getByRole("link", { name: "Getting started", exact: true })).toHaveCount(0);
  });
}

test("the theme switch keeps a quiet border", async ({ page }) => {
  await page.goto("/docs/getting-started");
  const toggle = page.locator("[data-theme-toggle] button").filter({ visible: true }).first();
  await expect(toggle).toBeVisible();
  const line = await toggle.evaluate((node) => {
    const probe = document.createElement("div");
    probe.className = "border-border/35";
    probe.style.borderStyle = "solid";
    probe.style.borderWidth = "1px";
    document.body.append(probe);
    const expected = getComputedStyle(probe).borderTopColor;
    probe.remove();
    const style = getComputedStyle(node);
    return {
      color: style.borderTopColor,
      expected,
      width: style.borderTopWidth,
      numeric: node.className.includes("border-border/"),
    };
  });
  expect(line.color).toBe(line.expected);
  expect(line.width).toBe("1px");
  expect(line.numeric).toBe(false);
});
