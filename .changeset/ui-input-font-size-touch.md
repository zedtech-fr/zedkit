---
"@zedtech/zedkit-ui": patch
---

Keep text fields at 16px or larger on touch and phone-width screens so iOS Safari no longer zooms the page when an `Input`, `Textarea`, `Select` trigger, `SecretField` or `DataTable` filter gets focus. Fields now read the new `--zk-input-font-size` token through the `text-control` utility; desktop keeps 14px.
