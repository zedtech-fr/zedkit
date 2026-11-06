import assert from "node:assert/strict";
import test from "node:test";

import { A11Y_AXE_EXCEPTIONS, A11Y_AXE_EXCLUDES } from "../tests/a11y-exceptions.mjs";

test("every axe exclude is documented with owner and removeBy", () => {
  assert.ok(A11Y_AXE_EXCEPTIONS.length > 0);
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of A11Y_AXE_EXCEPTIONS) {
    assert.match(entry.selector, /\S/, "selector");
    assert.match(entry.reason, /\S/, "reason");
    assert.match(entry.owner, /\S/, "owner");
    assert.match(entry.removeBy, /^\d{4}-\d{2}-\d{2}$/, "removeBy ISO date");
    assert.ok(!Number.isNaN(Date.parse(entry.removeBy)), `removeBy parses: ${entry.removeBy}`);
    assert.ok(entry.removeBy >= today, `renew or fix ${entry.selector} (expired ${entry.removeBy})`);
  }
});

test("A11Y_AXE_EXCLUDES matches the registry selectors", () => {
  assert.equal(A11Y_AXE_EXCLUDES, A11Y_AXE_EXCEPTIONS.map((e) => e.selector).join(", "));
});
