---
name: to-audit
description: "Competitive high-quality audit of a topic from questions, doubts, or an unclear plan. Use before /plan when the starting facts are not solid, or when the user wants an audit rather than a spec."
disable-model-invocation: true
---

When the topic is unclear, contested, or a plan would guess: audit first.
Do not implement. Do not file tickets unless asked (that is `from-audit`).

Unless this brief already contains `Playbook: to-audit` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: to-audit` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

<!-- if:skill=audit -->

Run it as an `audit` in investigate mode, scoped to the topic: the coverage
map, evidence bar, finding kinds and completion bar live in `audit` — apply
them, do not restate a weaker local version. What differs here is the frame:
<!-- /if -->

## Process

1. **Frame.** Restate the topic and what "good" looks like for this job:
   the repo's `AGENTS.md` and domain files, plus how a strong implementation
   of the same job is shaped (structure and craft only — no private names).
   Build the coverage map from the user's questions and doubts: one row per
   question to settle, with the evidence that would settle it. Never shrink
   the stated objective to the rows that are cheap to check.
2. **Read and research.** Code and docs (`explorer`, `ground-truth`), and
   external primary sources where a row needs them (`research`). Cite
   `file:line` or the source. Unverified stays labelled.
3. **Compare.** What the repo does, what it claims, what a strong version of
   this job does. Rank gaps by blast radius. Drop claims the evidence does
   not support.
4. **Report.** Findings split by kind (verified defect, requirement gap,
   design judgment, opportunity) with evidence, dropped claims, unresolved
   questions, `Not checked:`. Partial coverage is labelled partial — every
   coverage row is answered or listed unresolved. If the user wants work
   next, name `from-audit` or `plan` — do not start them unless asked.

Use this before `plan` when assumptions would be guesses, or when the user
brings questions and doubts rather than a spec.
