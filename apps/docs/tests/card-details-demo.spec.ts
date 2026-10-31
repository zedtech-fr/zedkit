import { expect, test } from "@playwright/test";

const CARD_URL = "http://127.0.0.1:3100/docs/ui/group-content-in-a-card-section";
const DETAILS_URL = "http://127.0.0.1:3100/docs/ui/show-key-value-details-and-a-live-indicator";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test.describe("card and details pages show a live preview for each example", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await page.addInitScript(
            ([i, m]) => {
              localStorage.setItem("zk-docs-site-identity", i!);
              localStorage.setItem("zk-docs-site-identity-opt-in", "1");
              localStorage.setItem("theme", m!);
            },
            [identity, mode],
          );

          await page.goto(CARD_URL, { waitUntil: "networkidle" });
          const cards = page.locator("[data-component-preview]");
          await expect(cards).toHaveCount(2);
          await cards.nth(0).scrollIntoViewIfNeeded();
          await expect(cards.nth(0).getByText("Order #1042")).toBeVisible();
          await expect(cards.nth(0).getByText("Total €101.50")).toBeVisible();
          await cards.nth(1).scrollIntoViewIfNeeded();
          await expect(cards.nth(1).getByText("Spring collection")).toBeVisible();
          await expect(cards.nth(1).getByRole("button", { name: "Publish" })).toBeVisible();
          await expect(cards.nth(1).getByRole("button", { name: "Save as draft" })).toBeVisible();
          let sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await cards.nth(0).screenshot({ path: `test-results/cd-card-${identity}-${mode}-${device}.png` });
          await cards.nth(1).screenshot({ path: `test-results/cd-footer-${identity}-${mode}-${device}.png` });

          await page.goto(DETAILS_URL, { waitUntil: "networkidle" });
          const details = page.locator("[data-component-preview]");
          await expect(details).toHaveCount(2);
          await details.nth(0).scrollIntoViewIfNeeded();
          await expect(details.nth(0).getByText("Delivery D-2047")).toBeVisible();
          await expect(details.nth(0).getByText("In transit")).toBeVisible();
          await expect(details.nth(0).getByRole("status", { name: "Tracking live" })).toBeVisible();
          await expect(details.nth(0).getByRole("status", { name: "Idle" })).toBeVisible();
          await details.nth(1).scrollIntoViewIfNeeded();
          await expect(details.nth(1).getByText("Camille Rousseau")).toBeVisible();
          await expect(details.nth(1).getByRole("button", { name: "Copy cus_4821" })).toBeVisible();
          sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await details.nth(0).screenshot({ path: `test-results/cd-details-${identity}-${mode}-${device}.png` });
          await details.nth(1).screenshot({ path: `test-results/cd-composed-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }
});
