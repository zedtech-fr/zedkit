/**
 * Sections of a component page, in reading order. The first four always
 * exist; the rest appear only when the page has something to say. The page
 * component, the generator (frontmatter) and the contents list all read this
 * one function, so a heading never exists without content and a contents entry
 * never points at nothing.
 *
 * Accessibility is omitted on purpose when the catalog entry has no guidance
 * and the docs manifest marks the page `a11yNotApplicable` (a hook or a plain
 * layout wrapper). An interactive control with no guidance fails the build.
 *
 * @param {{ hasProps: boolean, a11y?: string, related?: readonly unknown[], troubleshooting?: string }} page
 * @returns {string[]} section ids
 */
export function componentPageSections({ hasProps, a11y, related, troubleshooting }) {
  return [
    "example",
    "guidance",
    "usage-and-states",
    "install-or-copy",
    ...(hasProps ? ["props"] : []),
    ...(a11y ? ["accessibility"] : []),
    ...(related && related.length > 0 ? ["related"] : []),
    ...(troubleshooting ? ["troubleshooting"] : []),
  ];
}

/**
 * Header facts a registry component page always shows. Catalog
 * `MaturityBadge` still hides Stable; this object does not.
 *
 * @param {{ status: string, purpose: string, packageName: string, wraps: string }} page
 */
export function componentPageHeaderMeta({ status, purpose, packageName, wraps }) {
  return { maturity: status, purpose, packageName, wraps };
}
