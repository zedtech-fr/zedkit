import assert from "node:assert/strict";
import test from "node:test";

const { notFoundCopy } = await import("./not-found-copy.ts");

test("404 CTA names home, not the product", () => {
  assert.equal(notFoundCopy.backLink, "Back to home");
});
