import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readme = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "README.md"),
  "utf8",
);

/** Canonical paste from the docs site (`NEST_SETUP_MINI_PROMPT`). */
const NEST_SETUP_MINI_PROMPT =
  "Set up zedkit Nest on this repo following https://zedkit.app/nest/setup.md";

describe("Nest README agent setup pointer", () => {
  it("contains the exact Nest mini prompt so npm readers can paste /nest/setup.md", () => {
    expect(readme).toContain(NEST_SETUP_MINI_PROMPT);
  });
});
