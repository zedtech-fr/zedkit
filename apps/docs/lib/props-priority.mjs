/** Props surfaced first on unified component pages (R2 template). */
export const DEFAULT_PROPS_PRIORITY = ["variant", "size", "asChild"];

/**
 * @param {{ name: string }[]} entries
 * @param {string[]} priority
 */
export function partitionPropsEntries(entries, priority = DEFAULT_PROPS_PRIORITY) {
  const order = new Map(priority.map((name, index) => [name, index]));
  const primary = [];
  const inherited = [];
  for (const entry of entries) {
    if (order.has(entry.name)) primary.push(entry);
    else inherited.push(entry);
  }
  primary.sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
  inherited.sort((a, b) => a.name.localeCompare(b.name));
  return { primary, inherited };
}
