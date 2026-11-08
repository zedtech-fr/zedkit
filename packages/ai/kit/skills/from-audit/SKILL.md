---
name: from-audit
description: "Turn an existing audit into a revalidated, actionable plan: challenged tasks with acceptance criteria and verification, split into implementation, research spikes and owner decisions. Use when the user has an audit (file, paste, or report) and wants work the codebase actually supports."
disable-model-invocation: true
---

Turn an existing audit into an actionable plan the repo can actually do.
Do not implement by default: the plan is the deliverable. When the user has
already authorized implementation in this conversation ("implement the
findings", an approved plan), honor that authorization after planning —
do not add a redundant confirmation step.

Unless this brief already contains `Playbook: from-audit` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: from-audit` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## Process

1. **Read the audit.** Path, paste, or `$ARGUMENTS`. List each finding as a
   claim (what, where, kind, severity). If there is no audit, stop and
   point at `to-audit`.
2. **Revalidate against the current state.** Audits go stale. For every
   claim, open the cited files (`ground-truth`, `explorer`) and check
   history since the audit: already fixed, already filed, or code moved.
   Drop or downgrade anything the current code does not support. A claim
   with no `file:line` (or cited external source) is not a task. Rank what
   remains by blast radius.
3. **Deduplicate and find dependencies.** Merge claims that are one
   underlying problem. Check the tracker and existing plan artifacts
   (`.scratch/<slug>/issues/`, open issues/PRs) so retained work extends
   them instead of generating an overlapping second plan. Name blocking
   edges between tasks.
4. **Draft the plan.** For implementation tasks, borrow the slicing and
   ticket shape from `to-tickets` (vertical slices, blocking edges,
   what / problem / fix / if-skipped) — drafting or reusing tasks only.
   Its quiz-for-approval and publish steps are not automatic here: skip
   the quiz when a breakdown is already approved or implementation is
   already authorized, and carry that approval through instead of
   re-asking; publish tickets only when the user asked for tickets, not
   when they asked only for a plan. State the destination you used.
   Keep three kinds distinct — never dress one as another:
   - **Implementation task** — outcome, affected area, acceptance
     criteria, and the verification that proves it.
   - **Research spike** — the question, what evidence closes it, timebox.
   - **Owner decision** — the choice, options, and what each costs; the
     agent does not decide it.
     Default home: the configured tracker; else `.scratch/<slug>/issues/` —
     git-ignored, never `docs/`. Reuse the audit's own slug/folder when it
     has one. High-quality means a newcomer can start from the task alone.
     After writing, search the plan for every phrase this turn withdrew. A
     withdrawn rule left as a current instruction fails the plan. A
     "blocked by" edge that disagrees with the order arrow fails it too.
     When the plan contradicts a loaded file (a skill, a package
     `AGENTS.md`, or a check's success message), that file is task 1, not
     a follow-up after merge. A gitignored plan does not reach the next
     session. Name the loaded file.
5. **Report.** Kept (as tasks, spikes, decisions), dropped (with why:
   unsupported, already fixed, duplicate), and anything the revalidation
   could not settle. Evidence is `file:line`.
6. **Implement only if authorized.** When the authorization above holds,
   hand the retained implementation tasks to `implement` in dependency
   order and say which spikes/decisions still block the rest. Without it,
   stop at the plan and name the next command (`/implement`).

Do not invent findings the audit did not state unless the code contradicts
the audit — then say so, and still do not silently expand scope.
