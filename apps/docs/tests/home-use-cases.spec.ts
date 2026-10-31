import { expect, test } from "@playwright/test";

import { waitForAppliedLook } from "./identity-helpers";

/**
 * Home: calm hero; use-cases section uses explicit identity tabs instead of a
 * long pinned scroll gallery (audit L2c).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test("the hero keeps the page identity: nothing cycles, nothing is written", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("data-identity");
  await page.waitForTimeout(2500);
  await expect(page.locator("[data-identity-cycle], [data-identity-cycle-layer]")).toHaveCount(0);
  expect(await page.locator("html").getAttribute("data-identity")).toBe(before);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the use cases section follows the demo, before the AI setup section", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN;
    const precedes = (earlier: string, later: string) => {
      const a = document.querySelector(earlier);
      const b = document.querySelector(later);
      if (!a || !b) return false;
      return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    };
    return {
      h1BeforeDemo: precedes("#home-page h1", "#demo"),
      demo: top("#demo"),
      cases: top("#use-cases"),
      ai: top("#ai-setup"),
    };
  });
  expect(order.h1BeforeDemo).toBe(true);
  expect(order.demo).toBeLessThan(order.cases);
  expect(order.cases).toBeLessThan(order.ai);
});

const ORDER = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const LABELS = ["Mist", "Press", "Tide", "Volt", "Maison", "Glass"] as const;

test("the section offers six identity tabs, a preview panel, and See all six identities", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#use-cases");
  await expect(section.getByRole("tablist", { name: "Identity previews" })).toBeVisible();
  await expect(section.getByRole("tab")).toHaveCount(6);
  await expect(section.getByRole("link", { name: "See all six identities" })).toHaveAttribute(
    "href",
    "/docs/ui/design-your-identity",
  );
  await expect(section.locator("[data-scroll-scenes]")).toHaveCount(0);
});

test("choosing each tab shows that identity's scoped preview and copy", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#use-cases");
  for (let index = 0; index < LABELS.length; index++) {
    await section.getByRole("tab", { name: LABELS[index] }).click();
    const scene = section.locator("[data-use-case-scene]");
    await expect(scene).toHaveCount(1);
    await expect(scene).toHaveAttribute("data-identity", ORDER[index]);
    await expect(scene).toHaveAttribute("data-use-case-scene", /.+/);
    const heading = section.getByRole("heading", { level: 3 });
    await expect(heading).toBeVisible();
    expect((await heading.textContent())?.length ?? 0).toBeGreaterThan(5);
    expect(await scene.textContent()).toMatch(/\S/);
    expect(await scene.getAttribute("aria-hidden")).toBe("true");
    expect(await scene.evaluate((el) => el.hasAttribute("inert"))).toBe(true);
  }
});

test("the stage ends with actions into the editor and the no-code route (#1092)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const section = page.locator("#use-cases");
  await expect(section.getByRole("link", { name: "Design your identity" })).toHaveAttribute(
    "href",
    "/docs/ui/design-your-identity",
  );
  await expect(section.getByRole("link", { name: "Start without writing code" })).toHaveAttribute(
    "href",
    "/docs/start-without-writing-code",
  );
});

test("switching tabs keeps the page identity and shows distinct looks", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const pageIdentity = await page.locator("html").getAttribute("data-identity");
  const section = page.locator("#use-cases");
  const seen: { identity: string; font: string; radius: string }[] = [];
  for (const label of LABELS) {
    await section.getByRole("tab", { name: label }).click();
    const scene = section.locator("[data-use-case-scene]");
    seen.push(
      await scene.evaluate((el) => {
        const title = el.querySelector("[class*='font-semibold']");
        const button = el.querySelector("button");
        return {
          identity: el.getAttribute("data-identity") ?? "",
          font: title ? getComputedStyle(title).fontFamily : "",
          radius: button ? getComputedStyle(button).borderTopLeftRadius : "",
        };
      }),
    );
    expect(await page.locator("html").getAttribute("data-identity")).toBe(pageIdentity);
  }
  expect(seen.map((entry) => entry.identity)).toEqual([...ORDER]);
  expect(new Set(seen.map((entry) => entry.font)).size).toBeGreaterThanOrEqual(4);
  expect(new Set(seen.map((entry) => entry.radius)).size).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test("a scene keeps its own look under any page identity", async ({ page }) => {
  const signatures: Record<string, string>[] = [];
  for (const identity of ["mist", "press", "volt"] as const) {
    await page.addInitScript((id) => localStorage.setItem("zk-identity", id), identity);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    await page.locator("#use-cases").getByRole("tab", { name: "Tide" }).click();
    signatures.push(
      await page.locator("[data-use-case-scene]").evaluate((el) => {
        const button = el.querySelector("button");
        const badge = el.querySelector("[class*='rounded']");
        return {
          [el.getAttribute("data-use-case-scene") ?? ""]: [
            getComputedStyle(el).backgroundColor,
            getComputedStyle(el).fontFamily,
            button ? getComputedStyle(button).borderTopLeftRadius : "",
            badge ? getComputedStyle(badge).borderTopLeftRadius : "",
          ].join("|"),
        };
      }),
    );
  }
  expect(signatures[1]).toEqual(signatures[0]);
  expect(signatures[2]).toEqual(signatures[0]);
});

for (const identity of ORDER) {
  for (const theme of ["light", "dark"] as const) {
    test(`phone, page identity ${identity} (${theme}): use-cases fits the viewport width`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await page.addInitScript(
        ([id, mode]) => {
          localStorage.setItem("zk-identity", id);
          localStorage.setItem("theme", mode);
        },
        [identity, theme],
      );
      await page.goto("/");
      await waitForAppliedLook(page, identity, theme);
      await page.locator("#use-cases").scrollIntoViewIfNeeded();
      await page.locator("#use-cases").getByRole("tab", { name: "Glass" }).click();
      const fits = await page.locator("[data-use-case-scene]").evaluate((el) => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= document.documentElement.clientWidth;
      });
      expect(fits).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
        true,
      );
    });
  }
}
