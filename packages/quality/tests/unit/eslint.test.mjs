import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import { defineLayers, uiPreset } from "#index.mjs";

describe("uiPreset", () => {
  it("carries the passed entryPoint into the tailwind settings", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    expect(tailwind.settings["better-tailwindcss"].entryPoint).toBe("/repo/app/globals.css");
  });

  it("fails fast when entryPoint is missing", () => {
    expect(() => uiPreset({})).toThrow("entryPoint");
  });
});

describe("defineLayers", () => {
  const layers = defineLayers({
    kitPackage: "@acme/ui",
    viewDirs: ["app/**/ui/**"],
    dataDirs: ["lib/**"],
    actionPatterns: ["@/lib/*", "**/actions", "**/actions/**"],
  });
  const linter = new Linter();
  const kitImport = 'import { Button } from "@acme/ui";\n';

  it("allows kit imports in viewDirs, denies them in app dirs", () => {
    expect(linter.verify(kitImport, layers, "app/ui/card-view.ts")).toEqual([]);
    const blocked = linter.verify(kitImport, layers, "app/page.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].ruleId).toBe("no-restricted-imports");
    expect(blocked[0].message).toContain("only allowed from view files");
  });

  it("denies data-client imports from views", () => {
    const blocked = linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/ui/card-view.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].ruleId).toBe("no-restricted-imports");
    expect(blocked[0].message).toContain("never import data clients");
  });

  it("denies UI imports from data dirs, once, with the data message", () => {
    const blocked = linter.verify(kitImport, layers, "lib/db.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].message).toContain("UI-free");
    const react = linter.verify('import { useState } from "react";\n', layers, "lib/db.ts");
    expect(react).toHaveLength(1);
    expect(react[0].message).toContain("UI-free");
  });
});
