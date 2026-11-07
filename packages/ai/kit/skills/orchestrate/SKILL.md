---
name: orchestrate
description: "Hand a task to the orchestrator: read tokenomics, pick a build team, dispatch playbooks. Default path for plan, review, implement, audit and research entrypoints."
---

Hand the task to the **`orchestrator`** subagent with the user's text, any
`Playbook: <name>` an entrypoint set, repo state you already know, success
criteria, and the task's `Stakes:` (and any `Needs:`). Tell it to read
`.agents/tokenomics.md` and answer **Build team: what do I need for this request?** before any spawn. A named playbook is the job — do not substitute
another. Every spawn is routed with
`zedkit-ai route <agent> --kind <how it is used now> --stakes <s>`: the
orchestrator itself as `decide`, planners as `design`, implementers as `build`,
reviewers as `check`.

If subagents are unavailable, return ready-to-run briefs (`dispatch plan`)
when a capable caller can run them; otherwise follow the same steps yourself
in this conversation (the steps live in `agents/orchestrator.md` only — do not
copy them here) and open your report with
`Mode: inline fallback (<observed cause>)`.
