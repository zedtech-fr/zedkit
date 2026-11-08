---
name: orchestrate
description: "Hand a task to the orchestrator: read tokenomics, pick a build team, dispatch playbooks. Default path when the request is deep (search, inventory, audit, plan, review, implement, research) or spans more than one skill. Not for one named defect."
---

Hand the task to the **`orchestrator`** subagent with the user's text, any
`Playbook: <name>` an entrypoint set, repo state you already know, success
criteria, and the task's `Stakes:` (and any `Needs:`). Tell it to read
`.agents/tokenomics.md` and answer **Build team: what do I need for this request?** before any spawn. A named playbook is the job — do not substitute
another. Every spawn is routed with the local `zedkit-ai route <agent> --kind
<how it is used now> --stakes <s> --provider <active-tool>` CLI — always pass
`--provider` for the tool running this session (the repo default does not
decide the model when the session tool differs from it, for example a Muse
session in a Cursor-default repo) and check the printed `provider:` matches
the active tool before spawning. Use the installed version-locked CLI; build
from the pinned kit commit first only when working from zedkit sources.
Record the CLI version and the pinned commit in the report — never an
unpinned `npx` download: the orchestrator itself as `decide`, planners as
`design`, implementers as `build`, reviewers as `check`. Passing the cell's
model id exactly means the spawn tool's model parameter, not pasting the id
into brief text. Do not substitute the parent model, another family, or a
fast mode. If the CLI is missing, read the same cell from
`.agents/tokenomics.md`. If the cell is missing or `inherit`, or the tool has
no model parameter, do not spawn. Pass `--allow-fast` only when the user
explicitly requested fast mode in this request. If the tool rejects the id,
stop and report the cell. That is not the unavailable-subagent case: do not
continue inline and do not write a dispatch plan for that spawn.

If subagents are unavailable, return ready-to-run briefs (`dispatch plan`)
when a capable caller can run them; otherwise follow the same steps yourself
in this conversation (the steps live in `agents/orchestrator.md` only — do not
copy them here) and open your report with
`Mode: inline fallback (<observed cause>)`.
