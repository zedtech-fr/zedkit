---
"@zedtech/zedkit-ai": patch
---

Warn on leftover kit command stubs (exit 0) and let `sync --prune` remove those whose bytes still match the current kit file, without deleting user-edited provider copies.
