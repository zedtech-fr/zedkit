import { expect, test } from "@playwright/test";

import {
  AI_SETUP_MINI_PROMPT,
  MAP_SETUP_MINI_PROMPT,
  SUGGEST_MINI_PROMPT,
  UI_SETUP_MINI_PROMPT,
} from "../lib/ai-setup-onboarding.generated";
import { focusWithKeyboard } from "./a11y-helpers";

test.describe("home AI setup section", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("sits right after the hero, copies the prompt, links the guide", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const aiSetup = page.locator("#ai-setup");
    await expect(aiSetup).toBeVisible();
    await expect(aiSetup.getByRole("heading", { level: 2, name: "Set up AI or UI with a prompt" })).toBeVisible();
    await expect(aiSetup.getByRole("heading", { level: 3, name: "What you get" })).toBeVisible();

    const hero = await page.locator("[data-home-hero-band]").boundingBox();
    const aiBox = await aiSetup.boundingBox();
    const identities = await page.locator("#identities").boundingBox();
    expect(hero && aiBox && identities).toBeTruthy();
    expect(aiBox!.y).toBeGreaterThan(hero!.y);
    expect(aiBox!.y).toBeLessThan(identities!.y);

    const aiField = aiSetup.locator("[data-setup-entry='ai']");
    const uiField = aiSetup.locator("[data-setup-entry='ui']");
    await expect(aiField).toBeVisible();
    await expect(uiField).toBeVisible();
    const aiLabel = aiField.locator("[data-slot='label']");
    const uiLabel = uiField.locator("[data-slot='label']");
    const [aiType, uiType, suggestType] = await Promise.all([
      aiLabel.evaluate((el) => {
        const style = getComputedStyle(el);
        return { fontSize: style.fontSize, fontWeight: style.fontWeight };
      }),
      uiLabel.evaluate((el) => {
        const style = getComputedStyle(el);
        return { fontSize: style.fontSize, fontWeight: style.fontWeight };
      }),
      aiSetup.locator("[data-setup-entry='suggest'] [data-slot='text']").evaluate((el) => {
        const style = getComputedStyle(el);
        return { fontSize: style.fontSize, fontWeight: style.fontWeight };
      }),
    ]);
    expect(aiType).toEqual(uiType);
    expect(suggestType.fontSize).not.toEqual("");
    expect(Number.parseFloat(suggestType.fontSize)).toBeLessThanOrEqual(Number.parseFloat(aiType.fontSize));

    for (const [name, value] of [
      ["Copy AI setup prompt", AI_SETUP_MINI_PROMPT],
      ["Copy UI setup prompt", UI_SETUP_MINI_PROMPT],
      ["Copy combined setup prompt", MAP_SETUP_MINI_PROMPT],
      ["Copy suggest prompt", SUGGEST_MINI_PROMPT],
    ] as const) {
      await aiSetup.getByRole("button", { name }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
    }

    const terminal = aiSetup.getByRole("region", { name: "AI setup commands" });
    await expect(terminal).toContainText("npx @zedtech/zedkit-ai setup --provider cursor");
    await expect(terminal).toContainText("/setup-ai — install alone is not done");
    await expect(aiSetup.locator("[data-home-ai-counters]")).toBeVisible();
    await expect(aiSetup.locator("[data-home-ai-counters]")).toContainText("skills");
    await expect(aiSetup.locator("[data-home-ai-counters]")).toContainText("agents");
    await expect(aiSetup.locator("[data-home-ai-counters]")).toContainText("files");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await expect(aiSetup.getByRole("link", { name: "Read the AI setup guide" })).toHaveAttribute("href", "/docs/ai/setup");
    await expect(aiSetup.getByRole("link", { name: "UI setup on Getting started" })).toHaveAttribute("href", "/docs/getting-started#ui-button");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Code that's checked. Screens that match.");

    await page.setViewportSize({ width: 320, height: 844 });
    await expect(aiField).toBeVisible();
    await expect(uiField).toBeVisible();
    const phoneScroll = await page.evaluate(() => document.documentElement.scrollWidth);
    const phoneClient = await page.evaluate(() => document.documentElement.clientWidth);
    expect(phoneScroll).toBeLessThanOrEqual(phoneClient + 1);
  });

  test("the guide route exists", async ({ page }) => {
    const response = await page.goto("/docs/ai/setup", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Set up zedkit AI in");
    const inline = page.locator("[data-setup-prompt] a");
    await expect(inline).toHaveCount(2);
    const offsets = await inline.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).textUnderlineOffset));
    expect(offsets).toEqual(["2px", "2px"]);
    await expect(inline.first()).not.toHaveClass(/underline-offset-/);
    const word = page.locator("h1 [data-setup-word] [data-word-roll='in']");
    await expect(word).toBeVisible();
    await expect.poll(async () =>
      word.evaluate((node) => {
        const probe = document.createElement("span");
        probe.style.textDecorationColor = "color-mix(in oklab, hsl(var(--primary)) 50%, transparent)";
        node.append(probe);
        const style = getComputedStyle(node);
        const match = style.textDecorationColor === getComputedStyle(probe).textDecorationColor;
        probe.remove();
        const host = node.closest("[data-setup-word]");
        return match && style.textDecorationLine === "underline" && !host?.className.includes("decoration-primary/");
      }),
    ).toBe(true);
    await expect(page.getByText("Give your coding agent one prompt to set up zedkit AI in your project.")).toBeVisible();
    await expect(page.locator("[data-slot='text'] p")).toHaveCount(0);
  });

  test("the guide H1 keeps the same tree under reduced motion (no cycling)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/docs/ai/setup", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "Set up zedkit AI in Cursor, Muse, Claude, or your choice" })).toBeVisible();
    await expect(page.locator("h1 [data-word-roll='in']")).toHaveText("Cursor");
    await expect(page.locator("h1 [data-animate]")).toHaveCount(0);
  });

  test("terminal region is keyboard reachable and wide screens show it beside the prompt", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const terminal = page.locator("#ai-setup").getByRole("region", { name: "AI setup commands" });
    await focusWithKeyboard(terminal);
    await expect(terminal).toBeFocused();
    const focus = await terminal.evaluate((el) => {
      const style = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      return {
        className: el.className,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        ringWidth: root.getPropertyValue("--ring-width").trim(),
        ringOffset: root.getPropertyValue("--ring-offset-width").trim(),
      };
    });
    expect(focus.className).not.toContain("outline-2");
    expect(focus.outlineStyle).toBe("solid");
    expect(focus.outlineWidth).toBe(focus.ringWidth);
    expect(focus.outlineOffset).toBe(`-${focus.ringOffset}`);
    const prompt = await page.locator("#ai-setup [data-setup-entry='ai'] textarea").boundingBox();
    const tree = await terminal.boundingBox();
    expect(prompt && tree).toBeTruthy();
    expect(tree!.x).toBeGreaterThan(prompt!.x + prompt!.width);
  });

  test("manifest counters and plain words: the benefits name what the setup does", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("[data-home-ai-counters]")).toBeVisible();
    for (const title of ["One agent plans. Specialists do the work.", "The agent that writes is never the one that checks.", "The workflows your repo repeats become commands."]) {
      await expect(page.locator("#ai-setup").getByRole("heading", { level: 4, name: title })).toBeVisible();
    }
    await expect(page.locator("#ai-setup")).not.toContainText("Thin orchestration");
  });

  test("the shorter column stays in view while the longer one scrolls (StickyAside)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const aside = page.locator("#ai-setup [data-sticky-aside-aside]");
    const main = page.locator("#ai-setup [data-sticky-aside-main]");
    const heights = await Promise.all([aside.boundingBox(), main.boundingBox()]);
    expect(heights[0]!.height).toBeLessThan(heights[1]!.height);
    await expect(aside).toHaveCSS("position", "sticky");
    await main.evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + 100, behavior: "instant" }));
    await page.waitForTimeout(700);
    const first = (await aside.boundingBox())!.y;
    await page.evaluate(() => window.scrollBy({ top: 150, behavior: "instant" }));
    await page.waitForTimeout(300);
    const second = (await aside.boundingBox())!.y;
    expect(Math.abs(second - first)).toBeLessThan(2);
    expect(first).toBeLessThan(120);
  });

  test("the entrance uses the kit animate layer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#ai-setup [data-animate-stagger]")).toHaveAttribute("data-animate", "fade-up");
    await expect(page.locator("#ai-setup [data-slot='animate']")).toHaveAttribute("data-animate", "fade-in");
  });

  test("under reduced motion nothing waits for an entrance", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#ai-setup").scrollIntoViewIfNeeded();
    const pending = await page.locator("#ai-setup [data-animate-state='pending']").count();
    expect(pending).toBe(0);
    await expect(page.locator("#ai-setup [data-slot='animate']")).toHaveCSS("opacity", "1");
  });
});
