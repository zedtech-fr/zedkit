---
"@zedtech/zedkit-ui": patch
---

Soft-warning badges use `--warning` ink on the 15% wash so 12px caption text stays 4.5:1. On Mist (the default look), filled warning pills in light mode get a darker fill with light ink, and in dark mode a lighter fill with dark ink. Light `--success` and `--destructive` step darker, and dark `--destructive` steps lighter, so soft-success and soft-danger stay 4.5:1 on that same wash. Glass, Press, Tide, Volt, and Maison light `--warning` moves the same way. DataTable shrinks inside a flex parent so nowrap columns scroll in the table instead of stretching the page, and pagination wraps when the row is too narrow.
