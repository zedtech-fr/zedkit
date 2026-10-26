import { expect, test, type Page } from "@playwright/test";

/** Docs pages that must use the full main column on narrow viewports (#385). */
const DOCS_MOBILE_ROUTES = [
  "/docs",
  "/docs/getting-started",
  "/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo",
  "/docs/ui/trigger-actions-with-buttons",
] as const;

const MOBILE = { width: 390, height: 844 };
const MIN_MAIN_TEXT_WIDTH_RATIO = 0.8;

async function assertDocsMainTypographyWidth(page: Page) {
  const result = await page.evaluate((minRatio) => {
    const main = document.querySelector("main");
    if (!main) return { ok: false, reason: "missing main" };
    const mainWidth = main.getBoundingClientRect().width;
    const threshold = mainWidth * minRatio;
    const h1 = main.querySelector("h1");
    const intro = h1?.nextElementSibling;
    if (!h1 || !intro) {
      return { ok: false, reason: "missing h1 or intro sibling", mainWidth };
    }
    const h1Width = h1.getBoundingClientRect().width;
    const introWidth = intro.getBoundingClientRect().width;
    const scrollOk = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    return {
      ok: h1Width >= threshold && introWidth >= threshold && scrollOk,
      mainWidth,
      threshold,
      h1Width,
      introWidth,
      scrollOk,
    };
  }, MIN_MAIN_TEXT_WIDTH_RATIO);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
}

test.describe("docs mobile main column (#385)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  for (const path of DOCS_MOBILE_ROUTES) {
    test(`${path} uses full main width for title and intro`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await assertDocsMainTypographyWidth(page);
      await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    });
  }
});
