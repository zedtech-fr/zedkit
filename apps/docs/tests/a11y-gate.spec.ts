import { expect, test } from "@playwright/test";
import { assertA11yGate, readComputedContrast } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100";

const A11Y_ROUTES = [
  { path: "/", label: "home" },
  { path: "/docs", label: "docs-index" },
  { path: "/docs/getting-started", label: "getting-started" },
  { path: "/docs/ui/indicate-status-with-a-dot", label: "component-alpha" },
  { path: "/docs/set-up-your-coding-agents", label: "tutorial-agents" },
  {
    path: "/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo",
    label: "ai-guide",
  },
  { path: "/docs/ui/pick-one-option-from-a-dropdown", label: "component-select" },
  { path: "/docs/ui/call-out-a-notice-or-an-error-state", label: "component-alert" },
  { path: "/docs/maturity-and-compatibility", label: "maturity-table" },
] as const;

const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 1280, height: 900, name: "desktop" },
] as const;

async function openWithTheme(
  page: import("@playwright/test").Page,
  path: string,
  theme: "light" | "dark",
) {
  await page.addInitScript((mode) => {
    localStorage.setItem("theme", mode);
  }, theme);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.evaluate((mode) => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode;
  }, theme);
  if (theme === "light") {
    await page.waitForFunction(() => {
      const muted = getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground");
      return muted.includes("32%");
    });
  }
}

test.describe("a11y gate (#396)", () => {
  for (const route of A11Y_ROUTES) {
    for (const viewport of VIEWPORTS) {
      for (const theme of ["light", "dark"] as const) {
        // Preview islands opt into their own dark scope (#394); axe dark runs on prose routes only.
        if (theme === "dark" && route.label.startsWith("component-")) continue;
        test(`${route.label} ${viewport.name} ${theme}: axe gate rules`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await openWithTheme(page, route.path, theme);
          await assertA11yGate(page);
        });
      }
    }
  }

  const maturitySamples: { path: string; name: string }[] = [
    { path: "/docs/ui/indicate-status-with-a-dot", name: "alpha" },
    { path: "/catalog", name: "beta" },
  ];

  for (const theme of ["light", "dark"] as const) {
    for (const sample of maturitySamples) {
      test(`maturity ${sample.name} badge ${theme}: contrast >= 4.5:1`, async ({ page }) => {
        await openWithTheme(page, sample.path, theme);
        const badge =
          sample.name === "alpha"
            ? page.getByRole("link", { name: sample.name, exact: true })
            : page.getByText(sample.name, { exact: true }).first();
        const ratio = await readComputedContrast(page, badge);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
