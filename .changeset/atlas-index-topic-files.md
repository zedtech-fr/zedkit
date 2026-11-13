---
"@zedtech/zedkit-ai": patch
---

`checkAtlas` warns (validate exit 0) when `.agents/atlas.md` exceeds 24 KB or a Where row exceeds 280 characters, and follows linked `.agents/atlas/<topic>.md` files so extracted traps keep path checks. The 150-line cap is still a failure.
