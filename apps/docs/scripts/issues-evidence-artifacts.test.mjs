import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(docsRoot, "../..");
const evidenceDir = join(docsRoot, "tests/evidence/issues");
/** Capture set for `zedkit-ai evidence --routes` + `critical-states.json`. Do not commit the PNGs. */
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

test("critical capture PNG names are unique", () => {
  assert.equal(new Set(EVIDENCE_FILES).size, EVIDENCE_FILES.length);
});

test("generated evidence PNGs are not gittracked", () => {
  const tracked = execFileSync("git", ["ls-files", "--", "apps/docs/tests/evidence"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".png"));
  assert.deepEqual(tracked, []);
});

test("critical-states first-issue-open click matches the list row", () => {
  const states = JSON.parse(readFileSync(join(evidenceDir, "critical-states.json"), "utf8"));
  assert.equal(states.length, 1);
  assert.equal(states[0]?.name, "First issue open");
  assert.equal(states[0]?.click, "main [data-issues-row]");
  const list = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../features/reviews/ui/review-list-view.tsx"),
    "utf8",
  );
  assert.match(list, /data-issues-row=""/);
  assert.doesNotMatch(list, /<details /);
  assert.doesNotMatch(list, /querySelectorAll\("main details\[data-issues-row\]"\)/);
});
