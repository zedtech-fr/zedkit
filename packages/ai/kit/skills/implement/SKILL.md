---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets. Read the saved plan first and keep its checklist current — continuity per handoff's Durable deliverables section; amend the artifact, don't fork it.

Unless this brief already contains `Playbook: implement` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: implement` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Refuse a missing or unchallenged plan: run `challenge` (or `plan`, when there is nothing yet) first, with `Playbook: challenge` or `Playbook: plan`.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

If the user does not name a ticket, task id, or phase, implement only the plan's first dependency-ready batch: the to-tickets frontier (tickets/tasks whose blockers are all done; for a from-audit handoff, the first tasks in its dependency order). Then stop and open the PR. Later batches wait for a new `/implement` call.

Before writing code, climb the `ponytail-review` ladder for every new piece
of code, file, or dependency — need to exist? in this codebase? standard
library? native platform feature or a standard tool? installed dependency?
one line? else the minimum code that works — and stop at the first rung that
holds. Stop and replan any piece where a higher rung holds.

Call the Skill tool with "tdd" where possible, at pre-agreed seams. Without a Skill tool, open that skill's `SKILL.md` under `.agents/skills/` and follow its steps in this conversation (same for repo-added skills; explicit-only skills still need an explicit user call).

<!-- if:skill=compose-ui -->

If the work composes, restyles or personalises UI, run `/compose-ui` first:
client business → personas → the client's customers → their personas → UI
choices. Do not edit UI until that brief exists.
<!-- /if -->

UI tickets carry a `States:` line (`to-tickets`); capture those states.

Styling classes follow `../setup-ai/design-policy.md` (role names, no scale steps). Do not restate it. The host's vocabulary wins.

Run typechecking regularly, single test files regularly, and the unit plus integration suites once at the end — never the end-to-end battery unless a critical path justifies it. When the diff adds or moves a routed or entry file, also run the area **build** from that area's AGENTS.md (`definition-of-done` names the cases). Typecheck does not load it. When shortening a check's output with a pipe, preserve its exit status (`set -o pipefail` under bash, or run the check through the `gate` wrapper and inspect its captured log): a passing pipeline must never mask a failing check — piping inside the gate does not itself preserve the status.

Then pass `definition-of-done`, and call the Skill tool with "review" to review the work (`Playbook: review`). Without a Skill tool, open that skill's `SKILL.md` under `.agents/skills/` and follow its steps in this conversation (same for repo-added skills; explicit-only skills still need an explicit user call).

Carry the ticket's `Stakes:` into the PR body, never lower it. Before each
spawn run `zedkit-ai route <agent> --kind <how it is used now> --stakes <s> --provider <active-tool>`,
adding `--reasoning <r>` or `--context <c>` when the step has a `Needs:` line.
Check the printed `provider:` matches the active tool before spawning.
If the tool lets a spawn override the model, pass the id it prints, exactly.
Do not substitute the parent model, another family, or a fast mode. A fast
mode is allowed only when the user explicitly requested it in this request.
If the tool cannot override the model, stop and say the cell was not applied.
Do not implement on the parent model. The user re-runs with a tool that
passes the cell, or explicitly asks to continue inline. `sensitive` or
higher makes `review` mandatory, and `critical` also needs a second
independent review and a `Human validation:` line.

Commit on a work branch. If HEAD is trunk or the host integration branch,
create a work branch from it before the first commit. After
definition-of-done, open a pull request against the integration branch
the host AGENTS.md names. Drafting a PR body is not that step.
