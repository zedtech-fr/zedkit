import { expect, test } from "@playwright/test";
import {
  catalogStats,
  featuredPackageVersion,
  uiGalleryStats,
} from "../content/gallery";
import { registryBrickNames } from "../content/registry-site";
import { DEFAULT_IDENTITY } from "../lib/default-identity";

const BASE = "http://127.0.0.1:3100";

test("home explains the product and four entry areas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", {
      name: "Build the parts you need. Keep the rest of your app.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose an area" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with buttons" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with the Nest bootstrap" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SEO docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open agent setup docs" })).toBeVisible();
  await expect(page.locator("#entry-points svg[aria-hidden='true']")).toHaveCount(8);
  expect(errors).toEqual([]);
});

test("home visitor copy carries no repo internals or literal backticks (#1090)", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const leak of ["`", "catalog.json", "packages/ui/tests", "generated index", "generated doc page", "manifest-driven"]) {
    expect(text, `home copy must not contain ${JSON.stringify(leak)}`).not.toContain(leak);
  }
});

test("home hero offers two ways in and keeps the other paths lower (#1038)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const heroActions = page.locator("[data-home-hero-actions] a");
  await expect(heroActions).toHaveCount(2);
  await expect(heroActions.nth(0)).toHaveText("Browse components");
  await expect(heroActions.nth(0)).toHaveAttribute("href", "/catalog");
  await expect(heroActions.nth(1)).toHaveText("Try the demo");
  await expect(heroActions.nth(1)).toHaveAttribute("href", "#demo");

  const more = page.locator("[data-home-secondary-actions] a");
  await expect(more).toHaveCount(2);
  await expect(more.nth(0)).toHaveText("Set up your coding agent");
  await expect(more.nth(0)).toHaveAttribute("href", "#ai-setup");
  await expect(more.nth(1)).toHaveAttribute("href", "/docs");

  const primaryBox = await page.locator("[data-home-hero-actions]").boundingBox();
  const secondaryBox = await page.locator("[data-home-secondary-actions]").boundingBox();
  expect(primaryBox && secondaryBox).toBeTruthy();
  expect(secondaryBox!.y).toBeGreaterThan(primaryBox!.y + primaryBox!.height - 1);

  await expect(
    page.getByText("React components you add to the app you already have."),
  ).toBeVisible();
  await expect(page.getByText(/theme everything with one of six identities/)).toHaveCount(0);
  await expect(page.getByText(/linked maturity badges/)).toHaveCount(0);
  const heroLead = page.locator("[data-home-hero-actions]").locator("..");
  await expect(heroLead.getByText(/Latest in v/)).toHaveCount(0);
});

test("home hero shows proof counts without release notes on the hero (#1057)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.getByText("MIT · React 19 · Tailwind 4 · npm or source")).toBeVisible();
  await expect(page.getByText(/^Latest in v/)).toHaveCount(0);
  await expect(page.locator("#proofs")).toContainText(
    `${catalogStats.packages} packages, ${catalogStats.needs} needs`,
  );
  await expect(page.locator("#proofs")).toContainText(`${uiGalleryStats.components} UI catalog entries`);
  const versionLinks = page.locator("#proofs").getByRole("link", { name: `v${featuredPackageVersion} (releases)` });
  await expect(versionLinks.first()).toHaveAttribute(
    "href",
    "https://github.com/zedtech-fr/zedkit/releases",
  );
});

test("home hero proof flips identity and dark in scope (#1072)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const proof = page.locator("[data-home-hero-proof]");
  const scope = proof.locator("[data-identity-scope]");
  const shellIdentity = await page.locator("html").getAttribute("data-identity");
  await expect(scope).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  await proof.getByRole("combobox", { name: "Identity for this demo" }).click();
  await page.getByRole("option", { name: "Tide" }).click();
  await expect(scope).toHaveAttribute("data-identity", "tide");
  await proof.getByRole("combobox", { name: "Color mode for this demo" }).click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(proof.locator("[data-home-hero-preview]")).toHaveClass(/dark/);
  const darkBg = await scope.evaluate((el) => getComputedStyle(el).backgroundColor);
  const channels = darkBg.match(/\d+/g)!.map(Number);
  expect(Math.max(...channels.slice(0, 3))).toBeLessThan(70);
  expect(await page.locator("html").getAttribute("data-identity")).toBe(shellIdentity);
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(false);
});

test("home hero embeds the interactive admin demo above the fold (#1111 L1b)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo.getByRole("button", { name: "Add app" })).toBeVisible();
  const box = await demo.getByRole("button", { name: "Add app" }).boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  await expect(demo.getByRole("columnheader", { name: "Name" })).toBeVisible();
});

test("home hero demo starts on the first mobile screen (#1111 L1b)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo.getByRole("button", { name: "Add app" })).toBeVisible();
  const top = await demo.boundingBox();
  expect(top).toBeTruthy();
  expect(top!.y).toBeLessThan(844);
});

test("home area cards keep a decorative icon at tablet width and up", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const section = page.locator("#entry-points");
  await expect(section.getByText("Build a UI", { exact: true })).toBeVisible();
  await expect(section.locator("svg[aria-hidden='true']")).toHaveCount(8);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("entry point CTAs open catalog or guide pages (not folder 404s)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const entry = page.getByRole("link", { name: "Start with buttons" });
  await entry.click();
  await page.waitForURL("**/docs/ui/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home gallery shows no maturity badges", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.locator("#components a[data-badge-link]")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home gallery cards show live previews on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const section = page.locator("#components");
  await section.scrollIntoViewIfNeeded();
  const cards = section.locator("[data-home-gallery-card]");
  await expect(cards).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const card = cards.nth(i);
    await expect(card.getByRole("link").first()).toBeVisible();
    const preview = card.locator("[data-home-gallery-preview]");
    await expect(preview).toBeVisible({ timeout: 15_000 });
    await expect(card.locator("code")).toHaveCount(0);
    await expect(
      preview.locator("button, input, [data-slot='badge'], .rounded-xl.border, [role='switch']"),
    ).not.toHaveCount(0);
  }
});

test("home gallery layout stays sane on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const section = page.locator("#components");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator("[data-home-gallery-card]").first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
  await section.screenshot({ path: "test-results/home-gallery-390.png" });
});

test.describe("home gallery maturity badges light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const section = page.locator("#components");
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByRole("link").first()).toBeVisible();
      await section.screenshot({ path: `test-results/home-maturity-gallery-${mode}.png` });
    });
  }
});

test("home scenario titles keep a decorative icon at tablet width and up", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const titles = page.locator("#scenarios [data-slot='card-title']");
  await expect(titles).toHaveCount(6);
  await expect(titles.locator("svg[aria-hidden='true']")).toHaveCount(6);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home scenario titles light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const scenarios = page.locator("#scenarios");
      await scenarios.scrollIntoViewIfNeeded();
      await expect(scenarios.getByText("New admin UI in an existing app", { exact: true })).toBeVisible();
      await scenarios.screenshot({ path: `test-results/home-scenario-titles-${mode}.png` });
    });
  }
});

test("home docs CTAs keep a decorative icon on phone (start-building band)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await expect(page.locator("#install-or-copy [data-docs-ctas] svg[aria-hidden='true']")).toHaveCount(2);
  await expect(page.locator("#ai-setup [data-docs-ctas] svg[aria-hidden='true']")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open documentation" }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  await expect(page.locator("#proofs")).toBeHidden();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home docs CTAs keep a decorative icon on tablet (catalog bands)", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  for (const name of [
    "Start with buttons",
    "Start with the Nest bootstrap",
    "Open SEO docs",
    "Open agent setup docs",
  ] as const) {
    await expect(page.getByRole("link", { name }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const scenarios = page.locator("#scenarios");
  await expect(scenarios.getByRole("link").locator("svg[aria-hidden='true']")).toHaveCount(6);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home docs CTAs light/dark (#748)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const entry = page.locator("#entry-points");
      const scenarios = page.locator("#scenarios");
      await entry.scrollIntoViewIfNeeded();
      await expect(entry.getByRole("link", { name: "Start with buttons" })).toBeVisible();
      await entry.screenshot({ path: `test-results/home-cta-entry-${mode}.png` });
      await scenarios.scrollIntoViewIfNeeded();
      await expect(scenarios.getByRole("link", { name: "Read the theme docs" })).toBeVisible();
      await scenarios.screenshot({ path: `test-results/home-cta-scenarios-${mode}.png` });
    });
  }
});

test.describe("home section docs CTAs light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const install = page.locator("#install-or-copy [data-docs-ctas]");
      const ai = page.locator("#ai-setup [data-docs-ctas]");
      await install.scrollIntoViewIfNeeded();
      await expect(install.getByRole("link", { name: "Getting started" })).toBeVisible();
      await install.screenshot({ path: `test-results/home-section-cta-install-${mode}.png` });
      await ai.scrollIntoViewIfNeeded();
      await expect(ai.getByRole("link", { name: "AI setup docs" })).toBeVisible();
      await ai.screenshot({ path: `test-results/home-section-cta-ai-${mode}.png` });
    });
  }
});

test.describe("home hero and proofs docs CTAs light/dark", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(BASE, { waitUntil: "networkidle" });
      const hero = page.getByRole("link", { name: "Open documentation" });
      const theme = page.getByRole("link", { name: "Theme setup page" });
      await hero.scrollIntoViewIfNeeded();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/home-hero-docs-cta-${mode}.png` });
      await theme.scrollIntoViewIfNeeded();
      await expect(theme).toBeVisible();
      await theme.screenshot({ path: `test-results/home-proofs-theme-cta-${mode}.png` });
    });
  }
});

test("home scenario links have unique accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const scenarios = page.locator("#scenarios");
  await expect(scenarios.getByRole("link", { name: "Read the theme docs" })).toBeVisible();
  await expect(scenarios.getByRole("link", { name: "Read the agent setup docs" })).toBeVisible();
  await expect(scenarios.getByRole("link", { name: "Read the form docs" })).toBeVisible();
  await expect(scenarios.getByRole("link", { name: "Read the DataTable docs" })).toBeVisible();
  await expect(scenarios.getByRole("link", { name: "Read the Drawer docs" })).toBeVisible();
  const scenarioLink = scenarios.getByRole("link", { name: "Read the Button docs" });
  await expect(scenarioLink).toBeVisible();
  await scenarioLink.click();
  await page.waitForURL("**/docs/ui/trigger-actions-with-buttons", { timeout: 10000 });
});

test("home has no nested interactive elements", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
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

test("home UI quickstart points to the getting started guide", async ({ page }) => {
  await page.goto(`${BASE}#quickstart`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Open the full UI quickstart" })).toHaveAttribute(
    "href",
    "/docs/getting-started#ui-button",
  );
});

test("home install section links to the catalog instead of listing every brick", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}#install-or-copy`, { waitUntil: "networkidle" });
  await expect(page.locator("#install-or-copy [data-registry-bricks]")).toHaveCount(0);
  const count = registryBrickNames.filter((name) => name !== "theme").length;
  await expect(
    page.getByRole("link", { name: `${count} components available in the registry → Catalog` }),
  ).toHaveAttribute("href", "/docs");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home search opens from the header", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
});

test("home keyboard: tab reaches an entry-point CTA", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  let found = false;
  for (let i = 0; i < 50; i++) {
    const active = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    if (active.includes("Start with buttons")) {
      found = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(found).toBe(true);
});

test.describe("persona evidence screenshots", () => {
  test("capture desktop and mobile home", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
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
