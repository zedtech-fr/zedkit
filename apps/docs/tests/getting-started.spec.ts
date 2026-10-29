import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("getting started is first stop from docs index", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
  const startLink = page.getByRole("link", { name: "Getting started" }).first();
  await startLink.click();
  await page.waitForURL("**/docs/getting-started", { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Quickstart" })).toBeVisible();
  await expect(page.getByText("zedkit-ai validate")).toBeVisible();
  await expect(page.getByText(/Pick one path below \(A through E\)/)).toBeVisible();
  await expect(page.getByText(/Both end with something you can see/)).toHaveCount(0);
});

test("getting started documents install or copy paths", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#install-or-copy`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Install or copy", level: 2 })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Command" })).toBeVisible();
  await expect(page.getByText(/Nothing in the catalog is labeled stable yet/)).toBeVisible();
  await expect(page.getByText(/copied bricks are plain editable files/)).toBeVisible();
});

test("getting started lists a core npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path C — core helpers (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-core")).toBeVisible();
});

test("getting started lists a server npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path D — server helpers (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-server")).toBeVisible();
});

test("getting started lists a nest npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path E — Nest API (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-nest")).toBeVisible();
});

test("getting started package table links SEO row to SEO scenario", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "SEO scenario" }).click();
  await expect(page.getByRole("heading", { name: "Scenario — SEO", level: 2 })).toBeVisible();
});

test("getting started package table links UI row to Quickstart path B", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart path B" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path B — UI button (install only on this page)", level: 3 })).toBeVisible();
});

test("getting started package table links agents row to Quickstart path A", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart path A" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path A — coding agents (about two minutes)", level: 3 })).toBeVisible();
});

test("getting started package table links backend row to Quickstart paths", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart paths C–E" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path C — core helpers (npm only)", level: 3 })).toBeVisible();
});

test("getting started package table keeps a decorative area icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  for (const name of ["UI", "Core & server", "SEO", "Coding agents"] as const) {
    await expect(table.getByRole("cell", { name, exact: true }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("getting started package table light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
      const table = page
        .getByRole("table")
        .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
      await table.scrollIntoViewIfNeeded();
      await expect(table.getByRole("cell", { name: "UI", exact: true })).toBeVisible();
      await table.screenshot({ path: `test-results/getting-started-packages-${mode}.png` });
    });
  }
});

test("getting started next steps tutorials follow choose-a-package table order", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Next steps", level: 2 }).scrollIntoViewIfNeeded();
  const titles = await page.getByRole("heading", { name: "Next steps", level: 2 }).evaluate((heading) => {
    const item = [...heading.parentElement!.querySelectorAll("li")].find((li) =>
      li.textContent?.includes("Tutorials"),
    );
    return [...(item?.querySelectorAll("a") ?? [])].map((anchor) => anchor.textContent?.trim() ?? "");
  });
  expect(titles).toEqual([
    "Build an admin dashboard",
    "Start a safe NestJS API",
    "Add SEO to a Next.js app",
    "Set up your coding agents",
    "zedkit and shadcn/ui",
  ]);
});

test("getting started scenarios follow choose-a-package table order", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  const order = await page.locator("main h2").evaluateAll((elements) =>
    elements
      .map((el) => el.textContent?.replace(/Copy Anchor Link/g, "").trim() ?? "")
      .filter((text) => text.startsWith("Scenario —")),
  );
  expect(order).toEqual([
    "Scenario — UI",
    "Scenario — backend",
    "Scenario — SEO",
    "Scenario — coding agents",
  ]);
});

test("getting started includes UI, backend, agents, and SEO scenarios", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Scenario — coding agents", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — backend", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — SEO", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — UI", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a safe NestJS API" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Add SEO to a Next.js app" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Build an admin dashboard" }).first()).toBeVisible();
});

test("getting started troubleshooting mentions server env boot failures", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Troubleshooting", level: 2 }).scrollIntoViewIfNeeded();
  const row = page.getByRole("row", { name: /Boot fails on bad process\.env/ });
  await expect(row).toBeVisible();
  await expect(row.getByRole("link", { name: "Fail fast on bad environment variables" })).toBeVisible();
  await expect(row.getByRole("link", { name: "Start a safe NestJS API" })).toBeVisible();
});

test("getting started links to a catalog page", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page
    .getByRole("main")
    .getByRole("link", { name: "AI setup catalog page", exact: true })
    .click();
  await page.waitForURL("**/docs/ai/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
