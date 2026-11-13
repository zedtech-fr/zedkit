import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { A11Y_AXE_EXCEPTIONS, A11Y_AXE_EXCLUDES, CLIP_EXCEPTIONS } from "../tests/a11y-exceptions.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));

test("every axe exclude is documented with owner and removeBy", () => {
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

test("every clip hatch is documented with file, owner and removeBy", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of CLIP_EXCEPTIONS) {
    assert.match(entry.selector, /\S/, "selector");
    assert.match(entry.file, /^apps\/docs\//u, "file");
    assert.match(entry.reason, /\S/, "reason");
    assert.match(entry.owner, /\S/, "owner");
    assert.match(entry.removeBy, /^\d{4}-\d{2}-\d{2}$/, "removeBy ISO date");
    assert.ok(!Number.isNaN(Date.parse(entry.removeBy)), `removeBy parses: ${entry.removeBy}`);
    assert.ok(entry.removeBy >= today, `renew or fix ${entry.selector} (expired ${entry.removeBy})`);
  }
});

test("data-allow-clip producers are registered in CLIP_EXCEPTIONS", () => {
  const raw = execSync("git grep -l -- data-allow-clip -- apps/docs || true", {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const allow = new Set([
    "apps/docs/tests/a11y-exceptions.mjs",
    "apps/docs/tests/all-routes-fit.spec.ts",
    "apps/docs/scripts/a11y-exceptions.test.mjs",
    "apps/docs/scripts/clipped-text.mjs",
    "apps/docs/scripts/clipped-text.test.mjs",
    "apps/docs/AGENTS.md",
  ]);
  const producers = raw ? raw.split("\n").filter((file) => !allow.has(file)) : [];
  const registered = new Set(CLIP_EXCEPTIONS.map((entry) => entry.file));
  assert.deepEqual(
    producers.filter((file) => !registered.has(file)),
    [],
    "register each data-allow-clip producer in CLIP_EXCEPTIONS",
  );
});
