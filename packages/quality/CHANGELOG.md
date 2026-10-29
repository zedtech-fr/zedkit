# @zedtech/zedkit-quality

## 0.5.0

### Minor Changes

- d9da994: `uiPreset` flags arbitrary px/rem in className (`w-[13px]`, `gap-[0.75rem]`). Use the spacing scale (`w-4`, `gap-3`) or the type scale (`text-sm`). Radix CSS variables (`w-[var(--radix-*)]`) stay.

## 0.4.0

### Minor Changes

- 46c235e: `defineLayers` preset `feature-folders`: UI imports ports, adapters are injected at the composition root, model is pure.
- 4cf76ea: `uiPreset` flags explicit `any` (`@typescript-eslint/no-explicit-any`). Name the type, or use `unknown` and narrow. Inline `style` was already banned.
- 0f2db66: `uiPreset` caps UI files at 300 lines and functions at 60. Inline `style` was already banned.
- d074cfd: UI hosts take `ref` as a prop (`ComponentProps<"el">`) and set `data-slot` on each exported root. The quality preset flags `forwardRef` and points at `packages/ui/src/button.tsx`. Upgrade notes: docs/migrations/ui-ref-and-messages.md.

### Patch Changes

- 7f8bfbe: Lint messages include the charter rule id and the explanation; they no longer point at the charter file.

## 0.3.2

### Patch Changes

- 2a0b658: `defineLayers` accepts an empty `actionPatterns` (views may legitimately import data): the view ban is omitted instead of emitting an invalid empty group.

## 0.3.1

### Patch Changes

- e7f0312: Promote the three catalog needs to beta (tested, documented, reviewed) and lock beta example evidence.

## 0.3.0

### Minor Changes

- c0f4692: `defineLayers` accepts `extraPatterns` (`{ kitScope?, viewData?, dataUi? }`) so consumers can add their own `no-restricted-imports` bans without replacing the preset blocks.

## 0.2.0

### Minor Changes

- 8e983cc: Initial release: shared quality setup (UI lint preset, layer boundaries, strict tsconfig base).

### Patch Changes

- e051e19: Config-only package: exports map to committed source (no build step, declared `zedkit.noBuild`), and the repo dogfoods the preset from its own root config.
