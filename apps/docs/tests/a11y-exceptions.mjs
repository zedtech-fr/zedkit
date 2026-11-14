/**
 * Known axe exclude selectors for the docs a11y gate. Each entry needs an
 * owner and removeBy date; CI fails if the list grows without updating this file.
 * The list is empty while the measured pages pass. Add a row only for a failure
 * you have seen, with a date to remove it.
 * @typedef {{ selector: string, reason: string, owner: string, removeBy: string }} A11yAxeException
 */

/** @type {A11yAxeException[]} */
export const A11Y_AXE_EXCEPTIONS = [];

/** Comma-separated selectors passed to axe exclude(). Empty when nothing is skipped. */
export const A11Y_AXE_EXCLUDES = A11Y_AXE_EXCEPTIONS.map((entry) => entry.selector).join(", ");

/**
 * `data-allow-clip` skips the clipped-text gate for intended truncation that
 * is not `truncate` / `line-clamp-*`. Same discipline as axe exceptions: add
 * a row only for a failure you have seen, with owner and removeBy. The
 * attribute is the runtime hatch; this list is the owner/expiry registry.
 * @typedef {{ selector: string, file: string, reason: string, owner: string, removeBy: string }} ClipException
 */

/** @type {ClipException[]} */
export const CLIP_EXCEPTIONS = [
  {
    selector: "[data-hero-run-stage]",
    file: "apps/docs/app/(home)/_home/home-hero-illustration.tsx",
    reason: "Hero stage masks decorative blobs that sit past the rounded high-value panel.",
    owner: "docs",
    removeBy: "2027-02-13",
  },
  {
    selector: "[data-home-same-idea-window]",
    file: "apps/docs/app/(home)/_home/sections/home-same-idea-section.tsx",
    reason: "120px product windows mask decorative blobs, not the chip labels.",
    owner: "docs",
    removeBy: "2027-02-13",
  },
  {
    selector: '[data-home-six-sentences-card="featured"]',
    file: "apps/docs/app/(home)/_home/sections/home-six-sentences-section.tsx",
    reason: "Featured quote cards mask the circle/stripe wash.",
    owner: "docs",
    removeBy: "2027-02-13",
  },
  {
    selector: "#manifesto[data-slot=section]",
    file: "apps/docs/app/(home)/_home/sections/home-manifesto-section.tsx",
    reason: "Manifesto band masks the circle/stripe wash.",
    owner: "docs",
    removeBy: "2027-02-13",
  },
];
