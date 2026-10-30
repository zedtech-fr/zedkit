---
"@zedtech/zedkit-ui": minor
---

Preset switches no longer destroy custom identity work: `applyIdentity`
parks the stored custom sheet (it is scoped to one look, so it stays inert
under other looks and applies again on switch-back, matching the boot
script after reload) instead of deleting it. Explicit resets use the new
`discardCustomIdentity` export. A look-less `applyCustomIdentity` now
scopes its sheet to the `custom` look instead of writing unscoped `:root`
CSS.
