import { expect } from "vitest";

// Documented Radix runtime-var allowlist, stripped before pinning:
// `[--radix-*]` / `[var(--radix-*)]` are emitted by Radix, not authors.
const RADIX_ALLOWLIST = /\[--radix-[^\]]*\]|\[var\(--radix-[^)]*\)\]/g;
const VALUE_ARBITRARY = /\[[-\d#]/;

/** Fails when `className` carries a raw value arbitrary (`w-[4px]`, `text-[#fff]`). */
export function assertNoValueArbitraries(className: string): void {
  expect(className.replace(RADIX_ALLOWLIST, "")).not.toMatch(VALUE_ARBITRARY);
}
