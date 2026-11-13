---
"@zedtech/zedkit-ui": patch
---

Non-modal bottom and top Drawers swipe shut from the handle (tap or drag) and from the sheet body when it is not scrolled (about 20% of the panel height). Left and right drawers do not swipe. Reduced motion skips the slide; Escape and Close still close the sheet.

`identityContrastWarnings` no longer treats a decorative `--border` separator as a 3:1 failure (WCAG 1.4.11 does not require that). Text pairs still need 4.5:1 and accent (focus ring) still needs 3:1.
