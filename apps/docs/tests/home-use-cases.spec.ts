import { expect, test, type Page } from "@playwright/test";

import { waitForAppliedLook } from "./identity-helpers";

/**
 * Home: the hero stays calm (one identity, nothing cycling) and the
 * second section scrolls through one kit in six identities on a pinned
 * stage, each scene with its own identity and content.
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
const BLOCK = "#use-cases [data-scroll-scene]";

/** Scroll the page so the pinned stage sits on scene `index` (middle of its slice). */
async function scrollToScene(page: Page, index: number) {
  await page.evaluate((i) => {
    const track = document.querySelector<HTMLElement>("#use-cases [data-scroll-scenes]");
    const stage = track?.firstElementChild as HTMLElement | null;
    if (!track || !stage) throw new Error("no scenes");
    const count = track.querySelectorAll("[data-scroll-scene]").length;
    const pinned = track.offsetHeight - stage.offsetHeight;
    const start = track.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(stage).top) || 0);
    window.scrollTo(0, start + (pinned * (i + 0.5)) / count);
  }, index);
}

const opacities = (page: Page) =>
  page.locator(BLOCK).evaluateAll((nodes) => nodes.map((el) => Number(getComputedStyle(el).opacity)));

test("the stage ends with actions into the editor and the no-code route (#1092)", async ({ page }) => {
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

test("no tabs: six scenes, one per identity, each with its name, a line of text and examples", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#use-cases").getByRole("tab")).toHaveCount(0);
  await expect(page.locator("#use-cases").getByRole("tablist")).toHaveCount(0);
  const blocks = page.locator(BLOCK);
  await expect(blocks).toHaveCount(6);
  const seen = await blocks.evaluateAll((nodes) =>
    nodes.map((node) => {
      const scene = node.querySelector("[data-use-case-scene]");
      const label = node.querySelector("h3")?.textContent ?? "";
      const caption = [...node.querySelectorAll("p")].map((p) => p.textContent ?? "");
      return {
        identity: scene?.getAttribute("data-identity") ?? "",
        label,
        identityName: caption[0] ?? "",
        line: caption[1] ?? "",
        sceneText: scene?.textContent ?? "",
        hidden: scene?.getAttribute("aria-hidden"),
        inert: scene?.hasAttribute("inert"),
      };
    }),
  );
  expect(seen.map((entry) => entry.identity)).toEqual([...ORDER]);
  for (const [index, entry] of seen.entries()) {
    expect(entry.identityName.toLowerCase()).toContain(ORDER[index]);
    expect(entry.label.length).toBeGreaterThan(5);
    expect(entry.line.length).toBeGreaterThan(30);
    expect(entry.sceneText.length).toBeGreaterThan(30);
    expect(entry.hidden).toBe("true");
    expect(entry.inert).toBe(true);
  }
  expect(new Set(seen.map((entry) => entry.sceneText)).size).toBe(6);
});

test("scrolling through the scenes: each shows its own look, the page identity stays", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const pageIdentity = await page.locator("html").getAttribute("data-identity");
  const seen: { identity: string; font: string; radius: string }[] = [];
  const blocks = page.locator(BLOCK);
  for (let index = 0; index < 6; index++) {
    await scrollToScene(page, index);
    const scene = blocks.nth(index).locator("[data-use-case-scene]");
    await expect(scene).toBeInViewport();
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
  expect(new Set(seen.map((entry) => entry.font)).size).toBeGreaterThanOrEqual(4);
  expect(new Set(seen.map((entry) => entry.radius)).size).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test.describe("motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the stage is pinned and one scene at a time is shown while scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/");
    const stage = page.locator("#use-cases [data-scroll-scenes-stage]");
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    for (let index = 0; index < 6; index++) {
      await scrollToScene(page, index);
      await expect.poll(async () => (await opacities(page))[index]).toBeGreaterThanOrEqual(0.99);
      const others = (await opacities(page)).filter((_, other) => other !== index);
      for (const value of others) expect(value).toBeLessThanOrEqual(0.01);
      // The stage stays put under the header while the scenes change.
      const top = await stage.evaluate((el) => Math.round(el.getBoundingClientRect().top));
      expect(top).toBe(72);
    }
  });

  test("scenes never show on top of each other: no double exposure between two scenes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/");
    await scrollToScene(page, 0);
    const start = await page.evaluate(() => scrollY);
    for (let step = 0; step <= 40; step++) {
      await page.evaluate((y) => window.scrollTo(0, y), start + step * 40);
      const values = await opacities(page);
      expect(values.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(1.05);
    }
  });

  test("no layout shift and no sideways scroll across the whole pinned scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let index = 0; index < 6; index++) {
      await scrollToScene(page, index);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
  });

  test("the pinned track stays within a laptop scroll budget (#1086)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const perSceneSvh = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("#use-cases [data-scroll-scenes]")!;
      const stage = track.firstElementChild as HTMLElement;
      const count = track.querySelectorAll("[data-scroll-scene]").length;
      return (track.offsetHeight - stage.offsetHeight) / count / (window.innerHeight / 100);
    });
    // 40svh per scene by design: enough travel to read a caption, no 60svh dwell.
    expect(perSceneSvh).toBeGreaterThanOrEqual(30);
    expect(perSceneSvh).toBeLessThanOrEqual(45);
  });

  test("the captions stay in the page for assistive tech in every scene", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#use-cases h3")).toHaveCount(6);
    for (const heading of await page.locator("#use-cases h3").all()) {
      expect(await heading.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
      expect(await heading.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
    }
    // Native scrolling only: the page scrolls with the keyboard like anywhere else.
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  });
});

test("reduced motion: the scenes sit one under the other, nothing is pinned or animated", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stage = page.locator("#use-cases [data-scroll-scenes-stage]");
  expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("static");
  expect(await page.locator("#use-cases [data-scroll-scenes-progress]").evaluate((el) => getComputedStyle(el).display)).toBe("none");
  const states = await page.locator(BLOCK).evaluateAll((nodes) =>
    nodes.map((el) => ({ name: getComputedStyle(el).animationName, opacity: getComputedStyle(el).opacity })),
  );
  expect(states).toHaveLength(6);
  for (const state of states) {
    expect(state.name).toBe("none");
    expect(state.opacity).toBe("1");
  }
  const tops = await page.locator(BLOCK).evaluateAll((nodes) => nodes.map((el) => el.getBoundingClientRect().top));
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  expect(new Set(tops).size).toBe(6);
});

test("a scene keeps its own look under any page identity", async ({ page }) => {
  const signatures: Record<string, string>[] = [];
  for (const identity of ["mist", "press", "volt"] as const) {
    await page.addInitScript((id) => localStorage.setItem("zk-identity", id), identity);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    signatures.push(
      await page.locator("[data-use-case-scene]").evaluateAll((nodes) =>
        Object.fromEntries(
          nodes.map((el) => {
            const button = el.querySelector("button");
            const badge = el.querySelector("[class*='rounded']");
            return [
              el.getAttribute("data-use-case-scene") ?? "",
              [
                getComputedStyle(el).backgroundColor,
                getComputedStyle(el).fontFamily,
                button ? getComputedStyle(button).borderTopLeftRadius : "",
                badge ? getComputedStyle(badge).borderTopLeftRadius : "",
              ].join("|"),
            ];
          }),
        ),
      ),
    );
  }
  expect(signatures[1]).toEqual(signatures[0]);
  expect(signatures[2]).toEqual(signatures[0]);
});

for (const identity of ORDER) {
  for (const theme of ["light", "dark"] as const) {
    test(`phone, page identity ${identity} (${theme}): no sideways scroll, no layout shift while scrolling`, async ({ page }) => {
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
      const before = await page.evaluate(() => document.documentElement.scrollHeight);
      const blocks = page.locator(BLOCK);
      for (let index = 0; index < 6; index++) {
        await scrollToScene(page, index);
        const fits = await blocks.nth(index).evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= document.documentElement.clientWidth;
        });
        expect(fits, `block ${index} fits the phone width`).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      }
      await waitForAppliedLook(page, identity, theme);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
    });
  }
}
