---
"@zedtech/zedkit-ui": minor
---

Non-modal bottom and top Drawers swipe shut from the handle (a drag toward the edge, not a tap) and from the sheet body on a fine pointer when it is not scrolled (about 20% of the panel height). Left and right drawers do not swipe. Touch body-drag is not supported; use the handle. Reduced motion skips the slide; Escape and Close still close the sheet.

`identityContrastWarnings` no longer treats a decorative `--border` separator as a 3:1 failure (WCAG 1.4.11 does not require that). Text pairs still need 4.5:1 and accent (focus ring) still needs 3:1. Compact token export splits `--input` from decorative `--border` and writes a 3:1 field border.

identityContrastWarnings token `border` is no longer emitted -> text/accent checks only (hairline `--border` exports that used to fail now pass).
