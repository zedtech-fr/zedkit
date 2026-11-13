import { expect, test, type Locator, type Page } from "@playwright/test";

import { homeHeroCopy } from "../app/(home)/_home/i18n/home-hero-copy";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy";

async function firstIssueRow(page: Page) {
  const rows = page.locator("main details[data-issues-row]");
  if ((await rows.count()) === 0) return null;
  return rows.first();
}

async function expectNoPageErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await run();
  expect(errors).toEqual([]);
}

function emptyListVisible(page: Page) {
  return page.getByText(/No public runs yet|Could not load public runs/);
}

test("issue rows are native closed accordions that expand in place", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/issues");
  const first = await firstIssueRow(page);
  if (first === null) {
    await expect(emptyListVisible(page)).toBeVisible();
    return;
  }
  await expect(first).not.toHaveAttribute("open");
  const summary = first.locator(":scope > summary");
  await expect(summary).toBeVisible();
  const box = await summary.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  await expect(summary.getByRole("link")).toHaveCount(0);
  await expect(summary.getByText(/Pull request #\d+/)).toHaveCount(0);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: "Timeline" })).toHaveCount(0);
  await expect(first.getByRole("link", { name: new RegExp(`^${reviewsCopy.list.githubIssue} #`) })).toBeVisible();
  await expect(first.getByRole("link", { name: reviewsCopy.issue.viewLog }).first()).toBeVisible();
});

test("open=first and a home illustration click open the first accordion", async ({ page }) => {
  await expectNoPageErrors(page, async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: homeHeroCopy.heroIllustration.viewPublicRun }).click();
    await expect(page).toHaveURL(/\/issues\?open=first/);
    const fromHome = await firstIssueRow(page);
    if (fromHome !== null) await expect(fromHome).toHaveAttribute("open", "");
  });

  await page.goto("/issues#first", { waitUntil: "networkidle" });
  const fromHash = await firstIssueRow(page);
  if (fromHash !== null) await expect(fromHash).toHaveAttribute("open", "");

  const deep = page.locator("main details[data-issues-row]").nth(1);
  if ((await deep.count()) === 0) return;
  const deepId = await deep.getAttribute("id");
  expect(deepId).toBeTruthy();
  await page.goto(`/issues#${deepId}`, { waitUntil: "networkidle" });
  await expect(deep).toHaveAttribute("open", "");
  await expect(page.locator("main details[data-issues-row]").first()).not.toHaveAttribute("open");
});

test("issues heading lines up with the header brand at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/issues?open=first", { waitUntil: "networkidle" });
  const brand = page.locator("#nd-nav a").first();
  const heading = page.getByRole("heading", { name: reviewsCopy.list.title, exact: true });
  await expect(brand).toBeVisible();
  await expect(heading).toBeVisible();
  const brandBox = await brand.boundingBox();
  const headingBox = await heading.boundingBox();
  expect(brandBox).toBeTruthy();
  expect(headingBox).toBeTruthy();
  expect(Math.abs((headingBox?.x ?? 0) - (brandBox?.x ?? 0))).toBeLessThan(2);
});

test("open=first at 375 stacks duration and finished time", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/issues?open=first", { waitUntil: "networkidle" });
  expect(errors).toEqual([]);
  const first = await firstIssueRow(page);
  if (first === null) {
    await expect(emptyListVisible(page)).toBeVisible();
    return;
  }
  await expect(first).toHaveAttribute("open", "");
  const took = first.getByText(new RegExp(`^${reviewsCopy.list.took} `)).first();
  const finished = first.getByText(new RegExp(`^${reviewsCopy.list.finished} `)).first();
  if ((await took.count()) === 0 || (await finished.count()) === 0) return;
  await expectNotSideBySide(took, finished);
});

async function expectNotSideBySide(a: Locator, b: Locator) {
  const aBox = await a.boundingBox();
  const bBox = await b.boundingBox();
  expect(aBox).toBeTruthy();
  expect(bBox).toBeTruthy();
  const sameRow =
    Math.abs((aBox?.y ?? 0) - (bBox?.y ?? 0)) < 8 &&
    Math.abs((aBox?.x ?? 0) - (bBox?.x ?? 0)) > 8;
  expect(sameRow).toBe(false);
}
