import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readManifest } from "#kit.js";

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
});
