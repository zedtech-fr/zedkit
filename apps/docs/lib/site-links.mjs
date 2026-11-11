/** Shared site URLs for nav, footer, and CI link checks (import from TS and scripts). */

export const SITE_GITHUB_URL = "https://github.com/zedtech-fr/zedkit";
export const SITE_NPM_ORG_URL = "https://www.npmjs.com/org/zedtech";
export const SITE_LICENSE_URL = "https://github.com/zedtech-fr/zedkit/blob/main/LICENSE";
export const SITE_BUG_REPORT_URL =
  "https://github.com/zedtech-fr/zedkit/issues/new?template=bug_report.md";
export const SITE_CHANGELOG_URL =
  "https://github.com/zedtech-fr/zedkit/blob/main/packages/ui/CHANGELOG.md";

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
  "/reviews",
  IDENTITY_EDITOR_HREF,
];

/**
 * Footer hrefs and catalog keys. Labels live in `siteChromeCopy.footer.links`.
 * @param {string} changelogHref
 * @returns {Array<{ copyKey: "documentation" | "catalog" | "startWithoutWritingCode" | "mitLicense" | "sourceRepository" | "npmOrganisation" | "reportABug" | "uiChangelog"; href: string; external: boolean }>}
 */
export function siteFooterLinkSpecs(changelogHref) {
  return [
    { copyKey: "documentation", href: "/docs", external: false },
    { copyKey: "catalog", href: "/catalog", external: false },
    { copyKey: "startWithoutWritingCode", href: "/docs/start-without-writing-code", external: false },
    { copyKey: "mitLicense", href: SITE_LICENSE_URL, external: true },
    { copyKey: "sourceRepository", href: SITE_GITHUB_URL, external: true },
    { copyKey: "npmOrganisation", href: SITE_NPM_ORG_URL, external: true },
    { copyKey: "reportABug", href: SITE_BUG_REPORT_URL, external: true },
    { copyKey: "uiChangelog", href: changelogHref, external: true },
  ];
}
