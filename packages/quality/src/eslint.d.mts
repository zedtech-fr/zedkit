import type { Linter } from "eslint";

export interface UiPresetOptions {
  /** Path to the repo's Tailwind CSS entry. Required, no default. */
  readonly entryPoint: string;
}

export function uiPreset(options: UiPresetOptions): Linter.Config[];

/** A `no-restricted-imports` pattern object, passed through untouched. */
export interface RestrictedImportPattern {
  readonly group: readonly string[];
  readonly message: string;
  readonly importNames?: readonly string[];
  readonly allowTypeImports?: boolean;
}

export interface DefineLayersOptions {
  /** UI kit specifier (e.g. `@acme/ui`). */
  readonly kitPackage: string;
  /** Minimatch globs for view folders. */
  readonly viewDirs: readonly string[];
  /** Minimatch globs for data-access folders. */
  readonly dataDirs: readonly string[];
  /** Import specifiers for data clients and server actions. */
  readonly actionPatterns: readonly string[];
  /**
   * Consumer bans merged into each block's own patterns (flat-config
   * rules replace per key, so a consumer block setting
   * `no-restricted-imports` would otherwise drop these).
   */
  readonly extraPatterns?: {
    readonly kitScope?: readonly RestrictedImportPattern[];
    readonly viewData?: readonly RestrictedImportPattern[];
    readonly dataUi?: readonly RestrictedImportPattern[];
  };
}

export function defineLayers(options: DefineLayersOptions): Linter.Config[];
