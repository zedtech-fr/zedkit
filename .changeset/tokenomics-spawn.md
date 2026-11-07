---
"@zedtech/zedkit-ai": minor
---

A spawn follows the cell in `.agents/tokenomics.md` and does not substitute another model. `zedkit-ai route` refuses a fast model id unless `--allow-fast`, which is only for a request that explicitly asked for fast mode.

Migration: a fast cell used to resolve to a route -> it now exits 2 unless `--allow-fast`.
