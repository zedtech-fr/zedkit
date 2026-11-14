/**
 * Every section id a component page may render, in reading order. Demo hash
 * hrefs and the contents list must use this union — do not hand-copy a subset.
 */
export const COMPONENT_PAGE_SECTION_IDS = [
  "example",
  "usage-and-states",
  "install-or-copy",
  "guidance",
  "props",
  "accessibility",
  "related",
  "troubleshooting",
];

const ALWAYS_ON = new Set(["example", "usage-and-states", "install-or-copy", "guidance"]);

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
  return COMPONENT_PAGE_SECTION_IDS.filter((id) => {
    if (ALWAYS_ON.has(id)) return true;
    if (id === "props") return Boolean(hasProps);
    if (id === "accessibility") return Boolean(a11y);
    if (id === "related") return Boolean(related && related.length > 0);
    if (id === "troubleshooting") return Boolean(troubleshooting);
    return false;
  });
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
