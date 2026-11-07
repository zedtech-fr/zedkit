---
name: challenge
description: "Pre-implementation attack on a plan: ranked objections plus domain and design checks. Use after planning and before writing code."
---

One command for "is this plan sound". It tries to kill the plan before the
plan wastes implementation effort.

Unless this brief already contains `Playbook: challenge` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: challenge` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## Process

1. Run the `skeptic` subagent (angle: plan) on the plan: needed parts
   only, verified claims, production failure modes. Ranked objections, no
   code. Reject a plan whose ladder table is missing or weak. **BLOCKING**
   if the `### Assumptions` table is missing.
2. Check the domain language with `domain-modeling` (terms sharp, glossary
   and ADRs current) and the module shape with `codebase-design` (deep
   modules, seams in the right place).
3. Merge into one list: objections ranked by blast radius, each with the fix
   or the question that resolves it. Verdict: proceed, amend, or replan.
