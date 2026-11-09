---
"@zedtech/zedkit-ai": patch
---

Add a scripted kit inventory (`node packages/ai/scripts/kit-inventory.mjs`) that keeps three figures apart: a deterministic repo-derived inventory (skill/agent/command names, file and word counts), the maintenance burden (derived files with their regen commands), and observed session cost from an explicit `--session-log` (per-tool started/terminal counts, unknowns kept apart). Without a log the session status is `unavailable` — transcript figures are never quoted and inventory counts never stand in for observed cost.
