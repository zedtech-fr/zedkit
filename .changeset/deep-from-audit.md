---
"@zedtech/zedkit-ai": patch
---

Deepen `from-audit`: the skill now builds a persisted coverage map per audit family, reconciles every item (kept, dropped, spike-owned, decision-owned, or missing), and dives family by family until a pass adds nothing new. Claims without a `file:line` get a named verification path instead of demotion to a bundled spike, spikes carry one question and a filed output, and the plan passes a challenge gate before it can be reported.
