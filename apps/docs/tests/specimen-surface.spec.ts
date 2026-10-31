import { expect, test } from "@playwright/test";

/*
 * D5 specimen: docs component previews use a single hairline frame and no
 * drop shadow. Relative paths: the config baseURL decides the port.
 */
test("component preview specimen has no drop shadow and a hairline frame", async ({ page }) => {
  await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
  const specimen = page.locator("[data-component-preview]").first().locator(":scope > *").last();
  await expect(specimen).toBeVisible();
  const style = await specimen.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      boxShadow: computed.boxShadow,
      borderTopWidth: computed.borderTopWidth,
      backgroundColor: computed.backgroundColor,
    };
  });
  expect(style.boxShadow).toBe("none");
  expect(style.borderTopWidth).toBe("1px");
  expect(style.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
});
