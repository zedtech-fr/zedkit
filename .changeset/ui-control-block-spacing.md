---
"@zedtech/zedkit-ui": patch
---

Control height and `py-control-block` aliases now follow `--spacing`. Mist stays 0.25rem / 2.25rem. Other looks get denser or roomier fields (Volt 32px, Maison 43px on desktop). Coarse/narrow viewports still clamp height to the 44px tap min. Leftover rem aliases (`px-button-inline*`, `gap-button-gap`, …) still do not follow `--spacing`.
