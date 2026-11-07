---
"@zedtech/zedkit-ai": minor
---

Add `.agents/atlas.md`, a bounded lookup of where things live, the repo's words, exact commands and reasons. `init` and `setup` install an empty stub (never overwritten), `setup-ai` fills it from the reading log, and `rules-upkeep`, `improve-from-review`, `research` and `parallel-work` read it before searching and fix one row after a search or correction taught something. `validate` fails on an atlas past 150 lines or a Where row whose path is gone; `validate --setup` also needs the file and three Where rows.
