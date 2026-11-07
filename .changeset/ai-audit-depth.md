---
"@zedtech/zedkit-ai": patch
---

Make `audit` a thorough, persistent investigation: a coverage map built from the actual request, evidence traced from source through shipped artifact to consumer behavior, external primary sources where they settle a row, findings split into verified defects, requirement gaps, design judgments and opportunities — each with an acceptance criterion — and a completion bar that labels partial coverage partial. `audit` investigates read-only by default and runs its fix loop only when the same request asks for fixes. `from-audit` now revalidates findings against the current state (already fixed, already filed, moved), deduplicates, and produces an actionable plan split into implementation tasks, research spikes and owner decisions; it implements only when the conversation already authorized it. `to-audit` reuses the same coverage and evidence bar, and orchestrator audit briefs now carry the coverage map and the go-deep instruction.
