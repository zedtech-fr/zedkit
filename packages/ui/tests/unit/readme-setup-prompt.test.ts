import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readme = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "README.md"),
  "utf8",
);

/** Canonical paste from the docs site (`UI_SETUP_MINI_PROMPT`). */
const UI_SETUP_MINI_PROMPT =
  "Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md";

describe("UI README agent setup pointer", () => {
  it("contains the exact UI mini prompt so npm readers can paste /ui/setup.md", () => {
    expect(readme).toContain(UI_SETUP_MINI_PROMPT);
  });
});
