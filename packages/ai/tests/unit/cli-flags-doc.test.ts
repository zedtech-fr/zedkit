import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readManifest } from "#kit.js";
import { usageFlags, usageProviders, usageText } from "./helpers.js";

describe("cli flags documentation", () => {
  it("documents every USAGE flag in the package README", () => {
    const flags = usageFlags();
    expect(flags.length).toBeGreaterThan(0);
    const readme = readFileSync(
      fileURLToPath(new URL("../../README.md", import.meta.url)),
      "utf8",
    );
    for (const flag of flags) {
      expect(readme, `README missing ${flag}`).toContain(flag);
    }
  });

  it("lists the manifest presets in USAGE", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const presets = Object.keys(manifest.value.presets).sort();
    const usage = /\[--preset ([^\]]+)\]/u.exec(usageText())?.[1]?.split("|").sort() ?? [];
    expect(usage, "USAGE --preset values").toEqual(presets);
  });

  it("mirrors the preset and provider values in the package README", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const presets = Object.keys(manifest.value.presets).sort();
    const providers = usageProviders().sort();
    expect(presets.length).toBeGreaterThan(0);
    expect(providers.length).toBeGreaterThan(0);
    const readme = readFileSync(
      fileURLToPath(new URL("../../README.md", import.meta.url)),
      "utf8",
    );
    const presetDoc = /`--preset ([^`]+)`/u.exec(readme)?.[1]?.split("|").sort() ?? [];
    const providerDoc = /`--provider ([^`]+)`/u.exec(readme)?.[1]?.split(",").sort() ?? [];
    expect(presetDoc, "README --preset values").toEqual(presets);
    const documentedProviders = ["all", "claude", "codex", "cursor"];
    expect(providerDoc, "README --provider values").toEqual(documentedProviders);
    for (const name of providerDoc) {
      expect(providers, `README documents unknown provider "${name}"`).toContain(name);
    }
  });
});
