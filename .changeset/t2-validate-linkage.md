---
"@zedtech/zedkit-ai": patch
---

Prove the T2 close-out linkage end to end: a fresh `setup` tree passes `validate` green while the same tree's installed `setup-log.template.md` requires the five verification states and records functional acceptance as its own `UNVERIFIED` outcome, never covered by a green `validate`.
