import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { identityContrastWarnings, identityPresets } from "@zedtech/zedkit-ui";

import { registerDocsAlias } from "#scripts/register-docs-alias.mjs";

registerDocsAlias(import.meta.url);

const { DEFAULT_IDENTITY } = await import("@/lib/default-identity");
const { colorInputHex } = await import("./identity-simple-value.ts");
const { docsSiteDefaultTokens, docsSiteTokensEqual } = await import("./docs-site-default-tokens.ts");

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const app = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return readFileSync(join(rel.startsWith("packages/") ? root : app, rel), "utf8");
}

function capture(css, pattern, label) {
  const match = css.match(pattern);
  assert.ok(match?.[1], `missing ${label}`);
  return match[1].trim();
}

test("docsSiteDefaultTokens overlays every Classic field the docs shell pins, and keeps kit Glass for the rest", () => {
  const shell = read("app/docs-shell-tokens.css");
  const compact = read("app/site-compact.css");
  const glass = identityPresets[DEFAULT_IDENTITY];
  const docs = docsSiteDefaultTokens();

  const background = capture(shell, /html\[data-docs-shell\]:not\(\.dark\)[^{]*\{[^}]*--background:\s*([^;]+)/, "light --background");
  const foreground = capture(shell, /html\[data-docs-shell\]:not\(\.dark\)[^{]*\{[^}]*--foreground:\s*([^;]+)/, "light --foreground");
  const muted = capture(shell, /html\[data-docs-shell\]:not\(\.dark\)[^{]*\{[^}]*--muted-foreground:\s*([^;]+)/, "light --muted-foreground");
  const sidebarBorder = capture(shell, /html\[data-docs-shell\]:not\(\.dark\)[^{]*\{[^}]*--sidebar-border:\s*([^;]+)/, "light --sidebar-border");
  const radius = capture(shell, /:root\[data-identity\][^{]*\{[^}]*--radius:\s*([^;]+)/, "chrome --radius");
  const borderWidth = capture(shell, /:root\[data-identity\][^{]*\{[^}]*--zk-border-width:\s*([^;]+)/, "chrome --zk-border-width");
  const shadowSm = capture(shell, /:root\[data-identity\][^{]*\{[^}]*--zk-shadow-sm:\s*([^;]+)/, "chrome --zk-shadow-sm");
  const shadowMd = capture(shell, /:root\[data-identity\][^{]*\{[^}]*--zk-shadow-md:\s*([^;]+)/, "chrome --zk-shadow-md");
  const spacing = capture(compact, /:root\[data-identity="glass"\][^{]*\{[^}]*--spacing:\s*([^;]+)/, "Glass site --spacing");

  assert.equal(docs.light.background, background);
  assert.equal(docs.light.foreground, foreground);
  assert.equal(docs.light.mutedForeground, muted);
  assert.equal(docs.light.border, sidebarBorder);
  assert.equal(docs.radius, radius);
  assert.equal(docs.borderWidth, borderWidth);
  assert.equal(docs.shadowSm, shadowSm);
  assert.equal(docs.shadowMd, shadowMd);
  assert.equal(docs.spacing, spacing);

  assert.equal(docs.light.primary, glass.light.primary);
  assert.equal(docs.light.primaryForeground, glass.light.primaryForeground);
  assert.equal(docs.light.accent, glass.light.accent);
  assert.equal(docs.bodyLeading, glass.bodyLeading);
  assert.equal(docs.fontSans, glass.fontSans);
  assert.equal(docs.fontDisplay, glass.fontDisplay);
  assert.equal(docs.headingLeading, glass.headingLeading);
  assert.equal(docs.headingTracking, glass.headingTracking);
  assert.equal(docs.labelTracking, glass.labelTracking);
  assert.deepEqual(docs.dark, glass.dark);
});

test("docs defaults still fail the 3:1 light border check, so the dock footer must count every warning", () => {
  const warnings = identityContrastWarnings(docsSiteDefaultTokens());
  assert.equal(warnings.filter((warning) => warning.min === 4.5).length, 0);
  assert.equal(warnings.filter((warning) => warning.min === 3 && warning.token === "border" && warning.scheme === "light").length, 1);
});

test("Classic colour defaults match the measured site hexes", () => {
  const docs = docsSiteDefaultTokens();
  assert.equal(colorInputHex(docs.light.background), "#ffffff");
  assert.equal(colorInputHex(docs.light.foreground), "#09090b");
  assert.equal(colorInputHex(docs.light.primary), "#2b23c7");
  assert.equal(colorInputHex(docs.light.accent), "#a171f4");
  assert.equal(colorInputHex(docs.light.border), "#e4e4e7");
});

test("docsSiteTokensEqual is value equality, not object identity", () => {
  const a = docsSiteDefaultTokens();
  const b = docsSiteDefaultTokens();
  assert.equal(a === b, false);
  assert.equal(docsSiteTokensEqual(a, b), true);
  assert.equal(docsSiteTokensEqual(a, { ...a, radius: "1rem" }), false);
  assert.equal(docsSiteTokensEqual(a, { ...a, light: { ...a.light, background: "220 60% 97%" } }), false);
});

test("docsSiteTokensEqual uses JSON.stringify so a new kit key is not silently ignored", () => {
  const src = read("features/identity/ui/docs-site-default-tokens.ts");
  assert.match(src, /JSON\.stringify\(a\) === JSON\.stringify\(b\)/);
  assert.doesNotMatch(src, /COLOUR_KEYS/);
  assert.doesNotMatch(src, /TOKEN_KEYS/);
});
