import { expect, test } from "@playwright/test";

test("the featured plan keeps its tinted wash", async ({ page }) => {
  await page.goto("/docs/ui/compose-a-public-marketing-page");
  const plan = page.locator(".surface-tint").filter({ hasText: "Most popular" });
  await expect(plan).toBeVisible();
  const wash = await plan.evaluate((node) => {
    const probe = document.createElement("div");
    probe.style.backgroundImage =
      "linear-gradient(to right bottom, color-mix(in oklab, hsl(var(--accent)) 15%, transparent) 0%, transparent 50%, color-mix(in oklab, hsl(var(--primary)) 10%, transparent) 100%)";
    node.append(probe);
    const expected = getComputedStyle(probe).backgroundImage;
    const image = getComputedStyle(node).backgroundImage;
    probe.remove();
    return { image, expected, numeric: /(?:from|to)-[a-z-]+\/\d/.test(node.className) };
  });
  expect(wash.image).toBe(wash.expected);
  expect(wash.numeric).toBe(false);
});
