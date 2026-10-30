/** Shared site URLs for nav, footer, and CI link checks (import from TS and scripts). */

export const SITE_GITHUB_URL = "https://github.com/zedtech-fr/zedkit";
export const SITE_NPM_ORG_URL = "https://www.npmjs.com/org/zedtech";
export const SITE_LICENSE_URL = "https://github.com/zedtech-fr/zedkit/blob/main/LICENSE";
export const SITE_BUG_REPORT_URL =
  "https://github.com/zedtech-fr/zedkit/issues/new?template=bug_report.md";
export const SITE_CHANGELOG_URL =
  "https://github.com/zedtech-fr/zedkit/blob/main/packages/ui/CHANGELOG.md";

/** In-app routes referenced from the global header (must exist in the static export). */
export const SITE_HEADER_INTERNAL_PATHS = [
  "/docs",
  "/catalog",
  "/docs/getting-started",
  "/docs/build-an-admin-dashboard",
  "/docs/set-up-your-coding-agents",
  "/docs/add-seo-to-nextjs",
  "/docs/zedkit-and-shadcn",
  "/docs/maturity-and-compatibility",
];

/**
 * @param {string} changelogHref
 * @returns {{ label: string; href: string; external: boolean }[]}
 */
export function siteFooterLinkSpecs(changelogHref) {
  return [
    { label: "MIT License", href: SITE_LICENSE_URL, external: true },
    { label: "Source repository", href: SITE_GITHUB_URL, external: true },
    { label: "npm organisation", href: SITE_NPM_ORG_URL, external: true },
    { label: "Report a bug", href: SITE_BUG_REPORT_URL, external: true },
    { label: "UI changelog", href: changelogHref, external: true },
  ];
}
