import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const evidenceDir = join(dirname(fileURLToPath(import.meta.url)), "../tests/evidence/issues");
const ARTIFACT_CAP = 200 * 1024;
const EVIDENCE_FILES = [
  "issues-list-375.png",
  "issues-list-809.png",
  "issues-list-1440.png",
  "issues-list-glass-dark-1440.png",
  "issues-list-volt-light-1440.png",
  "issues-list-volt-dark-375.png",
  "issues-list-volt-dark-1440.png",
  "issues-list-empty-375.png",
  "issues-list-empty-1440.png",
  "issues-list-empty-volt-dark-1440.png",
  "issues-list-open-1440.png",
  "issues-list-open-volt-1440.png",
  "issues-108-375.png",
  "issues-108-809.png",
  "issues-108-1440.png",
  "issues-108-glass-dark-1440.png",
  "issues-108-volt-light-1440.png",
  "issues-108-volt-dark-1440.png",
  "issues-load-error-375-light.png",
  "issues-load-error-375-dark.png",
  "issues-load-error-809-light.png",
  "issues-load-error-809-dark.png",
  "issues-load-error-1440-light.png",
  "issues-load-error-1440-dark.png",
];

test("issue list and issue 108 evidence PNGs exist under the artefact cap", () => {
  for (const name of EVIDENCE_FILES) {
    const path = join(evidenceDir, name);
    const stat = statSync(path);
    assert.ok(stat.isFile(), path);
    assert.ok(stat.size > 0, `${name} is empty`);
    assert.ok(stat.size < ARTIFACT_CAP, `${name} is ${stat.size} bytes`);
  }
});

test("critical-states first-issue-open click matches the list row", () => {
  const states = JSON.parse(readFileSync(join(evidenceDir, "critical-states.json"), "utf8"));
  assert.equal(states.length, 1);
  assert.equal(states[0]?.name, "First issue open");
  assert.equal(states[0]?.click, "main details[data-issues-row] > summary");
  const list = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../features/reviews/ui/review-list-view.tsx"),
    "utf8",
  );
  assert.match(list, /data-issues-row=""/);
  assert.match(list, /querySelectorAll\("main details\[data-issues-row\]"\)/);
});
