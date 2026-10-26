import type { Linter } from "eslint";
import { defineLayers, uiPreset } from "#index.mjs";

// Exercises the shipped .d.mts: this file must typecheck.
export const preset: Linter.Config[] = uiPreset({ entryPoint: "/repo/app/globals.css" });

export const layers: Linter.Config[] = defineLayers({
  kitPackage: "@acme/ui",
  viewDirs: ["app/**/ui/**"],
  dataDirs: ["lib/**"],
  actionPatterns: ["@/lib/*"],
});
