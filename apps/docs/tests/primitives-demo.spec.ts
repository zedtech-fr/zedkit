import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

test("the destructive alert keeps its fill and its line", async ({ page }) => {
  await page.goto(`${BASE}call-out-a-notice-or-an-error-state`);
  const preview = page.locator("[data-component-preview]").first();
  const alert = preview.getByRole("alert").filter({ hasText: "Failed" });
  await expect(alert).toBeVisible();
  await pinDemoLook(preview, "glass", "dark");
  const read = () =>
    alert.evaluate((node) => {
      const fill = document.createElement("div");
      fill.style.backgroundColor = "color-mix(in oklab, hsl(var(--destructive)) 90%, transparent)";
      const line = document.createElement("div");
      line.style.borderTop = "1px solid";
      line.style.borderTopColor = node.classList.contains("dark") || node.closest(".dark")
        ? "hsl(var(--destructive))"
        : "color-mix(in oklab, hsl(var(--destructive)) 50%, transparent)";
      node.append(fill, line);
      const style = getComputedStyle(node);
      const result = {
        background: style.backgroundColor,
        border: style.borderTopColor,
        fill: getComputedStyle(fill).backgroundColor,
        line: getComputedStyle(line).borderTopColor,
        numeric: /(?:bg|border)-destructive\//.test(node.className),
      };
      fill.remove();
      line.remove();
      return result;
    });
  const dark = await read();
  expect(dark.background).toBe(dark.fill);
  expect(dark.border).toBe(dark.line);
  expect(dark.numeric).toBe(false);
  await pinDemoLook(preview, "glass", "light");
  const light = await read();
  expect(light.background).toBe(light.fill);
  expect(light.border).toBe(light.line);
});

const BASE = "/docs/ui/";

// page slug, expected preview count, then per-preview visible text checks.
const PAGES: Array<{ slug: string; previews: number; checks: Array<[number, string | RegExp | { status: string }]> }> = [
  {
    slug: "show-a-status-or-count-badge",
    previews: 4,
    checks: [
      [1, "Nightly orders export"],
      [1, "3 retries"],
      [2, "Product catalogue"],
      [2, "running"],
      [3, "all systems go"],
    ],
  },
  { slug: "separate-content-horizontally-or-vertically", previews: 2, checks: [[1, "Customers"]] },
  { slug: "show-loading-placeholder-blocks", previews: 2, checks: [[1, { status: "Loading article" }]] },
  {
    slug: "indicate-status-with-a-dot",
    previews: 3,
    checks: [
      [1, "Payments: Failed"],
      [2, "Live sync, static (printed report or dense table)"],
    ],
  },
  { slug: "show-determinate-progress", previews: 2, checks: [[1, "october-orders.csv, 2.4 MB"]] },
  { slug: "celebrate-completion-with-a-checkmark", previews: 2, checks: [[1, "Order #4821 confirmed"]] },
  { slug: "load-each-zone-with-a-faithful-skeleton", previews: 2, checks: [[1, { status: "Loading report" }]] },
  {
    slug: "name-an-operation-in-progress",
    previews: 3,
    checks: [
      [1, "Invoice draft"],
      [2, "You are offline"],
    ],
  },
  { slug: "stamp-data-with-its-age", previews: 2, checks: [[1, /Synced 4 minutes ago/]] },
  { slug: "call-out-a-notice-or-an-error-state", previews: 2, checks: [[1, "Scheduled maintenance"]] },
  {
    slug: "render-headings-and-body-text-without-raw-tags",
    previews: 2,
    checks: [[1, "Section title as a link"]],
  },
  { slug: "lay-out-an-admin-page-sidebar-topbar-header", previews: 2, checks: [[1, "Four active projects, two due this week."]] },
];

test.describe("primitive pages show a live preview for each example", () => {
  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      test(`${identity} ${mode}`, async ({ page }) => {
        for (const spec of PAGES) {
          await page.goto(BASE + spec.slug, { waitUntil: "networkidle" });
          const previews = page.locator("[data-component-preview]");
          await expect(previews, spec.slug).toHaveCount(spec.previews);
          for (const [index, text] of spec.checks) {
            await pinDemoLook(previews.nth(index), identity, mode);
            await previews.nth(index).scrollIntoViewIfNeeded();
            const target =
              typeof text === "object" && "status" in text
                ? previews.nth(index).getByRole("status", { name: text.status })
                : previews.nth(index).getByText(text).first();
            await expect(target, `${spec.slug} #${index}`).toBeVisible();
          }
        }
      });
    }
  }

  test("the last badge job has no line under it", async ({ page }) => {
    await page.goto(BASE + "show-a-status-or-count-badge", { waitUntil: "networkidle" });
    const rows = page.locator("[data-badge-table] tbody tr");
    const borders = await rows.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).borderBottomWidth));
    expect(borders.length).toBeGreaterThan(1);
    expect(borders.at(-1)).toBe("0px");
    expect(borders.slice(0, -1).every((width) => width !== "0px")).toBe(true);
  });

  test("status badges keep a quieter fill on hover", async ({ page }) => {
    await page.goto(BASE + "show-a-status-or-count-badge");
    const preview = page.locator("[data-component-preview]").first();
    const cases = [
      { name: "beta", token: "--primary", amount: "80%" },
      { name: "12 events", token: "--secondary", amount: "80%" },
      { name: "deprecated", token: "--destructive", amount: "80%" },
    ];
    for (const item of cases) {
      const badge = preview.getByText(item.name, { exact: true });
      await expect(badge).toBeVisible();
      const rest = await badge.evaluate((node) => getComputedStyle(node).backgroundColor);
      await badge.hover();
      await expect.poll(async () =>
        badge.evaluate((node, expected) => {
          const probe = document.createElement("div");
          probe.style.backgroundColor = `color-mix(in oklab, hsl(var(${expected.token})) ${expected.amount}, transparent)`;
          node.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          const background = getComputedStyle(node).backgroundColor;
          probe.remove();
          return background === color && !/bg-(primary|secondary|destructive)\//.test(node.className);
        }, item),
      ).toBe(true);
      const hover = await badge.evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(hover, item.name).not.toBe(rest);
    }
  });

  test("interactive demos respond", async ({ page }) => {
    await page.goto(BASE + "load-each-zone-with-a-faithful-skeleton", { waitUntil: "networkidle" });
    const standalone = page.locator("[data-component-preview]").nth(1);
    await standalone.getByRole("button", { name: "Show the report" }).click();
    await expect(standalone.getByText("148 orders, €12,430 revenue")).toBeVisible();

    await page.goto(BASE + "name-an-operation-in-progress", { waitUntil: "networkidle" });
    const saved = page.locator("[data-component-preview]").nth(1);
    await expect(saved.getByText("Could not save")).toBeVisible();
    await saved.getByRole("button", { name: "Try again" }).click();
    await expect(saved.getByText("Could not save")).toHaveCount(0);
  });
});
