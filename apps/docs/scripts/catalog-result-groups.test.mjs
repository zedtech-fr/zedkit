import assert from "node:assert/strict";
import test from "node:test";
import { groupCatalogResults } from "../lib/catalog-result-groups.mjs";

const row = (pkg, title = pkg) => ({
  href: `/docs/${pkg}/x`,
  title,
  need: title,
  status: "beta",
  area: "ui",
  package: pkg,
});

test("groupCatalogResults orders UI before Backend and buckets packages", () => {
  const groups = groupCatalogResults([row("server"), row("ui"), row("flags")]);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["ui", "backend", "more"],
  );
  assert.equal(groups[1].entries[0].package, "server");
});

test("single-package filter yields one group heading", () => {
  const groups = groupCatalogResults([row("ui", "a"), row("ui", "b")]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "UI");
  assert.equal(groups[0].entries.length, 2);
});
