import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { assertA11yGate } from "./a11y-helpers";

const PAGE = "/docs/ui/design-your-identity";

async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

async function spacingOnHtml(page: Page) {
  return page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--spacing").trim());
}

async function htmlVar(page: Page, name: string) {
  return page.locator("html").evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), name);
}

async function sidebarBg(page: Page) {
  return page.locator("#nd-sidebar").evaluate((node) => getComputedStyle(node).backgroundColor);
}

test.describe("identity editor page", () => {
  test("lede and meta description lead with the benefit, untruncated (#1074)", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBe(
      "Design your own look — colour, radius, spacing, type — on a live card, then apply it to the whole site. Install with npm or copy published registry bricks.",
    );
    await expect(
      page.getByRole("paragraph").filter({ hasText: "Design your own look — colour, radius, spacing, type" }),
    ).toBeVisible();
  });

  test("writes spacing onto the draft card and into the URL", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Design your identity" })).toBeVisible();
    await expect(page.getByText("Change spacing first, then watch the card.", { exact: true })).toBeVisible();
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    expect(page.url()).toContain("spacing=0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    expect(new URL(page.url()).searchParams.has("spacing")).toBe(false);
  });

  test("keeps the chosen look in the URL and restores it on load", async ({ page }) => {
    await page.goto(`${PAGE}?identity=press`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Look")).toHaveValue("press");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.2rem");
  });

  test("shipped looks open with no contrast chips", async ({ page }) => {
    for (const id of ["mist", "press", "tide", "volt", "maison", "glass"] as const) {
      await page.goto(`${PAGE}?identity=${id}`, { waitUntil: "networkidle" });
      await expect(page.getByLabel("Look")).toHaveValue(id);
      await expect(page.getByRole("button", { name: /^Fix / })).toHaveCount(0);
    }
  });

  test("warns when light text matches the background and Fix restores it", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Foreground").fill("0 0% 100%");
    const chip = page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/);
    await expect(chip).toBeVisible();
    await page.getByRole("button", { name: "Fix light text" }).click();
    await expect(chip).toHaveCount(0);
  });

  test("warns when light accent misses 3:1 against the background", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Accent").fill("0 0% 100%");
    const chip = page.getByText(/light accent \d+(\.\d+)?:1 \(need 3:1\)/);
    await expect(chip).toBeVisible();
    await page.getByRole("button", { name: "Fix light accent" }).click();
    await expect(chip).toHaveCount(0);
  });

  test("keeps the dark preview in the URL", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    expect(page.url()).toContain("theme=dark");
    await expect
      .poll(() =>
        page.locator('[data-slot="identity-editor-preview"]').evaluate((node) => node.classList.contains("dark")),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "false");
    await page.goto(`${PAGE}?theme=dark`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("Suggest applies a service patch after Apply", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { current: Record<string, unknown> };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { tokens: { ...posted.current, spacing: "0.5rem" } },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("more space");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Review these token changes.")).toBeVisible();
    await expect(page.getByText("Contrast check passed (text 4.5:1, accent and border 3:1).")).toBeVisible();
    await expect(page.getByText("spacing: 0.25rem → 0.5rem")).toBeVisible();
    await expect(page.locator('[data-slot="identity-editor-swatch"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.5rem");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.5rem");
  });

  test("Suggest shows a status while the service is in flight", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const posted = route.request().postDataJSON() as { current: Record<string, unknown> };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { tokens: { ...posted.current, spacing: "0.5rem" } },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("more space");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Suggesting…", { exact: true })).toBeVisible();
    await expect(page.getByText("Review these token changes.")).toBeVisible();
    await expect(page.getByText("Suggesting…", { exact: true })).toHaveCount(0);
  });

  test("Suggest Apply keeps a dark colour on the whole site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as {
        current: { light: Record<string, string>; dark: Record<string, string> };
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          tokens: {
            ...posted.current,
            light: { ...posted.current.light, background: "0 0% 95%" },
            dark: { ...posted.current.dark, background: "120 40% 20%" },
          },
        },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("dark forest");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("dark.background:")).toBeVisible();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("Suggest preview warns when the proposal misses AA", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { current: { light: Record<string, string> } };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          tokens: {
            ...posted.current,
            light: { ...posted.current.light, foreground: posted.current.light.background },
          },
        },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("pale text");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Fix light text" })).toHaveCount(0);
  });

  test("Suggest colour diffs show a swatch", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { current: { light: Record<string, string> } };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          tokens: {
            ...posted.current,
            light: { ...posted.current.light, primary: "0 80% 45%" },
          },
        },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("red button");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("light.primary: 240 5.9% 10% → 0 80% 45%")).toBeVisible();
    await expect(page.locator('[data-slot="identity-editor-swatch"] rect')).toHaveAttribute(
      "fill",
      "hsl(0 80% 45%)",
    );
  });

  test("Suggest falls back to a keyword match when the origin is rate-limited", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      await route.fulfill({ status: 429, contentType: "application/json", json: { error: "rate" } });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("editorial serif ink");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Too many requests. Keyword match instead.")).toBeVisible();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.2rem");
  });

  test("Suggest falls back to a keyword match when the service is off", async ({ page }) => {
    await page.route("**/api/identity/suggest", async (route) => {
      await route.fulfill({ status: 503, contentType: "application/json", json: { disabled: true } });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Request").fill("editorial serif ink");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("Suggest is offline. Keyword match instead.")).toBeVisible();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.2rem");
  });

  test("passes the a11y gate on the panel", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await assertA11yGate(page, "[data-slot=identity-editor]");
  });
});

test.describe("identity editor on a phone", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("keeps Apply on screen at 360px", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.locator('[data-slot="identity-editor"]').screenshot({ path: "test-results/identity-editor-360.png" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const apply = page.getByRole("button", { name: "Apply to the whole site" });
    await apply.scrollIntoViewIfNeeded();
    const box = await apply.boundingBox();
    expect(box).toBeTruthy();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(361);
    const look = await page.getByLabel("Look").boundingBox();
    expect(look?.width ?? 0).toBeGreaterThan(80);
  });

  test("Press Apply stays on screen at 360px", async ({ page }) => {
    await page.goto(`${PAGE}?identity=press`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await page.locator('[data-slot="identity-editor"]').screenshot({ path: "test-results/identity-editor-press-360.png" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const apply = page.getByRole("button", { name: "Apply to the whole site" });
    await apply.scrollIntoViewIfNeeded();
    const box = await apply.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(361);
  });

  test("Apply then Dark keeps a custom look on the site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await page.getByLabel("Background").fill("120 40% 20%");
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });
});

test.describe("identity editor apply to site", () => {
  test("paints sidebar and page on Apply, with before/after site captures", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { current: Record<string, unknown> };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          tokens: {
            ...posted.current,
            light: {
              background: "0 80% 70%",
              foreground: "0 0% 10%",
              primary: "0 0% 10%",
              accent: "0 70% 40%",
              border: "0 40% 40%",
            },
          },
        },
      });
    });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    const beforeSidebar = await sidebarBg(page);
    const beforeBackground = await htmlVar(page, "--background");
    await page.screenshot({ path: "test-results/identity-editor-site-before.png", fullPage: true });
    await page.getByLabel("Request").fill("warm ivory boutique");
    await page.getByRole("button", { name: "Suggest" }).click();
    await expect(page.getByText("light.background:")).toBeVisible();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect.poll(() => htmlVar(page, "--background")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
    await expect.poll(() => sidebarBg(page)).not.toBe(beforeSidebar);
    expect(beforeBackground).not.toBe("0 80% 70%");
    await page.screenshot({ path: "test-results/identity-editor-site-after.png", fullPage: true });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => sidebarBg(page)).not.toBe(beforeSidebar);
    await page.screenshot({ path: "test-results/identity-editor-site-after-docs.png", fullPage: true });
  });

  test("toolbar Apply paints sidebar from Background", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
  });

  test("applies the draft to the whole site without a reload", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await expect(page.getByRole("combobox", { name: "Identity" }).first()).toHaveValue("mist");
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });

  test("keeps the site in step with later draft edits", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const before = await spacingOnHtml(page);
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    await expect.poll(() => spacingOnHtml(page)).toBe(before);
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await page.getByLabel("Spacing", { exact: true }).fill("0.5rem");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.5rem");
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
  });

  test("keeps the custom identity after navigation", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await expect(page.getByRole("combobox", { name: "Identity" }).first()).toHaveValue("mist");
  });

  test("resets to the default identity and clears storage", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.225rem$/);
    await expect(page.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toBeNull();
  });

  test("a header preset switch parks applied custom work instead of wiping it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=mist`, { waitUntil: "networkidle" });
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
    const parked = await page.evaluate(() => localStorage.getItem("zk-identity-custom"));
    expect(parked).toContain("2rem");

    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await chooser.selectOption("tide");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toBe(parked);

    await chooser.selectOption("mist");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
  });

  test("editor follows a header switch when clean or driving the site", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=mist`, { waitUntil: "networkidle" });
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();

    // Clean draft: the editor adopts the header's look and the URL follows.
    await chooser.selectOption("tide");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    await expect(page.getByLabel("Look")).toHaveValue("tide");
    expect(new URL(page.url()).searchParams.get("identity")).toBe("tide");

    // Applied draft: fields and URL resync to the header's new look.
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
    await expect(page.getByText("Applied to the whole site.")).toBeVisible();
    await chooser.selectOption("mist");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect(page.getByLabel("Look")).toHaveValue("mist");
    await expect(page.getByLabel("Radius", { exact: true })).not.toHaveValue("2rem");
    expect(new URL(page.url()).searchParams.get("identity")).toBe("mist");
    expect(new URL(page.url()).searchParams.get("radius")).toBeNull();

    // Detached: further edits no longer drive the site.
    await expect(page.getByText("Applied to the whole site.")).toHaveCount(0);
    await page.getByLabel("Radius", { exact: true }).fill("3rem");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).not.toBe("3rem");
  });

  test("editor keeps an unapplied draft when the header switches", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=tide`, { waitUntil: "networkidle" });
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("combobox", { name: "Identity" }).first().selectOption("press");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect(page.getByLabel("Look")).toHaveValue("tide");
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("2rem");
    expect(page.url()).toContain("identity=tide");
    expect(page.url()).toContain("radius=2rem");
  });

  test("Apply Press replaces the site look in light and dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
    await page.getByLabel("Look").selectOption("press");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect
      .poll(() => page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--radius").trim()))
      .toBe("0px");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("0 0% 6%");
    await page.getByLabel("Background").fill("120 40% 20%");
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("an old URL without darkKept still keeps a dark override", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${PAGE}?identity=mist&dark-background=${encodeURIComponent("120 40% 20%")}`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a URL-loaded dark colour stays kept after a light edit", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await expect.poll(() => new URL(page.url()).searchParams.get("darkKept")).toBe("background");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 0% 90%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a manual dark colour survives a later light edit", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a light colour edit writes an AA dark pair onto the site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.getByRole("button", { name: /^Fix dark / })).toHaveCount(0);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toMatch(/^0 0% 5(\.0)?%$/);
  });

  test("applies dark tokens while the site is dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() =>
      page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
    ).toBe("120 40% 20%");
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });

  test("header Identity control parks Custom after Apply to the whole site; Reset discards it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await expect(chooser).toHaveValue("mist");
    await chooser.selectOption("press");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.2rem$/);
    await expect(chooser).toHaveValue("press");
    expect(await chooser.locator("option").evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))).not.toContain(
      "custom",
    );
    // Parked, not wiped: the applied work is still stored and the explicit
    // reset remains the way to drop it.
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toContain("0.4rem");
    await page.getByRole("button", { name: "Reset to default" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toBeNull();
    await expect(page.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
  });

  test("header Identity control parks Custom in dark mode", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await expect(chooser).toHaveValue("mist");
    await chooser.selectOption("tide");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.28rem$/);
    await expect(chooser).toHaveValue("tide");
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toContain("0.4rem");
  });
});

test.describe("identity editor named looks", () => {
  test("saves, lists, applies, renames and deletes a named look", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByLabel("Name").fill("Coral");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByLabel("Look")).toHaveValue("n-coral");
    const header = page.getByRole("combobox", { name: "Identity" }).first();
    await expect(header.locator("option[value='n-coral']")).toHaveText("Coral");
    await header.selectOption("n-coral");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
    await page.getByLabel("Name").fill("Sunset");
    await page.getByRole("button", { name: "Rename" }).click();
    await expect(header.locator("option[value='n-coral']")).toHaveText("Sunset");
    await expect(header).toHaveValue("n-coral");
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByLabel("Look")).toHaveValue("mist");
    await expect(header.locator("option[value='n-coral']")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
  });

  test("keeps a named look after reload", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByLabel("Name").fill("Coral");
    await page.getByRole("button", { name: "Save look" }).click();
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect(page.getByRole("combobox", { name: "Identity" }).first()).toHaveValue("n-coral");
    await expect(page.getByLabel("Look")).toHaveValue("n-coral");
  });
});

