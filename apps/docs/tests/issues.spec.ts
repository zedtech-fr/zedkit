import { expect, test, type Locator, type Page } from "@playwright/test";

import { homeHeroCopy } from "../app/(home)/_home/i18n/home-hero-copy";
import { reviewsCopy } from "../features/reviews/i18n/reviews-copy";

async function firstIssueRow(page: Page) {
  const rows = page.locator("main [data-issues-row]");
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

test("issue rows are selectable list links with the first item open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/issues");
  const first = await firstIssueRow(page);
  if (first === null) {
    await expect(emptyListVisible(page)).toBeVisible();
    return;
  }
  await expect(first).toHaveAttribute("aria-current", "page");
  await expect(first).toHaveAttribute("data-active", "");
  const detail = page.locator("[data-issues-detail]");
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("link", { name: "Timeline" })).toHaveCount(0);
  await expect(detail.getByRole("link", { name: new RegExp(`^${reviewsCopy.list.githubIssue} #`) })).toBeVisible();
  const viewLog = detail.getByRole("link", { name: new RegExp(`^${reviewsCopy.issue.viewLog}`) });
  if ((await viewLog.count()) > 0) await expect(viewLog.first()).toBeVisible();
  await page.getByRole("button", { name: reviewsCopy.list.openList, exact: true }).click();
  const visible = page.locator("[data-issues-row]:visible").first();
  await expect(visible).toHaveAttribute("aria-current", "page");
  const box = await visible.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
  await expect(visible.locator("a")).toHaveCount(0);
  await expect(visible.getByText(/Pull request #\d+/)).toHaveCount(0);
});

test("open=first and a home illustration click select the first issue", async ({ page }) => {
  await expectNoPageErrors(page, async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: homeHeroCopy.heroIllustration.viewPublicRun }).click();
    await expect(page).toHaveURL(/\/issues\?open=first/);
    const fromHome = await firstIssueRow(page);
    if (fromHome !== null) await expect(fromHome).toHaveAttribute("aria-current", "page");
  });

  await page.goto("/issues#first", { waitUntil: "networkidle" });
  const fromHash = await firstIssueRow(page);
  if (fromHash !== null) await expect(fromHash).toHaveAttribute("aria-current", "page");

  const deep = page.locator("main [data-issues-row]").nth(1);
  if ((await deep.count()) === 0) return;
  const deepId = await deep.getAttribute("id");
  expect(deepId).toBeTruthy();
  await page.goto(`/issues#${deepId}`, { waitUntil: "networkidle" });
  await expect(deep).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main [data-issues-row]").first()).not.toHaveAttribute("aria-current");
});

test("unknown issue hash shows a missing note instead of the first issue", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/issues#issue-999999", { waitUntil: "networkidle" });
  const first = await firstIssueRow(page);
  if (first === null) {
    await expect(emptyListVisible(page)).toBeVisible();
    return;
  }
  await expect(first).not.toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-issues-detail]")).toContainText(reviewsCopy.list.missing);
  await expect(page.locator("[data-issues-detail]")).toContainText(reviewsCopy.list.missingNext);
  await expect(page).toHaveURL(/#issue-999999/);
  await page.goto("/issues#pr-999999", { waitUntil: "networkidle" });
  await expect(page.locator("[data-issues-detail]")).toContainText(reviewsCopy.list.missing);
  await expect(page).toHaveURL(/#pr-999999/);
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
  await expect(first).toHaveAttribute("aria-current", "page");
  const detail = page.locator("[data-issues-detail]");
  const took = detail.getByText(new RegExp(`^${reviewsCopy.list.took} `)).first();
  const finished = detail.getByText(new RegExp(`^${reviewsCopy.list.finished} `)).first();
  if ((await took.count()) === 0 || (await finished.count()) === 0) return;
  await expectNotSideBySide(took, finished);
});

test("desktop workspace is a two-pane layout with independent scrollports", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/issues", { waitUntil: "networkidle" });
  const aside = page.locator("[data-issues-aside]");
  const detail = page.locator("[data-issues-detail]");
  if ((await aside.count()) === 0) {
    await expect(emptyListVisible(page)).toBeVisible();
    return;
  }
  await expect(aside).toBeVisible();
  await expect(detail).toBeVisible();
  const asideBox = await aside.boundingBox();
  const detailBox = await detail.boundingBox();
  expect(asideBox).toBeTruthy();
  expect(detailBox).toBeTruthy();
  expect((asideBox?.x ?? 0) + (asideBox?.width ?? 0)).toBeLessThan((detailBox?.x ?? 0) + 2);
  const asideOverflow = await aside.evaluate((node) => getComputedStyle(node).overflowY);
  const detailOverflow = await detail.evaluate((node) => getComputedStyle(node).overflowY);
  expect(asideOverflow).toBe("auto");
  expect(detailOverflow).toBe("auto");
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
