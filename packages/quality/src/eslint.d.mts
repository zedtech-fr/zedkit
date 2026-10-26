import type { Linter } from "eslint";

export interface UiPresetOptions {
  /** Path to the repo's Tailwind CSS entry. Required, no default. */
  readonly entryPoint: string;
}

export function uiPreset(options: UiPresetOptions): Linter.Config[];

export interface DefineLayersOptions {
  /** UI kit specifier (e.g. `@acme/ui`). */
  readonly kitPackage: string;
  /** Minimatch globs for view folders. */
  readonly viewDirs: readonly string[];
  /** Minimatch globs for data-access folders. */
  readonly dataDirs: readonly string[];
  /** Import specifiers for data clients and server actions. */
  readonly actionPatterns: readonly string[];
}

export function defineLayers(options: DefineLayersOptions): Linter.Config[];
