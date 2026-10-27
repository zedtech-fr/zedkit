import { expect, test } from "@playwright/test";

/**
 * Home: the hero stays calm (one identity, nothing cycling) and the
 * second section scrolls through one kit in six identities, each scene with
 * its own identity and content.
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

test("the use cases section follows the hero, before the AI setup section", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN;
    return { h1: top("#home-page h1"), cases: top("#use-cases"), ai: top("#ai-setup") };
  });
  expect(order.h1).toBeLessThan(order.cases);
  expect(order.cases).toBeLessThan(order.ai);
});

const ORDER = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const BLOCK = "#use-cases [data-use-case]";

test("no tabs: six blocks, one per identity, each with its name, a line of text and a scene", async ({ page }) => {
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
  await page.goto("/");
  const pageIdentity = await page.locator("html").getAttribute("data-identity");
  const seen: { identity: string; font: string; radius: string }[] = [];
  const blocks = page.locator(BLOCK);
  for (let index = 0; index < 6; index++) {
    const scene = blocks.nth(index).locator("[data-use-case-scene]");
    await scene.scrollIntoViewIfNeeded();
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

  test("a scene eases in with the scroll and is fully opaque once in view", async ({ page }) => {
    await page.goto("/");
    const scene = page.locator("[data-use-case-scene]").nth(2);
    const animation = await scene.evaluate((el) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, timeline: style.animationTimeline };
    });
    expect(animation.name).not.toBe("none");
    expect(animation.timeline).not.toBe("auto");
    await scene.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect.poll(() => scene.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(0.99);
    // Soft by construction: never a fade from nothing, so the text stays readable.
    const first = await page.locator("[data-use-case-scene]").nth(5).evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(first).toBeGreaterThanOrEqual(0.35);
  });
});

test("reduced motion: the scenes appear without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const states = await page.locator("[data-use-case-scene]").evaluateAll((nodes) =>
    nodes.map((el) => ({ name: getComputedStyle(el).animationName, opacity: getComputedStyle(el).opacity })),
  );
  expect(states).toHaveLength(6);
  for (const state of states) {
    expect(state.name).toBe("none");
    expect(state.opacity).toBe("1");
  }
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
      await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
      await page.locator("#use-cases").scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => document.documentElement.scrollHeight);
      const blocks = page.locator(BLOCK);
      for (let index = 0; index < 6; index++) {
        await blocks.nth(index).scrollIntoViewIfNeeded();
        const fits = await blocks.nth(index).evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= document.documentElement.clientWidth;
        });
        expect(fits, `block ${index} fits the phone width`).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      }
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
    });
  }
}
