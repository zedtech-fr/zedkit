---
"@zedtech/zedkit-ai": minor
---

`route` prints the id the tool lists: on Cursor a base `model` plus the cell's `effort` becomes the thinking variant (`max` is `xhigh`); composer, Muse and other providers stay bare, and ids that already carry a level are kept. Changing `effort` with `model` held constant now changes what a spawn runs. Cells and the `setup-ai` stub now take a base id plus `effort`. Cutover: upgrade the kit before writing bare cells (an older kit prints the bare id), and strip `-low`, `-medium`, `-high` or `-xhigh` from an existing cell to re-enable its `effort`.
