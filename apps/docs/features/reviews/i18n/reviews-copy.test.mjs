import assert from "node:assert/strict";
import test from "node:test";

const { reviewsCopy } = await import("./reviews-copy.ts");

test("load error names an action and keeps no retry key", () => {
  assert.equal(
    reviewsCopy.loadError.description,
    "GitHub or the runs API did not answer. Try again later, or choose another issue.",
  );
  assert.equal("retry" in reviewsCopy.loadError, false);
});

test("failed-run wording is Failed", () => {
  assert.equal(reviewsCopy.status.failed, "Failed");
  assert.equal(reviewsCopy.issue.failedReplaced, "Failed — replaced by a newer run");
});
