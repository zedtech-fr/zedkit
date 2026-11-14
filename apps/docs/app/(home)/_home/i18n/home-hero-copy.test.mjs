import assert from "node:assert/strict";
import test from "node:test";

const { homeHeroCopy } = await import("./home-hero-copy.ts");

const copy = homeHeroCopy.heroIllustration;

test("issue badge pluralizes", () => {
  assert.equal(copy.issueBadge({ count: 1 }), "1 issue");
  assert.equal(copy.issueBadge({ count: 0 }), "0 issues");
  assert.equal(copy.issueBadge({ count: 2 }), "2 issues");
});

test("failed-run status matches reviews and kit statusLabel", () => {
  assert.equal(copy.statusFailed, "Failed");
});
