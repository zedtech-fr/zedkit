import { expect, test, type Locator, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

/** One compact Project settings screen, restyled by look name. */
const IDENTITIES = [
  { id: "glass", name: "Glass" },
  { id: "mist", name: "Mist" },
  { id: "press", name: "Press" },
  { id: "maison", name: "Maison" },
] as const;

/** The examples arrive with a short entrance; checks that read colours or positions wait for it to be over. */
async function settle(looks: Locator) {
  await looks.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        const done = () => node.getAnimations({ subtree: true }).every((animation) => animation.effect?.getComputedTiming().iterations === Infinity);
        const tick = () => (done() ? resolve() : requestAnimationFrame(tick));
        tick();
      }),
  );
}

/** Opens the section at its top, so the first example (Glass) is on show. */
async function openLooks(page: Page, width = 1440, height = 900): Promise<{ looks: Locator; stage: Locator }> {
  await page.setViewportSize({ width, height });
  await page.goto("/", { waitUntil: "networkidle" });
  const looks = page.locator("[data-home-identity-looks]");
  await looks.evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
  await settle(looks);
  return { looks, stage: looks.locator("[data-home-identity-stage]") };
}

async function pick(looks: Locator, name: string) {
  await looks.getByRole("tab", { name, exact: true }).click();
  await settle(looks);
}

test("the section is a set of examples, not a count of identities", async ({ page }) => {
  await openLooks(page);
  const section = page.locator("#identities");
  const looks = page.locator("[data-home-identity-looks]");
  await expect(looks.getByRole("heading", { name: "Every screen, the same product.", level: 2 })).toBeVisible();
  await expect(section).not.toContainText(/\bsix\b/i);
  await expect(looks.getByRole("tab", { name: "Glass", exact: true })).toBeVisible();
  await expect(looks.locator("[data-palette-dots]")).toHaveCount(0);
});

test("tabs switch the look of the same screen without leaving the page", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  const pageIdentity = await page.locator("html").getAttribute("data-identity");
  await expect(looks.getByRole("tablist", { name: "Looks" })).toBeVisible();
  await expect(looks.getByRole("tab")).toHaveCount(4);
  await expect(stage).toHaveAttribute("data-identity", "glass");
  for (const identity of IDENTITIES) {
    await pick(looks, identity.name);
    await expect(stage).toHaveAttribute("data-identity", identity.id);
    await expect(looks.getByRole("tab", { name: identity.name, exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(looks.locator("[data-identity-caption]")).toContainText(`data-identity="${identity.id}"`);
    await expect(stage.getByRole("heading", { name: "Project settings", exact: true })).toBeVisible();
  }
  await pick(looks, "Mist");
  await looks.getByRole("tab", { name: "Mist", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(looks.getByRole("tab", { name: "Press", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
  expect(await page.locator("html").getAttribute("data-identity")).toBe(pageIdentity);
});

test("mobile looks does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    await expect(looks.getByRole("tablist")).toBeVisible();
    await expect(looks.locator("[data-slot='scroll-gallery']")).toHaveCount(0);
    const tablistLayout = await looks.getByRole("tablist").evaluate((el) => getComputedStyle(el).display);
    expect(tablistLayout).toBe("flex");
    const box = await looks.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px looks width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px looks right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});

for (const width of [320, 360, 390]) {
  test(`${width}px: every tab stays readable, and the chosen one is visible`, async ({ page }) => {
    const { looks } = await openLooks(page, width, 800);
    for (const identity of IDENTITIES) {
      const tab = looks.getByRole("tab", { name: identity.name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const fit = await tab.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const inside = (el: Element) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          return text.left >= rect.left - 0.5 && text.right <= rect.right + 0.5;
        };
        const label = node.querySelector("[data-tab-label]")!;
        return {
          inView: rect.left >= 0 && rect.right <= document.documentElement.clientWidth,
          textInside: [...node.querySelectorAll("span")].every((span) => !span.textContent || inside(span)),
          clipped: node.scrollWidth > node.clientWidth + 1,
          fontSize: Number.parseFloat(getComputedStyle(label).fontSize),
          minHeight: rect.height,
        };
      });
      expect(fit, `${width}px ${identity.name}`).toEqual({
        inView: true,
        textInside: true,
        clipped: false,
        fontSize: fit.fontSize,
        minHeight: fit.minHeight,
      });
      expect(fit.fontSize).toBeGreaterThanOrEqual(13);
      expect(fit.minHeight).toBeGreaterThanOrEqual(44);
    }
  });
}

for (const width of [320, 1280]) {
  test(`${width}px: every look shows the same compact Project settings screen`, async ({ page }) => {
    const { looks, stage } = await openLooks(page, width, 900);
    for (const identity of IDENTITIES) {
      await pick(looks, identity.name);
      await expect(stage.getByRole("heading", { name: "Project settings", exact: true })).toBeVisible();
      await expect(stage.getByRole("textbox", { name: "Workspace" })).toHaveValue("Harbor Console");
      await expect(stage.getByRole("combobox", { name: "Region" })).toContainText("Europe");
      await expect(stage.getByRole("button", { name: "Save changes" })).toBeVisible();
      await expect(stage.getByRole("button", { name: "Discard" })).toBeVisible();
      await expect(stage.getByText("Delete project")).toHaveCount(0);
      await expect(stage.getByText("Billing ends")).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${width}px ${identity.name}`).toBeLessThanOrEqual(1);
    }
  });
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1280]) {
    test(`${width}px ${theme}: every example passes the a11y gate`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
      const { looks } = await openLooks(page, width, 900);
      for (const identity of IDENTITIES) {
        await pick(looks, identity.name);
        await assertA11yGate(page, "[data-home-identity-looks]");
      }
    });
  }
}

test("Project settings keeps its promises: Discard restores, Save keeps", async ({ page }) => {
  const { stage } = await openLooks(page);
  const name = stage.getByRole("textbox", { name: "Workspace" });
  const status = stage.locator("[data-home-identity-status]");

  await name.fill("Harbor Staging");
  await expect(status).toHaveText("Unsaved changes.");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Console");
  await expect(status).toHaveText("Changes discarded.");

  await name.fill("Harbor Staging");
  await stage.getByRole("button", { name: "Save changes" }).click();
  await expect(status).toHaveText("Changes saved.");
  await name.fill("Something else");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Staging");
});
