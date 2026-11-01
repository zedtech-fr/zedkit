/** Props surfaced first on unified component pages (R2 template). */
export const DEFAULT_PROPS_PRIORITY = ["variant", "size", "asChild"];

/**
 * Splits a props list into kit props (shown) and inherited native attributes
 * (folded). A prop is a kit prop when the page prioritises it, when it is
 * required, or when the platform has no attribute of that name. Order:
 * required props, then the page's priority list, then the rest as declared.
 *
 * @template {{ name: string, required?: boolean }} T
 * @param {T[]} entries
 * @param {string[]} [priority]
 * @param {ReadonlySet<string>} [native] attribute names the underlying element already has
 * @param {boolean} [only] show the priority list only; everything else folds
 * @returns {{ primary: T[], inherited: T[] }}
 */
export function partitionPropsEntries(entries, priority = DEFAULT_PROPS_PRIORITY, native, only = false) {
  const order = new Map(priority.map((name, index) => [name, index]));
  const rank = (entry) => (entry.required ? -1 : order.has(entry.name) ? order.get(entry.name) : priority.length);
  const primary = [];
  const inherited = [];
  for (const entry of entries) {
    const kit = order.has(entry.name) || (!only && native ? entry.required || !native.has(entry.name) : false);
    (kit ? primary : inherited).push(entry);
  }
  primary.sort((a, b) => rank(a) - rank(b));
  inherited.sort((a, b) => a.name.localeCompare(b.name));
  return { primary, inherited };
}
