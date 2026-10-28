import assert from "node:assert/strict";
import test from "node:test";

import { devtoolsEnabled } from "../dist/enabled.js";

test("devtoolsEnabled is false in production", () => {
  assert.equal(devtoolsEnabled({ nodeEnv: "production" }), false);
});

test("devtoolsEnabled is true in development", () => {
  assert.equal(devtoolsEnabled({ nodeEnv: "development" }), true);
});

test("devtoolsEnabled respects force", () => {
  assert.equal(devtoolsEnabled({ nodeEnv: "production", force: true }), true);
});
