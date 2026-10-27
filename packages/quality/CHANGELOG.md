# @zedtech/zedkit-quality

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
