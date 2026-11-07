---
name: quick-wins
description: "Find or ship small, worthwhile improvements inside one topic, in two modes: audit (evidence-backed findings, nothing changes) and implement (revalidate, then ship a small coherent batch). Use when asked for quick wins, low-hanging fruit or cheap improvements in a named scope; audit is the default."
disable-model-invocation: true
---

Two modes over one topic. **audit** finds quick wins and changes nothing.
**implement** ships them. Usage: `/quick-wins audit <topic or scope>` and
`/quick-wins implement <finding ids, report path, ticket refs or topic>`.

One defect with a known check is `/fix`: it stays in the conversation and does not go through `orchestrate`. This skill is the two-mode workflow for one topic.

Unless this brief already contains `Playbook: quick-wins` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: quick-wins` and stop. Name
this `SKILL.md` in the brief, so an orchestrator whose table predates
`quick-wins` still reads the steps.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

## Mode

The first word after the command picks the mode: **audit** or **implement**.
No mode word means audit, unless the text is an explicit request in plain
words to do the work ("ship QW-…", "fix the findings in …"). A question or a
doubt stays audit; when unsure, audit. Open the reply with the mode and the
topic in one line.

An explicit **implement** authorizes discovery and implementation inside the
named scope, with no approval round per ordinary, reversible fix. It does
not authorize anything outside the scope, or anything the orchestrator's
limits reserve (force push, delete, publish, merge, secrets, deploy): ask
once, then continue with what is independent. No topic and no usable
context: ask one question for the scope, nothing else.

## What counts as a quick win

All four, or it is not one: a **beneficiary** you can name (user, developer,
downstream consumer); an **observable improvement** (a before and after
someone can see); a **contained change** (one reviewable change, with the
callers and contracts it touches known); a **practical acceptance check** (a
command, interaction or inspection that shows it worked).

Size the whole effort, not the diff: investigation, implementation,
validation, docs, migration, coordination. A one-line change to a public
contract, a default or shared config is not small.

## Audit

Read-only. Take a snapshot before and after: `git status --porcelain` plus
`git diff HEAD | sha256sum` (outside git, a hash of the file list and sizes).
They must match; this detects a write, it does not prevent one. A check that
needs generated files (install, build, codegen) runs in a throwaway copy or
temp directory, removed afterwards. Nothing is saved unless asked.

1. **Frame.** Restate the topic, who benefits, and what better looks like.
   Use the repo's own commands and conventions (`AGENTS.md`, CI config), not
   a stack you assume.
2. **Start narrow.** Entry points of the scope, their contracts (types,
   schemas, docs, config, commands) and the checks that already guard them.
   Widen only for a concrete reason: a dependency you cannot judge, a
   failure, an open uncertainty. Write the reason beside the evidence
   (`Expanded: …`). Apply `ground-truth`: cite `path:line` or command output.
3. **Label evidence.** `reproduced` (you ran it and saw it), `observed` (read
   in code, docs or config), `hypothesis` (not yet seen). A hypothesis is
   never a finding: it goes under its own heading with the check that would
   settle it.
4. **Filter and size.** Apply the four tests and the whole-effort estimate;
   what fails goes under Not quick wins.
5. **Rank.** By reach of the beneficiary and strength of evidence, against
   whole effort and risk. Say why in one line per finding.

Report a short set: the top seven at most, saying how many were cut and that
a narrower scope would help. Nothing worthwhile: say exactly
`No worthwhile quick wins found in this scope`, then what you examined and
the checks you ran. Do not pad.

```
## Quick wins: <topic> (audit)
Scope: <paths, entry points> · Looked at: <what, checks run> · Expanded: <reason or none>

### Findings (ranked)
**QW-<topic>-<subject>** <one-line problem>
- Problem: <observed> (reproduced | observed)
- For whom: <beneficiary>
- Evidence: <path:line or command -> result>
- Change: <proposed, contained>
- Depends on: <QW-ids, external, or none>
- Effort / risk: investigate S · implement S · validate S · docs S · migrate none · coordinate none; risk: <compat or behavior>
- Accept when: <check -> expected result>
- Why this rank: <one line>

### Hypotheses (not findings)
<claim; the check that would settle it>

### Not quick wins (the three that matter most)
<one line each: why, and where it goes: `plan`, or a ticket>

### Run
<spawns, fallbacks, usage; see Specialists>
```

The id is `QW-` plus a slug of the topic and the affected artifact, never the
rank, so a re-audit keeps it; add a number only on a collision.

The closing check of an audit is the snapshot comparison plus opening each
cited `path:line` once. An audit built nothing, so it closes without a
`verifier` spawn.

Saving is on request only: a report goes to `.scratch/quick-wins/<topic>.md`
(git-ignored). For tickets, hand the report to `from-audit` (it challenges
each finding against the code and files tickets in the configured tracker,
else `.scratch/`), keeping each finding's id in the ticket title. The workflow
needs no tracker.

Which audit: `/to-audit` answers an open question; `/quick-wins audit` finds
small shippable wins in one scope.

## Implement

Input: finding ids with their report (path, paste, ticket), or a topic. A
topic with no prior audit runs the Audit steps first, in the same turn.
Before any edit record `git status --porcelain`: what is dirty now is not yours.

1. **Revalidate each finding at HEAD before any edit.** Re-open its
   evidence; check `git log` since the report, whether it is already fixed,
   whether an open branch, PR or ticket overlaps it, and how candidates
   depend on each other. Outcome: `valid`; `resolved` (drop, say so);
   `changed` (restate, keep if still a quick win); `expanded` (step 3).
   Settle a `hypothesis` with one targeted check first.
2. **Pick the batch.** A small coherent set that lands as one reviewable
   change (size zones in `definition-of-done`), ordered by dependencies.
   The rest is `deferred`: listed, not dropped. A finding whose files were
   already dirty at the start is `deferred` too: ask once, never edit over
   someone's work in progress.
3. **Expanded or oversized.** A candidate that needs a broad migration, a
   consequential product decision or materially more work than sized: stop
   that one, write what the discovery was and what it needs, carry it into
   `plan` (`Playbook: plan`). Continue with independent candidates.
4. **Plan the batch at the right size.** `Stakes:` as `plan` sets them, never
   lowered; a `### Assumptions` table; one ladder row per piece
   (`ponytail-review`); the acceptance checks. Run `challenge` once for the
   batch (`Playbook: challenge`): one inline pass at `trivial` or `standard`;
   add `skeptic` for a named uncertainty or at `sensitive` and up.
5. **Build** with `implement` (`Playbook: implement`). Reuse existing logic;
   keep supported callers, customized setups and the compatibility contracts
   the finding names working. Where a contract is protected, write the
   behavioral regression test first (`tdd`), through the public entry point.
   `implement` ends with `definition-of-done` and `review`; that is the one
   review, so run no second one. Its depth follows the change (a few-line
   diff runs its lenses inline); `sensitive` and up is recorded, with the
   extra `critical` gates from the tokenomics.
6. **Validate** (below). Stage and commit by explicit paths, one commit per
   finding, after its check passes.

Why, for whom and how we will know are the finding's own `Problem`, `For
whom` and `Accept when`. Carry those three lines into the commit or PR body
and stop there.

## Validate

Run each finding's acceptance check through the entry point a real user
takes, not a stand-in. A shipped or copied artifact (component recipe,
template, config): use it in a consumer app and run the interaction. A CI
change: show which jobs run before and after, and that every required check
still runs for the affected paths. A tooling or setup change: install it into
a temp project and list what the tool actually discovers; every name resolves
once. Then the repo's cheap loop and the checks its `AGENTS.md` requires.

Run commands in the parent or agent that has a shell. Reviewers are read-only
and receive the resulting output pasted into the brief. One evidence line per
check: `<command or interaction> -> <observed result>`, or `not run: <reason>`.

Reply with a table:

| Finding | Reassessed | Implemented | Verified | Unresolved |
| ------- | ---------- | ----------- | -------- | ---------- |

Then **Pending**: reviews not yet run and human decisions still needed, each
visible. If a batch fails partway, finished findings stay committed and the
failing finding's own uncommitted edits are reverted, by path, and never a
path that was dirty at the start. The tree must build and pass its cheap loop
between findings.

## Specialists

Start with a focused investigation inline. Spawn only to resolve a named
uncertainty, and write one line first: **Question** (what is unknown),
**Expertise** (who is best placed in the installed roster), **Decision it
changes** (what you do differently). No line, no spawn. Independent questions
go out in parallel (`parallel-work`) with the evidence you already hold, so no
specialist re-investigates what another settled. Well-understood work stays
inline. Routing and limits are `orchestrate`'s; stakes follow the topic as
`plan` sets them, and a `sensitive` topic keeps its verdicts on `sensitive`
cells or above. This skill adds no limits, model choices or required team.

In the `Run` section list the actual spawns. When the runtime could not
honor a requested model, delegation or tool restriction, give the cell or
restriction asked for, what happened instead (slice done inline, spawn
skipped, ran on another model, restriction not enforced) and what that means
for the result. Label each usage figure `observed` (the provider showed it),
`estimate` or `unavailable`.
