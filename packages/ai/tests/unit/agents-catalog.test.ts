import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readManifest } from "#kit.js";
import { shippedNames } from "./helpers.js";

function catalogRows(): string[] {
  const raw = readFileSync(
    fileURLToPath(new URL("../../../../docs/agents-catalog.md", import.meta.url)),
    "utf8",
  );
  return raw
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.split("|")[1]?.trim().replaceAll("`", "") ?? "");
}

describe("agents catalog", () => {
  it("lists every agent the kit ships as its own row", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const rows = catalogRows();
    for (const agent of manifest.value.agents) {
      expect(rows, agent).toContain(agent);
    }
  });

  it("lists no agent the kit no longer ships (no stale rows)", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const shipped = new Set(manifest.value.agents);
    for (const row of catalogRows()) {
      expect(shipped.has(row), `stale catalog row: ${row}`).toBe(true);
    }
  });

  it("resolves every Typical chains name to a skill, agent or command", () => {
    const raw = readFileSync(
      fileURLToPath(new URL("../../../../docs/agents-catalog.md", import.meta.url)),
      "utf8",
    );
    // Bounded to this section: a later `## ` section must never leak its
    // code spans into the chains check.
    const chains = raw.split("## Typical chains")[1]?.split("\n## ")[0] ?? "";
    expect(chains.trim().length).toBeGreaterThan(0);
    const names = shippedNames();
    for (const match of chains.matchAll(/`([^`]+)`/g)) {
      const name = (match[1] ?? "").replace(/^\//, "");
      if (name === "" || name.includes(" ")) continue;
      expect([...names], `chain name ${name}`).toContain(name);
    }
  });
});
