import assert from "node:assert/strict";
import { statSync } from "node:fs";
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
  "issues-list-appearance-open-1440.png",
  "issues-list-appearance-open-volt-1440.png",
  "issues-108-375.png",
  "issues-108-809.png",
  "issues-108-1440.png",
  "issues-108-glass-dark-1440.png",
  "issues-108-volt-light-1440.png",
  "issues-108-volt-dark-1440.png",
  "issues-108-run-impl-1440.png",
  "issues-108-run-impl-390.png",
  "issues-108-run-20261111T065452Z-bc07a1a9-1440.png",
  "issues-108-run-20261111T065452Z-bc07a1a9-390.png",
  "issues-108-run-20261111T065452Z-bc07a1a9-console-1440.png",
  "issues-93-run-impl-1440.png",
  "issues-93-run-impl-390.png",
];

test("issue list, issue 108, and run-page evidence PNGs exist under the artefact cap", () => {
  for (const name of EVIDENCE_FILES) {
    const path = join(evidenceDir, name);
    const stat = statSync(path);
    assert.ok(stat.isFile(), path);
    assert.ok(stat.size > 0, `${name} is empty`);
    assert.ok(stat.size < ARTIFACT_CAP, `${name} is ${stat.size} bytes`);
  }
});
