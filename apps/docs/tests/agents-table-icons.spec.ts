import { expect, test } from "@playwright/test";

import { assertAxeOnMain, assertNoHorizontalOverflow } from "./site-audit-helpers";

const PAGE =
  "http://127.0.0.1:3100/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo";

test.describe("agents table icons (#428)", () => {
  test("each agent row shows a decorative icon without horizontal overflow", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Agents", level: 2 })).toBeVisible();

    const agentsTable = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Agent" }) });
    await expect(agentsTable).toBeVisible();
    const icons = agentsTable.locator("svg[aria-hidden='true']");
    await expect(icons).toHaveCount(18);

    for (const width of [360, 390] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(PAGE, { waitUntil: "networkidle" });
      const scrollOk = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(scrollOk).toBe(true);
    }

    await assertNoHorizontalOverflow(page);
    await assertAxeOnMain(page);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(agentsTable.locator("svg[aria-hidden='true']")).toHaveCount(18);
  });
});
