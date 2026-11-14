---
"@zedtech/zedkit-ui": patch
---

Non-modal handle swipe still closes the sheet when `DrawerContent` sets a custom `data-slot` (for example the docs identity dock). Lookup falls back to `role="dialog"`. Touch body-drag stays unsupported; use the handle.
