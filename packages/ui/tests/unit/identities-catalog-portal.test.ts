import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const catalog = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "CATALOG.md"),
  "utf8",
);

const STALE_ALL_OVERLAYS =
  "Overlays (dialog, select, menu, popover, tooltip, toast) portal into the nearest ThemeScope so they keep that identity and mode";

function identitiesTroubleshooting(): string {
  const section = catalog
    .split(/^## /m)
    .slice(1)
    .find((body) => body.startsWith("Switch the visual identity with one attribute\n"));
  if (section == null) {
    throw new Error("missing Identities catalog need");
  }
  const line = /^- Troubleshooting:\s*(.+)$/m.exec(section)?.[1];
  if (line == null) {
    throw new Error("missing Identities Troubleshooting field");
  }
  return line;
}

describe("Identities catalog ThemeScope portal split", () => {
  it("does not say every overlay portals into ThemeScope", () => {
    expect(identitiesTroubleshooting()).not.toContain(STALE_ALL_OVERLAYS);
  });

  it("describes dropdowns in the scope and dialog/drawer body + mirror", () => {
    const line = identitiesTroubleshooting();
    const namesDropdowns =
      /dropdown panels/i.test(line) &&
      /\bselect\b/i.test(line) &&
      /\bmenu\b/i.test(line) &&
      /\bpopover\b/i.test(line) &&
      /\btooltip\b/i.test(line);
    expect(namesDropdowns, "dropdown panels (select, menu, popover, tooltip)").toBe(true);
    expect(line).toMatch(/portal into the nearest ThemeScope/);
    expect(line).toMatch(/dialog\/drawer portals mount on `document\.body` with a look-mirroring twin/);
    expect(line).toMatch(/without a scope they still mount on `document\.body`/);
  });
});
