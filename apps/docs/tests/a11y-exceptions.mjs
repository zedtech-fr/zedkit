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
