import { expect, test } from "@playwright/test";
import {
  assertAxeOnMain,
  assertInternalLinksResolve,
  assertKeyboardReachesFirstMainCta,
  assertNoHorizontalOverflow,
  assertNoNestedInteractive,
  assertUniqueLinkNames,
} from "./site-audit-helpers";
import { REGISTRY_SMOKE_URLS, SITE_AUDIT_ROUTES } from "./site-routes";

const BASE = "http://127.0.0.1:3100";

test.describe("site semantics harness (#300)", () => {
  for (const route of SITE_AUDIT_ROUTES) {
    test(`${route.label}: mobile width, axe on main, links resolve`, async ({ page }) => {
      if (route.pendingPath) {
        const probe = await page.request.get(`${BASE}${route.path}`);
        if (probe.status() === 404) {
          test.skip(true, `path not published yet (${route.path})`);
        }
      }
      const errors: string[] = [];
      page.on("pageerror", (event) => errors.push(String(event)));
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
      if (!route.skipMobileOverflow) {
        await assertNoHorizontalOverflow(page);
      }
      if (route.strictSemantics) {
        await assertAxeOnMain(page);
      }
      await assertInternalLinksResolve(page, BASE);
      expect(errors).toEqual([]);
    });

    if (route.strictSemantics) {
      test(`${route.label}: no nested interactive, unique link names`, async ({ page }) => {
        if (route.pendingPath) {
          const probe = await page.request.get(`${BASE}${route.path}`);
          if (probe.status() === 404) test.skip(true, `path not published yet (${route.path})`);
        }
        await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle" });
        await assertNoNestedInteractive(page);
        await assertUniqueLinkNames(page);
      });
    }
  }

  test("home: keyboard reaches first main CTA", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await assertKeyboardReachesFirstMainCta(page);
  });

  test("home: axe on layout (after #286/#287)", async ({ page }) => {
    test.skip(true, "Enable when home demo and hero land (#286, #287).");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await assertAxeOnMain(page);
  });

  test("registry URLs used on the site resolve", async ({ page }) => {
    for (const path of REGISTRY_SMOKE_URLS) {
      const res = await page.request.get(`${BASE}${path}`);
      expect(res.status(), path).toBe(200);
    }
  });
});
