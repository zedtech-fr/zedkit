/** Shared site URLs for nav, footer, and CI link checks (import from TS and scripts). */

export const SITE_GITHUB_URL = "https://github.com/zedtech-fr/zedkit";

/** Kit file on GitHub for a docs-manifest `source` path under `packages/ui/src`. */
export function kitUiSourceUrl(source) {
  if (typeof source !== "string" || source.length === 0 || source.includes("..")) return null;
  return `${SITE_GITHUB_URL}/blob/main/packages/ui/src/${source}`;
}
export const SITE_NPM_ORG_URL = "https://www.npmjs.com/org/zedtech";
export const SITE_LICENSE_URL = "https://github.com/zedtech-fr/zedkit/blob/main/LICENSE";
export const SITE_BUG_REPORT_URL =
  "https://github.com/zedtech-fr/zedkit/issues/new?template=bug_report.md";
export const SITE_COMPANY_URL = "https://zedtech.fr";

/** Demo-only identity editor (not a catalog docs page). */
export const IDENTITY_EDITOR_HREF = "/features/identity-editor";

/** In-app routes referenced from the global header (must exist in the static export). */
export const SITE_HEADER_INTERNAL_PATHS = [
  "/docs",
  "/catalog",
  "/docs/getting-started",
  "/docs/start-without-writing-code",
  "/docs/build-an-admin-dashboard",
  "/docs/set-up-your-coding-agents",
  "/docs/ai/setup",
  "/docs/add-seo-to-nextjs",
  "/docs/zedkit-and-shadcn",
  "/docs/maturity-and-compatibility",
  "/docs/foundations",
  "/examples/note-list",
  "/issues",
  IDENTITY_EDITOR_HREF,
];

/**
 * Footer hrefs and catalog keys. Labels live in `siteChromeCopy.footer.links`.
 * @returns {Array<{ copyKey: "docs" | "catalog" | "github" | "npm" | "company"; href: string; external: boolean }>}
 */
export function siteFooterLinkSpecs() {
  return [
    { copyKey: "docs", href: "/docs", external: false },
    { copyKey: "catalog", href: "/catalog", external: false },
    { copyKey: "github", href: SITE_GITHUB_URL, external: true },
    { copyKey: "npm", href: SITE_NPM_ORG_URL, external: true },
    { copyKey: "company", href: SITE_COMPANY_URL, external: true },
  ];
}
