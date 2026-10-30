import { expect, test, type Page } from "@playwright/test";

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

test.describe("identity editor page", () => {
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
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.28rem$/);
    await expect(page.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toBeNull();
  });

  test("Apply Press replaces the site look in light and dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
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

  test("header Identity control clears Custom after Apply to the whole site", async ({ page }) => {
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
    await expect(page.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-custom"))).toBeNull();
  });

  test("header Identity control clears Custom in dark mode", async ({ page }) => {
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
    await expect(page.getByRole("button", { name: "Reset to default" })).toHaveCount(0);
  });
});

