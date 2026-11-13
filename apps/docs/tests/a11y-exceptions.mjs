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
export const CLIP_EXCEPTIONS = [];
