import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES } from "./a11y-helpers";
import { useIdentity } from "./identity-helpers";

/**
 * A dark section inside a local identity must resolve to that identity's dark
 * tokens, whatever identity the page root carries (root Tide → local Press →
 * dark section is the case that used to fall to Tide: equal-specificity
 * descendant rules, won by file order).
 *
 * Two shapes are checked against the same identity pinned dark on its own node:
 * - the node `<ThemeScope mode="dark">` renders inside a scope (identity carried
 *   on the node): every token, shadows included;
 * - a hand-written plain `.dark` descendant: the colour, shape and type tokens.
 *   Shadow tokens are derived (`var(--zk-shadow-color)`) and custom properties
 *   inherit their resolved value, so a plain descendant cannot re-derive them.
 */
const TOKENS = ["--background", "--foreground", "--primary", "--card", "--border", "--radius", "--zk-font-sans"];
const DERIVED = ["--zk-shadow-md", "--zk-shadow-lg"];

for (const root of DOCS_SHIPPED_IDENTITIES) {
  for (const siteMode of ["light", "dark"] as const) {
    test(`root ${root} (${siteMode}): a dark section keeps the nearer identity`, async ({ page }) => {
      await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
      await useIdentity(page, root, siteMode);
      const result = await page.evaluate(
        ({ tokens, derived, ids }) => {
          const main = document.querySelector("main")!;
          const read = (node: Element, names: string[]) =>
            Object.fromEntries(names.map((name) => [name, getComputedStyle(node).getPropertyValue(name).replace(/\s+/g, " ").trim()]));
          const scopeNode = (id: string, dark: boolean) => {
            const node = document.createElement("div");
            node.setAttribute("data-identity-scope", "");
            node.setAttribute("data-identity", id);
            if (dark) node.className = "dark";
            return node;
          };
          const out: Record<string, { carried: object; carriedRef: object; plain: object; plainRef: object }> = {};
          for (const id of ids) {
            const outer = scopeNode(id, false);
            const carried = scopeNode(id, true);
            const plain = document.createElement("div");
            plain.className = "dark";
            outer.append(carried, plain);
            const reference = scopeNode(id, true);
            main.append(outer, reference);
            out[id] = {
              carried: read(carried, [...tokens, ...derived]),
              carriedRef: read(reference, [...tokens, ...derived]),
              plain: read(plain, tokens),
              plainRef: read(reference, tokens),
            };
            outer.remove();
            reference.remove();
          }
          return out;
        },
        { tokens: TOKENS, derived: DERIVED, ids: [...DOCS_SHIPPED_IDENTITIES] },
      );
      for (const id of DOCS_SHIPPED_IDENTITIES) {
        const entry = result[id]!;
        expect(entry.carried, `root ${root} → local ${id} → ThemeScope dark node`).toEqual(entry.carriedRef);
        expect(entry.plain, `root ${root} → local ${id} → plain .dark section`).toEqual(entry.plainRef);
      }
    });
  }
}
