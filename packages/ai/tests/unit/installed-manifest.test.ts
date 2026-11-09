// Original work by the same author.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  kitVersion,
  readInstalledManifest,
  writeInstalledManifest,
} from "#installed-manifest.js";
import { kitDir } from "#kit.js";
import { put, tempDir } from "./helpers.js";

function manifestDir(extra: Record<string, string> = {}): string {
  const dest = tempDir();
  for (const [rel, text] of Object.entries(extra)) put(dest, rel, text);
  return dest;
}

describe("installed manifest", () => {
  it("round-trips kit version and file hashes", () => {
    const dest = manifestDir();
    writeInstalledManifest(dest, { schema: 1, kit: "1.0.1", files: { ".agents/skills/review/SKILL.md": "abc123" } });
    const read = readInstalledManifest(dest);
    expect(read).toEqual({
      status: "ok",
      manifest: { schema: 1, kit: "1.0.1", files: { ".agents/skills/review/SKILL.md": "abc123" } },
    });
  });

  it("missing file reads as missing, not as an empty prior", () => {
    expect(readInstalledManifest(manifestDir())).toEqual({ status: "missing" });
  });

  it("corrupt JSON reads as invalid, never as user work", () => {
    const dest = manifestDir({ ".agents/.zedkit-manifest.json": "{ broken" });
    const read = readInstalledManifest(dest);
    expect(read.status).toBe("invalid");
  });

  it("an unknown schema reads as invalid so a newer producer never crashes this consumer", () => {
    const dest = manifestDir();
    put(dest, ".agents/.zedkit-manifest.json", JSON.stringify({ schema: 999, kit: "9.9.9", files: {} }));
    expect(readInstalledManifest(dest).status).toBe("invalid");
  });

  it("extra unknown fields fail closed", () => {
    const dest = manifestDir();
    put(dest, ".agents/.zedkit-manifest.json", JSON.stringify({ schema: 1, kit: "1.0.1", files: { a: 1 } }));
    expect(readInstalledManifest(dest).status).toBe("invalid");
  });

  it("reads the kit package version", () => {
    expect(kitVersion(kitDir())).toMatch(/^\d+\.\d+\.\d+/u);
    expect(kitVersion(join(tempDir(), "no-such-kit"))).toBe("unknown");
  });

  it("writes valid JSON", () => {
    const dest = manifestDir();
    writeInstalledManifest(dest, { schema: 1, kit: "x", files: {} });
    expect(() => JSON.parse(readFileSync(join(dest, ".agents", ".zedkit-manifest.json"), "utf8"))).not.toThrow();
  });
});
