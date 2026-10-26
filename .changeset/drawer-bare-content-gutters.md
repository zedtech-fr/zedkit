---
"@zedtech/zedkit-ui": patch
---

Drawer: content composed without `DrawerHeader`, `DrawerBody`, or `DrawerFooter` (a bare form, text, a list) now keeps the shared side gutters and clears the bottom safe area instead of touching the sheet edges. The slots carry `data-slot` markers. The admin dashboard demo and guide snippet compose the sheet with a handle, header, body, and footer.
