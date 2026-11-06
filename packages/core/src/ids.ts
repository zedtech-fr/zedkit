// Thin wrapper over the mature `ulid` package (see the golden rule):
// prefixed, greppable, unconfusable unique IDs.
import { ulid } from "ulid";

function assertPrefix(prefix: string): void {
  if (prefix.length === 0 || prefix.includes("_")) {
    throw new Error(
      `invalid id prefix ${JSON.stringify(prefix)}: expected a non-empty string without "_"`,
    );
  }
}

/** `"<prefix>_<ulid>"`, e.g. `order_01M5Q75SHJ9CVV6E3RBF0FGEM1`. */
export function newPrefixedId(prefix: string): string {
  assertPrefix(prefix);
  return `${prefix}_${ulid()}`;
}

/** True when `id` is a `newPrefixedId(prefix)` output (shape-checked). */
export function isPrefixedId(id: string, prefix: string): boolean {
  assertPrefix(prefix);
  const head = `${prefix}_`;
  if (!id.startsWith(head)) return false;
  const raw = id.slice(head.length);
  return raw.length === 26 && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(raw);
}
