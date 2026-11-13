import { expect, test } from "@playwright/test";

import { MAP_AI_UI_SETUP_MINI_PROMPT } from "../lib/ai-setup-onboarding.generated";
import { homeHeroCopy } from "../app/(home)/_home/i18n/home-hero-copy";
import { homeManifestoCopy } from "../app/(home)/_home/i18n/home-manifesto-copy";
import { homeSameIdeaCopy } from "../app/(home)/_home/i18n/home-same-idea-copy";
import { uiGalleryStats } from "../content/gallery";

const homeHeroHeading = homeHeroCopy.hero.title;

test("home explains the product without preview-only extra bands (#210)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-home-hero-category]")).toHaveText("Open source · MIT · by Zed Tech");
  await expect(
    page.getByRole("heading", {
      name: homeHeroHeading,
      level: 1,
    }),
  ).toBeVisible();
  for (const id of ["same-idea", "six-sentences", "paste", "identities", "limits", "manifesto", "closing"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.getByRole("heading", { name: "Find a component" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "More in the kit" })).toHaveCount(0);
  await expect(page.locator("#components, #entry-points, #your-identity, [data-home-yours]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "And yours?" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("home visitor copy carries no repo internals or literal backticks (#1090)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const leak of [
    "`",
    "catalog.json",
    "packages/ui/tests",
    "generated index",
    "generated doc page",
    "manifest-driven",
    "manifesto",
  ]) {
    expect(text, `home copy must not contain ${JSON.stringify(leak)}`).not.toContain(leak);
  }
  await expect(page.getByText(homeManifestoCopy.quote)).toBeVisible();
  await expect(page.getByText(homeManifestoCopy.goldenRule)).toBeVisible();
  await expect(page.getByText(homeManifestoCopy.attribution)).toBeVisible();
  await expect(page.getByRole("link", { name: /manifesto/i })).toHaveCount(0);
});

test("home hero matches the mockup first screen: two-beat title, prompt, glass card (#118, #247, #258)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  // #118 supersedes the Setup / Get started / Browse catalog hero row (#111).
  await expect(page.locator("[data-home-hero-lead]").getByRole("link", { name: "Setup" })).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByRole("link", { name: "Get started" })).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByRole("link", { name: "Browse catalog" })).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead] a[data-site-action]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy prompt", exact: true })).toHaveAttribute(
    "data-site-action",
    "",
  );

  await expect(page.locator("[data-home-hero-lead]").getByRole("tablist")).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByRole("tab")).toHaveCount(0);

  await expect(page.locator("[data-home-hero-actions]")).toHaveCount(0);
  await expect(page.locator("[data-hero-shapes]")).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByRole("link")).toHaveCount(0);
  await expect(page.getByText("See a real issue, end to end")).toHaveCount(0);

  await expect(page.locator("[data-home-hero-sub]")).toHaveText(homeHeroCopy.hero.sub);
  await expect(
    page.locator("[data-home-hero-prompt]").getByText(MAP_AI_UI_SETUP_MINI_PROMPT),
  ).toBeVisible();
  await expect(
    page.locator("[data-home-closing]").getByText(MAP_AI_UI_SETUP_MINI_PROMPT),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy prompt", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Copy closing prompt", exact: true })).toHaveCount(1);
  await expect(page.locator("[data-home-hero-prompt]")).toHaveCount(1);
  await expect(page.locator("#home-hero-prompt-caption")).toHaveCount(0);
  await expect(page.getByText("Add an empty state to the tasks list")).toBeVisible();
  await expect(page.getByText("An illustration of one run, not a recording.")).toBeVisible();
  await expect(
    page.locator("[data-home-hero-preview]").getByRole("link", {
      name: homeHeroCopy.heroIllustration.viewPublicRun,
    }),
  ).toHaveAttribute("href", "/issues?open=first");
  await expect(page.locator("[data-hero-run-stage]")).toBeVisible();
  await expect(page.locator("#demo")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("[data-home-hero-lead] [data-home-hero-category]")).toHaveText(
    "Open source · MIT · by Zed Tech",
  );
  await expect(
    page.locator("[data-home-hero-lead]").getByRole("heading", {
      name: homeHeroHeading,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.locator("[data-home-hero-band]").getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText(/theme everything with one of six identities/)).toHaveCount(0);
  await expect(page.getByText(/linked maturity badges/)).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByText(/Latest in v/)).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead] [data-install-command]")).toHaveCount(0);

  const pause = page.getByRole("button", { name: "Pause illustration motion" });
  await expect(pause).toBeVisible();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await pause.click();
  await expect(page.getByRole("button", { name: "Play illustration motion" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("[data-hero-run-stage]")).toHaveAttribute("role", "group");
  await expect(page.locator("[data-hero-run-stage]")).toHaveAttribute(
    "aria-label",
    homeHeroCopy.heroIllustration.stageLabel,
  );
  const badgeInSpan = await page.evaluate(
    () =>
      [...document.querySelectorAll("[data-hero-run-stage] span")].some((node) =>
        node.querySelector('[data-slot="badge"]'),
      ),
  );
  expect(badgeInSpan).toBe(false);
});

test("home hero has no facts line; same-idea holds MIT and React 19 proof (#118)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  // #118 drops the hero facts line; #1057's proofs band stays gone; MIT / React 19 live in same-idea.
  await expect(
    page.locator("[data-home-hero-lead]").getByText(/React 19/),
  ).toHaveCount(0);
  const landsProof = homeSameIdeaCopy.lands.proof(
    homeSameIdeaCopy.kitCounts.skills,
    homeSameIdeaCopy.kitCounts.agents,
    uiGalleryStats.components,
    homeSameIdeaCopy.kitCounts.looks,
  );
  await expect(page.locator("[data-home-same-idea-lands]").getByText(landsProof)).toBeVisible();
  const stackLine = page.getByText("React 19 and Tailwind CSS 4, from npm or as source");
  await stackLine.scrollIntoViewIfNeeded();
  await expect(stackLine).toBeVisible();
  await expect(page.getByText("What you see is MIT, React 19, Tailwind 4.")).toHaveCount(0);
  await expect(page.getByText(/^Latest in v/)).toHaveCount(0);
  await expect(page.locator("#proofs")).toHaveCount(0);
});

test("home hero has no identity form; looks stay in the dock (#118, #110)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });
  // #118 supersedes the Display-row identity picker (#1072) in the hero.
  await expect(page.locator("[data-home-hero-band]").getByRole("combobox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "And yours?" })).toBeVisible();
});

test("home hero glass card is on the first screen at 1440 (#118)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const title = page.getByText("Add an empty state to the tasks list");
  await expect(title).toBeVisible();
  const box = await title.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  await expect(page.getByText("Harbor Studio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add app" })).toHaveCount(0);
});

test("home hero at 390 is headline-first; the glass card follows (#118)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-home-hero-lead]").getByRole("tablist")).toHaveCount(0);
  await expect(page.locator("#home-hero-prompt-caption")).toHaveCount(0);
  const order = await page.evaluate(() => {
    const lead = document.querySelector("[data-home-hero-lead]");
    const stage = document.querySelector("[data-hero-run-stage]");
    if (!lead || !stage) return null;
    return lead.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(order).toBeTruthy();
});

test("home extra bands stay gone at 390 and 1440; the dock remains (#210)", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Find a component" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "More in the kit" })).toHaveCount(0);
    await expect(page.locator("#components, #entry-points, #your-identity, [data-home-yours]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "And yours?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Catalog", exact: true }).first()).toBeVisible();
  }
});

test("home catalog link in the site header opens the catalog", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Catalog", exact: true }).first().click();
  await page.waitForURL("**/catalog**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home shows no maturity badges", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("a[data-badge-link]")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home paste band has no install control on phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#paste [data-home-full-steps]")).toHaveCount(0);
  await expect(page.locator("#paste [data-home-paste-lands]")).toBeVisible();
  await expect(page.locator("#ai-setup [data-docs-ctas]")).toHaveCount(0);
  await expect(page.locator("#proofs")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home paste band light/dark (#748)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const paste = page.locator("#paste [data-home-paste-lands]");
      await paste.scrollIntoViewIfNeeded();
      await expect(paste).toBeVisible();
      await paste.screenshot({ path: `test-results/home-cta-scenarios-${mode}.png` });
    });
  }
});

test.describe("home paste band light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const paste = page.locator("#paste [data-home-paste-lands]");
      await paste.scrollIntoViewIfNeeded();
      await expect(paste).toBeVisible();
      await paste.screenshot({ path: `test-results/home-section-cta-install-${mode}.png` });
      await paste.screenshot({ path: `test-results/home-section-cta-ai-${mode}.png` });
    });
  }
});

test.describe("home header Get started CTA light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const getStarted = page.getByRole("link", { name: "Get started" }).first();
      await getStarted.scrollIntoViewIfNeeded();
      await expect(getStarted).toBeVisible();
      await getStarted.screenshot({ path: `test-results/home-header-docs-cta-${mode}.png` });
    });
  }
});

test("home has no nested interactive elements", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const nested = await page.evaluate(() => {
    const bad: string[] = [];
    for (const anchor of document.querySelectorAll("a")) {
      if (anchor.querySelector("button")) bad.push(`anchor>button: ${anchor.textContent?.trim()}`);
    }
    for (const button of document.querySelectorAll("button")) {
      const parentAnchor = button.closest("a");
      if (parentAnchor && parentAnchor.querySelector("button") === button) {
        bad.push(`button inside anchor: ${button.textContent?.trim()}`);
      }
    }
    return bad;
  });
  expect(nested).toEqual([]);
});

test("home get-started hash lands on the paste band, not an install panel", async ({ page }) => {
  await page.goto(`#get-started`, { waitUntil: "networkidle" });
  await expect(page.locator("#get-started")).toBeVisible();
  await expect(page.locator("#get-started [data-setup-entry]")).toHaveCount(0);
  await expect(page.locator("[data-home-hero-prompt]")).toHaveCount(1);
  await expect(page.locator("#install-or-copy")).toHaveCount(0);
  await expect(page.locator("#get-started [data-home-ai-setup]")).toHaveCount(0);
  await expect(page.locator("#get-started [data-home-way]")).toHaveCount(0);
  await expect(page.locator("#paste [data-home-full-steps]")).toHaveCount(0);
  await expect(page.locator("#get-started [data-home-paste-lands]")).toBeVisible();
});

test("home has no registry brick grid; catalog link lives in the header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`#paste`, { waitUntil: "networkidle" });
  await expect(page.locator("#install-or-copy")).toHaveCount(0);
  await expect(page.locator("[data-registry-bricks]")).toHaveCount(0);
  const catalog = page.getByRole("link", { name: "Catalog", exact: true }).first();
  await catalog.scrollIntoViewIfNeeded();
  await expect(catalog).toHaveAttribute("href", "/catalog");
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home search opens from the header", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
});

test("home keyboard: tab reaches Catalog", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  let found = false;
  for (let i = 0; i < 50; i++) {
    const active = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (active === "Catalog" || active.includes("Catalog")) {
      found = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(found).toBe(true);
});

test.describe("persona evidence screenshots", () => {
  test("capture desktop and mobile home", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({ path: "test-results/home-desktop-light.png", fullPage: true });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.screenshot({ path: "test-results/home-desktop-dark.png", fullPage: true });
    await page.emulateMedia({ colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/home-mobile-light.png", fullPage: true });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

test("the identity dock swatch keeps a quiet border", async ({ page }) => {
  await page.goto("/");
  const swatch = page.locator("[data-slot='identity-dock-swatch']");
  await expect(swatch).toBeVisible();
  const mark = await swatch.evaluate((node) => {
    const probe = document.createElement("span");
    probe.className = "border border-border/60";
    document.body.append(probe);
    const expected = getComputedStyle(probe).borderTopColor;
    probe.remove();
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return {
      color: style.borderTopColor,
      expected,
      width: style.borderTopWidth,
      square: box.width === box.height,
      numeric: node.className.includes("border-border/"),
    };
  });
  expect(mark.color).toBe(mark.expected);
  expect(mark.width).toBe("1px");
  expect(mark.square).toBe(true);
  expect(mark.numeric).toBe(false);
});
