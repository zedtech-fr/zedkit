---
"@zedtech/zedkit-ai": patch
---

Warn on leftover kit command stubs (exit 0) and let `npx @zedtech/zedkit-ai sync --prune --provider …` remove those whose bytes still match the current kit file, without deleting user-edited provider copies.
