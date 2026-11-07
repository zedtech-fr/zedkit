---
name: fix
description: "Fix one defect or one small change inline, with its check. Use when the user asks to fix a bug, a broken command, or a single contained correction. Multi-step work uses /plan."
disable-model-invocation: true
---

Fix one thing. Stay in this conversation. Do not hand it to `orchestrate`.

If the ask is several features, a design choice, or more than one reviewable change, stop and point at `/plan`. Do not start that work.

## Process

1. **Name the defect** in one line, and the check that will show it is gone.
2. **Confirm it** in the current code (`ground-truth`, `file:line`) before editing. If the code already does the right thing, say so and stop.
3. **Climb the ladder** (`ponytail-review`): need, already here, standard library, platform, dependency, one line, else the minimum.
4. **Change the root once.** Grep callers of what you touch. Add or adjust the test that fails on the old behavior.
5. **Run the check** from step 1, or that area's cheap loop. Record the command and the result.
6. **Encode** a reusable miss with `rules-upkeep` in the same turn. Close with `Rules: none` or `Rules: <file> — <change>`.

A fix that grows past one reviewable change stops. Name the rest. Do not start it.
