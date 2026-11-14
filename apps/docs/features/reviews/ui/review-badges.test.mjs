import assert from "node:assert/strict";
import test from "node:test";

import { outcomeDotTone } from "./review-badges.ts";

test("outcomeDotTone maps headline status and verdict to StatusDot tones", () => {
  assert.equal(outcomeDotTone(null), "idle");
  assert.equal(outcomeDotTone({ kind: "status", status: "running", score: null }), "active");
  assert.equal(outcomeDotTone({ kind: "status", status: "failed", score: null }), "danger");
  assert.equal(outcomeDotTone({ kind: "status", status: "completed", score: null }), "idle");
  assert.equal(outcomeDotTone({ kind: "verdict", verdict: "request-changes", score: 4 }), "warning");
  assert.equal(outcomeDotTone({ kind: "verdict", verdict: "approve", score: 9 }), "success");
  assert.equal(outcomeDotTone({ kind: "verdict", verdict: "comment", score: null }), "idle");
});
