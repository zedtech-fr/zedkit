import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import { parser as tsParser } from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { uiPreset } from "#index.mjs";
import { findScaleHits, scaleClassKind } from "#scale-classes.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const entry = join(repo, "packages/ui/src/styles.css");
const attr = "class" + "Name";
const call = "c" + "n";

function hits(source) {
  return findScaleHits(source).map((hit) => hit.token);
}

function lintScale(code, { cwd, filename, baseline, entryPoint }) {
  const block = uiPreset({
    entryPoint,
    ...(baseline ? { scaleBaseline: baseline } : {}),
  }).find((item) => item.name === "zedkit/ui-scale");
  const linter = new Linter({ configType: "flat", cwd });
  return linter.verify(
    code,
    [
      {
        ...block,
        files: ["**/*.tsx"],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
    ],
    filename,
  );
}

describe("scaleClassKind", () => {
  it("flags spacing steps, fractions, counts and the default type scale", () => {
    expect(scaleClassKind("mt-4")).toBe("spacing");
    expect(scaleClassKind("sm:p-4")).toBe("spacing");
    expect(scaleClassKind("-mt-1.5")).toBe("spacing");
    expect(scaleClassKind("w-px")).toBe("spacing");
    expect(scaleClassKind("w-1/2")).toBe("fraction");
    expect(scaleClassKind("grid-cols-3")).toBe("count");
    expect(scaleClassKind("text-sm")).toBe("type");
    expect(scaleClassKind("text-2xl")).toBe("type");
  });

  it("allows role classes and non-scale utilities", () => {
    for (const name of ["px-page-gutter", "gap-stack-sm", "gap-x-stack-sm", "gap-y-stack-sm", "gap-y-stack-md", "gap-y-stack-lg", "gap-x-stack-lg", "space-y-stack-sm", "space-y-stack-md", "space-y-stack-lg", "content-shrink", "pin-top", "text-control", "text-dense", "text-caption", "text-primary", "w-full", "h-svh", "focus-ring"]) {
      expect(scaleClassKind(name), name).toBeNull();
    }
  });

  it("flags a spelled number as an alias, not a role", () => {
    expect(scaleClassKind("min-w-zero")).toBe("alias");
    expect(scaleClassKind("px-stack-lg")).toBe("alias");
    expect(scaleClassKind("size-stack-4xl")).toBe("alias");
  });
});

describe("findScaleHits", () => {
  it("reads className, cn() and @apply once each", () => {
    expect(hits(`<div ${attr}="mt-4 grid-cols-3 w-1/2 text-sm" />`)).toEqual([
      "mt-4",
      "grid-cols-3",
      "w-1/2",
      "text-sm",
    ]);
    expect(hits(`<div ${attr}={${call}("mt-4")} />`)).toEqual(["mt-4"]);
    expect(hits("@apply gap-2;")).toEqual(["gap-2"]);
    expect(hits(`<div ${attr}="px-page-gutter gap-stack-sm text-control content-shrink" />`)).toEqual([]);
    expect(hits(`<div ${attr}="min-w-zero px-stack-lg" />`)).toEqual(["min-w-zero", "px-stack-lg"]);
  });
});

describe("uiPreset scale enforcement", () => {
  const good = `export function A(){ return <div ${attr}="px-page-gutter gap-stack-sm text-control" />; }\n`;
  const bad = `export function A(){ return <div ${attr}="mt-4 grid-cols-3 w-1/2 text-sm" />; }\n`;

  it("accepts role classes and rejects scale steps when Tailwind resolves", () => {
    const filename = join(repo, "fixture.tsx");
    const ok = lintScale(good, { cwd: repo, filename, entryPoint: entry });
    expect(ok.filter((item) => /tokens-scale|tokens-tailwind/u.test(item.message))).toEqual([]);
    const blocked = lintScale(bad, { cwd: repo, filename, entryPoint: entry });
    const scale = blocked.filter((item) => item.message.startsWith("tokens-scale:"));
    expect(scale.map((item) => item.message)).toEqual([
      expect.stringContaining('"mt-4"'),
      expect.stringContaining('"grid-cols-3"'),
      expect.stringContaining('"w-1/2"'),
      expect.stringContaining('"text-sm"'),
    ]);
    expect(blocked.some((item) => item.message.startsWith("tokens-tailwind:"))).toBe(false);
  });

  it("fails closed when Tailwind cannot be resolved", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zk-no-tw-"));
    const messages = lintScale(good, {
      cwd,
      filename: join(cwd, "a.tsx"),
      entryPoint: join(cwd, "app.css"),
    });
    expect(messages.some((item) => item.message.includes("fails closed"))).toBe(true);
    expect(messages.some((item) => item.message.startsWith("tokens-tailwind:"))).toBe(true);
  });

  it("fails closed when the CSS entry is missing", () => {
    const messages = lintScale(good, {
      cwd: repo,
      filename: join(repo, "fixture.tsx"),
      entryPoint: join(repo, "missing-entry.css"),
    });
    expect(messages.some((item) => item.message.includes("Tailwind entry not found"))).toBe(true);
  });

  it("allows a file only up to its baseline count", () => {
    const cwd = repo;
    const filename = join(repo, "fixture.tsx");
    const baseline = join(mkdtempSync(join(tmpdir(), "zk-base-")), "baseline.json");
    writeFileSync(baseline, JSON.stringify({ version: 1, files: { "fixture.tsx": 1 } }));
    const one = `export function A(){ return <div ${attr}="mt-4" />; }\n`;
    const two = `export function A(){ return <div ${attr}="mt-4 gap-2" />; }\n`;
    expect(lintScale(one, { cwd, filename, entryPoint: entry, baseline }).some((item) => item.message.includes("tokens-scale"))).toBe(false);
    const over = lintScale(two, { cwd, filename, entryPoint: entry, baseline });
    expect(over.some((item) => item.message.includes("baseline allows 1"))).toBe(true);
  });
});
