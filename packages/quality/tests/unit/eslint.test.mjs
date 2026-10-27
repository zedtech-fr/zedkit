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

  it("bans forwardRef and points at the button example", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    const syntax = tailwind.rules["no-restricted-syntax"];
    const linter = new Linter({ configType: "flat" });
    const config = { files: ["**/*.tsx"], rules: { "no-restricted-syntax": syntax } };
    const member = linter.verify(
      "const X = React.forwardRef((props, ref) => props);\n",
      config,
      "button.tsx",
    );
    expect(member).toHaveLength(1);
    expect(member[0].ruleId).toBe("no-restricted-syntax");
    expect(member[0].message).toContain("packages/ui/src/button.tsx");
    const named = linter.verify(
      "const X = forwardRef((props, ref) => props);\n",
      config,
      "button.tsx",
    );
    expect(named).toHaveLength(1);
    expect(named[0].message).toContain("ComponentProps");
    const imported = linter.verify(
      'import { forwardRef } from "react";\n',
      config,
      "button.tsx",
    );
    expect(imported.some((entry) => entry.message.includes("forwardRef"))).toBe(true);
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

  it("merges extraPatterns into each block without dropping the preset bans", () => {
    const withExtras = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: ["@/lib/*"],
      extraPatterns: {
        kitScope: [{ group: ["payload"], message: "no payload core here" }],
        viewData: [{ group: ["node:fs"], message: "no fs in views" }],
        dataUi: [{ group: ["@acme/admin"], message: "no admin in data" }],
      },
    });
    // Extra + preset ban coexist in the kit-scope block.
    const payload = linter.verify('import x from "payload";\n', withExtras, "app/page.ts");
    expect(payload).toHaveLength(1);
    expect(payload[0].message).toContain("no payload core");
    const kit = linter.verify(kitImport, withExtras, "app/page.ts");
    expect(kit).toHaveLength(1);
    expect(kit[0].message).toContain("only allowed from view files");
    // Extras land in their own block only.
    expect(linter.verify('import x from "payload";\n', withExtras, "app/ui/card-view.ts")).toEqual([]);
    const fs = linter.verify('import x from "node:fs";\n', withExtras, "app/ui/card-view.ts");
    expect(fs).toHaveLength(1);
    expect(fs[0].message).toContain("no fs in views");
    const admin = linter.verify('import x from "@acme/admin";\n', withExtras, "lib/db.ts");
    expect(admin).toHaveLength(1);
    expect(admin[0].message).toContain("no admin in data");
  });

  it("fails fast on unknown extraPatterns keys", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: ["@/lib/*"],
        extraPatterns: { kitcope: [] },
      }),
    ).toThrow('unknown extraPatterns key "kitcope"');
  });

  it("fails fast on non-list extraPatterns values", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: ["@/lib/*"],
        extraPatterns: { kitScope: "payload" },
      }),
    ).toThrow("extraPatterns.kitScope must be a list");
  });

  it("drops the view ban (and the block) when actionPatterns is empty", () => {
    const layers = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: [],
    });
    expect(layers.map((block) => block.name)).toEqual(["zedkit/layers-kit-scope", "zedkit/layers-data-ui"]);
    // The config validates (verify would throw on an empty group),
    // and data imports stay allowed where no ban covers them.
    expect(linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/page.ts")).toEqual([]);
    // Other blocks still ban.
    const kit = linter.verify(kitImport, layers, "app/page.ts");
    expect(kit).toHaveLength(1);
  });

  it("keeps viewData extras when actionPatterns is empty", () => {
    const layers = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: [],
      extraPatterns: { viewData: [{ group: ["node:fs"], message: "no fs in views" }] },
    });
    expect(layers.map((block) => block.name)).toContain("zedkit/layers-view-data");
    const fs = linter.verify('import x from "node:fs";\n', layers, "app/ui/card-view.ts");
    expect(fs).toHaveLength(1);
    expect(fs[0].message).toContain("no fs in views");
    expect(linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/ui/card-view.ts")).toEqual([]);
  });

  it("fails fast on non-list actionPatterns", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: "@/lib/*",
      }),
    ).toThrow("actionPatterns must be a list");
  });
});
