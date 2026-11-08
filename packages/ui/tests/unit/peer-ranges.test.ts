// Original work by the same author.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const uiRoot = join(here, "..", "..");
const repo = join(uiRoot, "..", "..");

function peersOf(packageJson: string): Record<string, string> {
  const pkg = JSON.parse(readFileSync(packageJson, "utf8")) as { peerDependencies?: Record<string, string> };
  return pkg.peerDependencies ?? {};
}

const THIS_PACKAGE = peersOf(join(uiRoot, "package.json"));
const PAYLOAD_SEO_PACKAGE = peersOf(join(repo, "packages", "payload-seo", "package.json"));

describe("published peer dependencies are installable ranges (D1)", () => {
  it("ui peers accept newer minors instead of pinning the catalog exact", () => {
    const peers = THIS_PACKAGE;
    expect(Object.keys(peers).length).toBeGreaterThan(0);
    for (const [name, range] of Object.entries(peers)) {
      // No catalog: pins, no bare versions: npm ERESOLVEs otherwise.
      // Floors admit every React 19 / Tailwind 4 minor (including today's
      // scaffold defaults); CI installs scaffold defaults (pnpm + npm cells)
      // while tailwind ^4 resolves to newest.
      expect(range, `${name} peer range`).toMatch(/^\^/u);
    }
  });

  it("payload-seo payload peer is a range like the nest caret policy", () => {
    expect(PAYLOAD_SEO_PACKAGE["payload"] ?? "").toMatch(/^\^/u);
  });

  it("ui runtime closure peers (i18n) do not reintroduce exact pins (D1)", () => {
    // zedkit-ui ships zedkit-i18n at runtime: an exact peer pin there breaks
    // the same npm install this test guards.
    const peers = peersOf(join(repo, "packages", "i18n", "package.json"));
    for (const [name, range] of Object.entries(peers)) {
      expect(range, `i18n peer ${name}`).toMatch(/^\^/u);
    }
  });
});
