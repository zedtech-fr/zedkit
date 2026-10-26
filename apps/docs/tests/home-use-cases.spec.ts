import { expect, test } from "@playwright/test";

/**
 * Home: the hero stays calm (one identity, nothing cycling) and the
 * second section shows one kit as six use cases, each with its own
 * identity and content, chosen by the visitor.
 */
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const SCENE = "[data-use-case-scene]";

test.use({ storageState: { cookies: [], origins: [] } });

test("the hero keeps the page identity: nothing cycles, nothing is written", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.locator("[data-identity-cycle], [data-identity-cycle-layer]")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the use cases section follows the hero, before the AI setup section", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN;
    return { h1: top("#home-page h1"), cases: top("#use-cases"), ai: top("#ai-setup") };
  });
  expect(order.h1).toBeLessThan(order.cases);
  expect(order.cases).toBeLessThan(order.ai);
});

test("each tab shows its own identity and content, and leaves the page identity alone", async ({ page }) => {
  await page.goto("/");
  const tabs = page.locator("#use-cases").getByRole("tab");
  await expect(tabs).toHaveCount(6);
  const seen: { title: string; identity: string; font: string; radius: string; background: string }[] = [];
  for (let index = 0; index < 6; index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    const scene = page.locator(SCENE);
    await expect(scene).toHaveCount(1);
    await expect(scene).toHaveAttribute("aria-hidden", "true");
    await expect(scene).toHaveAttribute("inert", "");
    seen.push(
      await scene.evaluate((el) => {
        const title = el.querySelector("p, h3, [class*='font-semibold']");
        const button = el.querySelector("button");
        return {
          title: el.textContent?.slice(0, 40) ?? "",
          identity: el.getAttribute("data-identity") ?? "",
          font: title ? getComputedStyle(title).fontFamily : "",
          radius: button ? getComputedStyle(button).borderTopLeftRadius : "",
          background: getComputedStyle(el).backgroundColor,
        };
      }),
    );
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
  }
  expect(seen.map((entry) => entry.identity)).toEqual(["mist", "maison", "press", "volt", "tide", "glass"]);
  expect(new Set(seen.map((entry) => entry.title)).size).toBe(6);
  expect(new Set(seen.map((entry) => entry.font)).size).toBeGreaterThanOrEqual(4);
  expect(new Set(seen.map((entry) => entry.radius)).size).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test("arrow keys move between use cases", async ({ page }) => {
  await page.goto("/");
  const tabs = page.locator("#use-cases").getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(SCENE)).toHaveAttribute("data-identity", "maison");
  await page.keyboard.press("End");
  await expect(page.locator(SCENE)).toHaveAttribute("data-identity", "glass");
});

test.describe("motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("switching fades the scene in", async ({ page }) => {
    await page.goto("/");
    await page.locator("#use-cases").getByRole("tab").nth(2).click();
    const name = await page.locator(SCENE).evaluate((el) => getComputedStyle(el).animationName);
    expect(name).not.toBe("none");
  });
});

test("reduced motion: the scene appears without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#use-cases").getByRole("tab").nth(1).click();
  const name = await page.locator(SCENE).evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe("none");
});

for (const identity of IDENTITIES) {
  test(`phone, page identity ${identity}: no horizontal overflow, tabs are touch sized`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.addInitScript((id) => localStorage.setItem("zk-identity", id), identity);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    const tabs = page.locator("#use-cases").getByRole("tab");
    for (let index = 0; index < 6; index++) {
      await tabs.nth(index).click();
      const box = await tabs.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
}
