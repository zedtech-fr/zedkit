import { expect, test } from "@playwright/test";
import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { openHeroPage } from "./hero-helpers";

test("home explains the product and four entry areas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-home-hero-category]")).toHaveText("zedkit · open source, MIT");
  await expect(
    page.getByRole("heading", {
      name: "Code that's checked. Screens that match.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "More in the kit" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with buttons" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with the Nest bootstrap" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open SEO docs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open agent setup docs" })).toBeVisible();
  await expect(page.locator("#entry-points [data-home-secondary-links] svg[aria-hidden='true']")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("home visitor copy carries no repo internals or literal backticks (#1090)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const leak of ["`", "catalog.json", "packages/ui/tests", "generated index", "generated doc page", "manifest-driven"]) {
    expect(text, `home copy must not contain ${JSON.stringify(leak)}`).not.toContain(leak);
  }
});

test("home hero offers Setup first with get started, catalog, and a discreet issues link (#111, #117)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const heroActions = page.locator("[data-home-hero-actions] a");
  await expect(heroActions).toHaveCount(4);
  await expect(heroActions.nth(0)).toHaveText("Setup");
  await expect(heroActions.nth(0)).toHaveAttribute("href", "#ai-setup");
  await expect(heroActions.nth(0)).toHaveAttribute("data-site-action");
  await expect(heroActions.nth(1)).toHaveText("Get started");
  await expect(heroActions.nth(1)).toHaveAttribute("href", "#get-started");
  await expect(heroActions.nth(1)).toHaveAttribute("data-site-action");
  await expect(heroActions.nth(2)).toHaveText("Browse catalog");
  await expect(heroActions.nth(2)).toHaveAttribute("href", "/catalog");
  await expect(heroActions.nth(2)).not.toHaveAttribute("data-site-action");
  for (const index of [0, 1, 2]) {
    await expect(heroActions.nth(index)).not.toHaveAttribute("target");
    await expect(heroActions.nth(index)).not.toHaveAttribute("rel");
  }
  const issues = heroActions.nth(3);
  await expect(issues).toHaveAttribute("target", "_blank");
  await expect(issues).toHaveAttribute("rel", "noopener noreferrer");
  await expect(issues).toHaveAccessibleName(/opens in a new tab/i);
  await expect(issues).toContainText("See a real issue, end to end");
  const issuesHref = await issues.getAttribute("href");
  expect(issuesHref).toMatch(/^\/issues(?:\/|$)/);
  expect(issuesHref).not.toBe("/issues/0");
  await expect(issues).not.toHaveAttribute("data-site-action");

  await expect(page.locator("[data-home-hero-sub]")).toHaveText(
    "Paste one prompt in the agent you already use. It reads the repo and writes the setup.",
  );
  await expect(page.getByRole("textbox", { name: "Setup prompt" })).toBeVisible();
  await expect(page.locator("[data-home-hero-prompt]")).toHaveCount(1);
  await expect(page.getByText("Name the kits you want, Nest included. The map knows the order.")).toBeVisible();
  await expect(page.locator("[data-home-hero-lead]").getByRole("tablist")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  // Category cue (label role) sits above the display H1 inside the lead stack (#1441).
  await expect(page.locator("[data-home-hero-lead] [data-home-hero-category]")).toHaveText("zedkit · open source, MIT");
  await expect(
    page.locator("[data-home-hero-lead]").getByRole("heading", {
      name: "Code that's checked. Screens that match.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText(/theme everything with one of six identities/)).toHaveCount(0);
  await expect(page.getByText(/linked maturity badges/)).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead]").getByText(/Latest in v/)).toHaveCount(0);
  await expect(page.locator("[data-home-hero-lead] [data-install-command]")).toHaveCount(0);
});

test("home hero shows proof line without a separate proofs band (#1057)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByText("What you see installs from npm or copies as source · MIT · React 19 · Tailwind 4"),
  ).toBeVisible();
  await expect(page.getByText(/^Latest in v/)).toHaveCount(0);
  await expect(page.locator("#proofs")).toHaveCount(0);
});

test("home hero proof follows site mode and can override dark (#1072)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const proof = page.locator("[data-home-hero-proof]");
  const scope = proof.locator("[data-identity-scope]");
  const shellIdentity = await page.locator("html").getAttribute("data-identity");
  await expect(scope).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  // The scope repaints after the shell class flips (colour transition, slower under load), so poll the same bar.
  const brightest = () =>
    scope.evaluate((el) => Math.max(...getComputedStyle(el).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number)));
  await expect.poll(brightest).toBeLessThan(70);

  await proof.getByRole("combobox", { name: "Identity for this demo" }).click();
  await page.getByRole("option", { name: "Tide" }).click();
  await expect(scope).toHaveAttribute("data-identity", "tide");
  await proof.getByRole("combobox", { name: "Color mode for this demo" }).click();
  await page.getByRole("option", { name: "Light" }).click();
  await expect.poll(brightest).toBeGreaterThan(200);

  await proof.getByRole("combobox", { name: "Color mode for this demo" }).click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect.poll(brightest).toBeLessThan(70);
  expect(await page.locator("html").getAttribute("data-identity")).toBe(shellIdentity);
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
});

test("home hero embeds the interactive admin demo above the fold on desktop (#1111 L1b)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo.getByRole("button", { name: "Add app" })).toBeVisible();
  const box = await demo.getByRole("button", { name: "Add app" }).boundingBox();
  expect(box).toBeTruthy();
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);
});

test("home hero specimen follows the headline within the mobile demo budget (#1111 L1b)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const root = document.querySelector("#home-page");
    const demoEl = document.querySelector("#demo");
    if (!root || !demoEl) return null;
    const rootTop = root.getBoundingClientRect().top + window.scrollY;
    const demoTop = demoEl.getBoundingClientRect().top + window.scrollY;
    return demoTop - rootTop;
  });
  expect(metrics).not.toBeNull();
  expect(metrics!).toBeLessThanOrEqual(760);
});

test("home 'More in the kit' links are tappable on a phone and sit beside their description on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const links = page.locator("#entry-points [data-home-secondary-links] a");
  await expect(links).toHaveCount(4);
  for (const box of await Promise.all((await links.all()).map((link) => link.boundingBox()))) {
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const row = page.locator("#entry-points [data-home-secondary-links] > div").first();
  const [text, link] = await Promise.all([row.locator("> div").boundingBox(), row.locator("a").boundingBox()]);
  expect(link!.x).toBeGreaterThan(text!.x + text!.width);
  expect(Math.abs(link!.y - text!.y)).toBeLessThan(40);
  const borders = await page.locator("#entry-points [data-home-secondary-links] > [data-index-lead]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      border: getComputedStyle(node).borderBottomWidth,
      pad: getComputedStyle(node).paddingBottom,
    })),
  );
  expect(borders).toHaveLength(4);
  expect(borders.at(-1)?.border).toBe("0px");
  const line = await page.locator("#entry-points [data-home-secondary-links] > [data-index-lead]").first().evaluate((node) => {
    const probe = document.createElement("div");
    probe.className = "border-border/60";
    probe.style.borderBottomStyle = "solid";
    probe.style.borderBottomWidth = "1px";
    document.body.append(probe);
    const expected = getComputedStyle(probe).borderBottomColor;
    probe.remove();
    return { color: getComputedStyle(node).borderBottomColor, expected, numeric: node.className.includes("border-border/") };
  });
  expect(line.color).toBe(line.expected);
  expect(line.numeric).toBe(false);
  expect(borders.slice(0, -1).every((entry) => entry.border !== "0px")).toBe(true);
  expect(borders.every((entry) => entry.pad !== "0px")).toBe(true);
});

test("home area cards keep a decorative icon at tablet width and up", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#entry-points");
  await expect(section.getByText("Build a UI", { exact: true })).toBeVisible();
  await expect(section.locator("[data-home-secondary-links] svg[aria-hidden='true']")).toHaveCount(4);
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("entry point CTAs open catalog or guide pages (not folder 404s)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const entry = page.getByRole("link", { name: "Start with buttons" });
  await entry.click();
  await page.waitForURL("**/docs/ui/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home gallery shows no maturity badges", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#components a[data-badge-link]")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home component families list quiet example links on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#components");
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole("heading", { name: "Find a component" })).toBeVisible();
  const families = section.locator("[data-home-component-families] [data-family-title]");
  expect(await families.count()).toBeGreaterThanOrEqual(4);
  await expect(section.locator("[data-home-gallery-card]")).toHaveCount(0);
  await expect(section.locator("a").filter({ hasText: "Button" }).first()).toBeVisible();
});

test("home component families layout stays sane on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#components");
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator("[data-home-component-families] [data-family-title]").first()).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
  await section.screenshot({ path: "test-results/home-gallery-390.png" });
});

test.describe("home component families light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const section = page.locator("#components");
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByRole("link", { name: /Browse all UI in the catalog/ })).toBeVisible();
      await section.screenshot({ path: `test-results/home-maturity-gallery-${mode}.png` });
    });
  }
});

test("home entry-point links keep a decorative icon at tablet width and up", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const entry = page.locator("#entry-points");
  await expect(entry.getByRole("link", { name: "Start with buttons" }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("home entry-point links light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto("/", { waitUntil: "networkidle" });
      const entry = page.locator("#entry-points");
      await entry.scrollIntoViewIfNeeded();
      await expect(entry.getByRole("link", { name: "Start with buttons" })).toBeVisible();
      await entry.screenshot({ path: `test-results/home-scenario-titles-${mode}.png` });
    });
  }
});

test("home docs CTAs keep a decorative icon on phone (paste band)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#paste [data-home-full-steps] svg[aria-hidden='true']")).toHaveCount(1);
  await expect(page.locator("#ai-setup [data-docs-ctas]")).toHaveCount(0);
  await expect(page.locator("#proofs")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("home docs CTAs keep a decorative icon on tablet (catalog bands)", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const entry = page.locator("#entry-points");
  await expect(entry.getByRole("link", { name: "Start with buttons" }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => (document.querySelector("#home-page")?.scrollWidth ?? 0) <= document.documentElement.clientWidth + 1,
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
      await page.goto("/", { waitUntil: "networkidle" });
      const entry = page.locator("#entry-points");
      await entry.scrollIntoViewIfNeeded();
      await expect(entry.getByRole("link", { name: "Start with buttons" })).toBeVisible();
      await entry.screenshot({ path: `test-results/home-cta-entry-${mode}.png` });
      const paste = page.locator("#paste").getByRole("link", { name: "Full install steps" });
      await paste.scrollIntoViewIfNeeded();
      await expect(paste).toBeVisible();
      await paste.screenshot({ path: `test-results/home-cta-scenarios-${mode}.png` });
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
      await page.goto("/", { waitUntil: "networkidle" });
      const paste = page.locator("#paste").getByRole("link", { name: "Full install steps" });
      await paste.scrollIntoViewIfNeeded();
      await expect(paste).toBeVisible();
      await paste.screenshot({ path: `test-results/home-section-cta-install-${mode}.png` });
      await paste.screenshot({ path: `test-results/home-section-cta-ai-${mode}.png` });
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
      await page.goto("/", { waitUntil: "networkidle" });
      const hero = page.locator("[data-home-hero-actions]").getByRole("link", { name: "Get started" });
      await hero.scrollIntoViewIfNeeded();
      await expect(hero).toBeVisible();
      await hero.screenshot({ path: `test-results/home-hero-docs-cta-${mode}.png` });
      const catalog = page.getByRole("link", { name: "Browse catalog" }).first();
      await catalog.scrollIntoViewIfNeeded();
      await expect(catalog).toBeVisible();
      await catalog.screenshot({ path: `test-results/home-proofs-theme-cta-${mode}.png` });
    });
  }
});

test("home entry-point links have unique accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const entry = page.locator("#entry-points");
  await expect(entry.getByRole("link", { name: "Start with buttons" })).toBeVisible();
  await expect(entry.getByRole("link", { name: "Open agent setup docs" })).toBeVisible();
  const scenarioLink = entry.getByRole("link", { name: "Start with buttons" });
  await scenarioLink.click();
  await page.waitForURL("**/docs/ui/**", { timeout: 10000 });
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
  await expect(page.locator("#get-started").getByRole("link", { name: "Full install steps" })).toHaveAttribute(
    "href",
    "/docs/getting-started#install-or-copy",
  );
});

test("home has no registry brick grid; catalog link lives in families", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`#paste`, { waitUntil: "networkidle" });
  await expect(page.locator("#install-or-copy")).toHaveCount(0);
  await expect(page.locator("[data-registry-bricks]")).toHaveCount(0);
  const catalog = page.getByRole("link", { name: /Browse all UI in the catalog/ });
  await catalog.scrollIntoViewIfNeeded();
  await expect(catalog).toHaveAttribute("href", "/catalog?area=ui");
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

test("home keyboard: tab reaches an entry-point CTA", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
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

test("home component families link only to live docs pages, and Overlays keeps its promise", async ({ page, request }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("#components");
  const overlays = section.locator("[data-home-component-families] > div > div").filter({ hasText: "Overlays" });
  const names = await overlays.locator("a").allTextContents();
  for (const expected of ["Dialog", "Drawer", "Popover", "Dropdown menu", "Tooltip"]) {
    expect(names).toContain(expected);
  }
  await expect(overlays.locator("[data-family-title]")).toHaveText("Overlays");
  await expect(overlays.locator("[data-family-title] a")).toHaveCount(0);
  const hrefs = await section.locator("[data-home-component-families] > div a").evaluateAll((links) => [
    ...new Set(links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? "")),
  ]);
  for (const href of hrefs) {
    expect(href.startsWith("/docs/"), href).toBe(true);
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
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
