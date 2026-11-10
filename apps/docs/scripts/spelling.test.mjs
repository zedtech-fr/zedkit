import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

const COPY_FILE_RELATIVE = [
  "components/i18n/adoption-copy.ts",
  "components/i18n/identity-assistant-copy.ts",
  "components/i18n/identity-brief-copy.ts",
  "components/i18n/identity-editor-copy.ts",
  "app/i18n/identity-editor-copy.ts",
  "components/demos/i18n/brand-logo-copy.ts",
  "components/demos/i18n/scroll-scenes-copy.ts",
  "components/identity-editor-fields.tsx",
  "lib/identity-editor-search.ts",
  "lib/maturity-status.ts",
  "lib/identity-refinement-chips.ts",
];

const BRITISH_SPELLINGS = ["colour", "colours", "Colour", "Colours", "organisation", "organised", "behaviour", "behavioural"];

function readCopyFiles() {
  const files = [];
  for (const rel of COPY_FILE_RELATIVE) {
    const path = join(APP, rel);
    if (!existsSync(path)) continue;
    // copy files live under components/i18n etc., lib files are not visible copy but we still check visible ones
    // For lib, only comments that are user-facing should not count; we limit to i18n + editor-fields for now
    // but keep list extendable
    files.push({ rel, content: readFileSync(path, "utf8") });
  }
  // Include all i18n copy files
  return files;
}

test("listed copy files use US spelling for color and organisation", () => {
  const banned = BRITISH_SPELLINGS;
  const errors = [];
  for (const { rel, content } of readCopyFiles()) {
    for (const word of banned) {
      if (content.includes(word)) {
        errors.push(`${rel} contains British spelling "${word}"`);
      }
    }
  }
  assert.deepEqual(errors, [], `British spellings found:\n${errors.join("\n")}`);
});
