import { expect, test } from "@playwright/test";

import { MAP_SETUP_MINI_PROMPT } from "../lib/ai-setup-onboarding.generated";
import { homePasteCopy } from "../ui/home/i18n/home-paste-copy";
import { homeSameIdeaCopy } from "../ui/home/i18n/home-same-idea-copy";
import { homeSixSentencesCopy } from "../ui/home/i18n/home-six-sentences-copy";

test.describe("home paste band", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("sits after the same-idea band, links Getting started; hero copies the map prompt", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const paste = page.locator("#paste");
    await expect(paste).toBeVisible();
    await expect(paste.getByRole("heading", { level: 2, name: "Paste one line. Go to lunch." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: homeSameIdeaCopy.section.title })).toBeVisible();
    await expect(page.locator("[data-home-same-idea-column]")).toHaveCount(2);
    await expect(page.locator("[data-home-same-idea-column='together']")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: homeSixSentencesCopy.section.title })).toBeVisible();
    await expect(page.locator("[data-home-six-sentences] li")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "What you get" })).toHaveCount(0);

    const hero = await page.locator("[data-home-hero-band]").boundingBox();
    const sameIdea = await page.locator("#same-idea").boundingBox();
    const sixSentences = await page.locator("#six-sentences").boundingBox();
    const pasteBox = await paste.boundingBox();
    const identities = await page.locator("#identities").boundingBox();
    expect(hero && sameIdea && sixSentences && pasteBox && identities).toBeTruthy();
    expect(sameIdea!.y).toBeGreaterThan(hero!.y);
    expect(sixSentences!.y).toBeGreaterThan(sameIdea!.y);
    expect(pasteBox!.y).toBeGreaterThan(sixSentences!.y);
    expect(pasteBox!.y).toBeLessThan(identities!.y);

    await expect(page.locator("#ai-setup")).toBeVisible();
    await expect(page.locator("#get-started")).toBeVisible();
    await expect(paste.locator("[data-setup-entry]")).toHaveCount(0);
    await expect(page.locator("[data-home-hero-prompt]")).toHaveCount(1);
    await expect(page.locator("[data-home-hero-lead] [data-setup-entry]")).toHaveCount(0);
    await expect(page.locator("[data-home-hero-prompt]").getByRole("button", { name: /Copy/ })).toHaveCount(1);

    await page.locator("[data-home-hero-prompt]").getByRole("button", { name: "Copy prompt" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(MAP_SETUP_MINI_PROMPT);

    await expect(paste.getByRole("link", { name: "Full install steps" })).toHaveAttribute(
      "href",
      homePasteCopy.fullStepsHref,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Code that's checked. Screens that match. From the agent you already use.",
    );
    await expect(page.getByRole("tab", { name: "AI + UI", exact: true })).toHaveAttribute("aria-selected", "true");

    await page.setViewportSize({ width: 320, height: 844 });
    await expect(page.locator("#paste")).toBeVisible();
    await expect(page.locator("#ai-setup")).toBeVisible();
    await expect(page.locator("#get-started")).toBeVisible();
    await expect(paste.locator("[data-setup-entry]")).toHaveCount(0);
  });
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
