/**
 * Known axe exclude selectors for the docs a11y gate (R23). Each entry needs an
 * owner and removeBy date; CI fails if the list grows without updating this file.
 * @typedef {{ selector: string, reason: string, owner: string, removeBy: string }} A11yAxeException
 */

/** @type {A11yAxeException[]} */
export const A11Y_AXE_EXCEPTIONS = [
  {
    selector: "pre",
    reason: "Shiki token colors are not product text contrast",
    owner: "docs",
    removeBy: "2026-12-31",
  },
  {
    selector: "[data-rehype-pretty-code-figure]",
    reason: "Code figure chrome is decorative for axe contrast",
    owner: "docs",
    removeBy: "2026-12-31",
  },
  {
    selector: "[data-home-dashboard-card]",
    reason: "Home dashboard demo card tracked on #389",
    owner: "ui-idiom",
    removeBy: "2026-11-30",
  },
  {
    selector: "[role='tabpanel'] figure",
    reason: "Component preview figures use isolated theme scopes (#394)",
    owner: "docs",
    removeBy: "2026-12-31",
  },
  {
    selector: "#nd-sidebar",
    reason: "Fumadocs sidebar; mobile trigger naming covered in a11y-gate.spec.ts",
    owner: "docs",
    removeBy: "2026-12-31",
  },
  {
    selector: "[id^='type-table-']",
    reason: "Generated maturity type tables use compact meta styling",
    owner: "docs",
    removeBy: "2026-12-31",
  },
];

/** Comma-separated selectors passed to axe exclude(). */
export const A11Y_AXE_EXCLUDES = A11Y_AXE_EXCEPTIONS.map((entry) => entry.selector).join(", ");
