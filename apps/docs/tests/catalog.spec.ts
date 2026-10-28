import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const MOBILE = { width: 390, height: 844 };

async function gotoCatalogQuiet(page: Page, path = "/catalog") {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  return errors;
}

test("catalog has no console errors on desktop", async ({ page }) => {
  const errors = await gotoCatalogQuiet(page);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog has no console errors on mobile", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  const errors = await gotoCatalogQuiet(page);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog has no console errors with a filter in the URL", async ({ page }) => {
  const errors = await gotoCatalogQuiet(page, "/catalog?area=ui");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("catalog area filters keep a decorative icon", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  const areas = page.getByRole("group", { name: "Area" });
  await expect(areas.getByRole("button", { name: "All areas" }).locator("svg")).toHaveCount(0);
  for (const name of ["UI", "Core & server", "SEO", "Agents"] as const) {
    await expect(areas.getByRole("button", { name, exact: true }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("catalog filters persist in the URL and show empty state", async ({ page }) => {
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Catalog", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "UI", exact: true }).click();
  await expect(page).toHaveURL(/area=ui/);
  await page.getByRole("searchbox", { name: "Catalog search" }).fill("zzzz-no-match-zzzz");
  await expect(page).toHaveURL(/q=zzzz/);
  await expect(page.getByText("No catalog entries match")).toBeVisible();
});

test("home links to catalog with curated grid", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Browse full catalog" })).toBeVisible();
  const count = await page.locator("#components .grid > *").count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(8);
});
