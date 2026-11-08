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

describe("published peer dependencies declare installable floors (D1)", () => {
  it("ui peers accept newer minors instead of pinning the catalog exact", () => {
    const peers = THIS_PACKAGE;
    expect(Object.keys(peers).length).toBeGreaterThan(0);
    for (const [name, range] of Object.entries(peers)) {
      // No catalog: pins, no bare versions: npm ERESOLVEs otherwise.
      // This asserts the declared floor shape only; the compatibility proof
      // is the smoke cells, which install real scaffold defaults (CNA React
      // 19.3.x, Tailwind 4) against these ranges on pnpm and npm.
      expect(range, `${name} peer range`).toMatch(/^\^19\.0\.0$|^\^4\.0\.0$/u);
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
