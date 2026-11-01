import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("desktop hero pins three examples and keeps the lead in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const track = page.locator("[data-home-hero-scenes]");
  await expect(track).toHaveAttribute("data-scene-count", "3");
  await expect(track.locator("[data-scroll-scene]")).toHaveCount(3);
  await expect(page.locator("#demo").getByRole("button", { name: "Add app" })).toBeVisible();

  const lead = page.locator("[data-home-hero-lead]");
  const preview = page.locator("[data-home-hero-preview]");
  const before = await page.evaluate(() => {
    const leadBox = document.querySelector("[data-home-hero-lead]")?.getBoundingClientRect();
    const previewBox = document.querySelector("[data-home-hero-preview]")?.getBoundingClientRect();
    if (!leadBox || !previewBox) return null;
    return {
      leadTop: leadBox.top,
      previewTop: previewBox.top,
      previewBottom: previewBox.bottom,
      lastRowBottom: [...document.querySelectorAll("[data-home-hero-preview] [data-demo-row-actions]")]
        .at(-1)
        ?.getBoundingClientRect().bottom,
    };
  });
  expect(before).not.toBeNull();
  expect(before!.leadTop).toBeGreaterThan(140);
  expect(before!.leadTop).toBeLessThan(280);
  expect(Math.abs(before!.leadTop - before!.previewTop)).toBeLessThan(16);
  expect(before!.lastRowBottom).toBeTruthy();
  expect(before!.lastRowBottom!).toBeLessThanOrEqual(before!.previewBottom + 2);
  expect(before!.previewBottom - before!.lastRowBottom!).toBeLessThan(80);

  const add = page.locator("#demo").getByRole("button", { name: "Add app" });
  const heading = page.locator("#demo").getByRole("heading", { name: "Project apps" });
  const addBox = await add.boundingBox();
  const headingBox = await heading.boundingBox();
  expect(addBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(Math.abs(addBox!.y - headingBox!.y)).toBeLessThan(16);
  expect(addBox!.x).toBeGreaterThan(headingBox!.x + headingBox!.width);

  const widths = await page.evaluate(() => {
    const preview = document.querySelector("[data-home-hero-preview]")?.getBoundingClientRect();
    const visual = document
      .querySelector("[data-scroll-scene='admin'] [data-scroll-scene-visual]")
      ?.getBoundingClientRect();
    const demo = document.querySelector("[data-admin-dashboard-demo]")?.getBoundingClientRect();
    if (!preview || !visual || !demo) return null;
    return { preview: preview.width, visual: visual.width, demo: demo.width };
  });
  expect(widths).not.toBeNull();
  expect(widths!.visual).toBeGreaterThan(widths!.preview - 4);
  expect(widths!.demo).toBeGreaterThan(widths!.preview - 4);

  const trackBox = await track.boundingBox();
  expect(trackBox).not.toBeNull();
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 280);
      return page.evaluate(() => {
        const opacities = [
          ...document.querySelectorAll(
            "[data-home-hero-scenes] [data-scroll-scene]:not([data-scroll-scene='admin'])",
          ),
        ].map((el) => Number.parseFloat(getComputedStyle(el).opacity));
        return Math.max(0, ...opacities);
      });
    }, { timeout: 8_000 })
    .toBeGreaterThan(0.4);

  const after = await page.evaluate(() => {
    const lead = document.querySelector("[data-home-hero-lead]")?.getBoundingClientRect();
    return { leadTop: lead?.top ?? -1 };
  });
  expect(after.leadTop).toBeGreaterThan(0);
  await expect(lead).toBeVisible();
  await expect(preview).toBeVisible();
});

test("phone hero keeps a single example under the headline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const extra = page.locator("[data-home-hero-scenes] [data-scroll-scene]:not([data-scroll-scene='admin'])");
  await expect(extra).toHaveCount(2);
  for (const scene of await extra.all()) {
    await expect(scene).toBeHidden();
  }
  await expect(page.locator("#demo").getByRole("button", { name: "Add app" })).toBeVisible();
});
