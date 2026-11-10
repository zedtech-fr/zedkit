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

1. **Read the audit; build the Coverage map.** Prefer the saved audit file
   (same slug/folder) when one exists — continuity per handoff's Durable
   deliverables section — else path, paste, or `$ARGUMENTS`. If there is no
   audit, stop and point at `to-audit`. Enumerate every family or section
   and, inside it, every numbered item, table row, rule and change bullet,
   each as a claim (what, where, kind, severity) carrying its family and
   item number. Persist the map in the plan artifact as the resume point
   and reopen it instead of restarting. Done when every family has at
   least one item; a family with none fails this step.
2. **Revalidate against the current state, per family.** Audits go
   stale. Families are independent by default: run the per-family passes
   in parallel, one leaf per family (`explorer` through `orchestrate`,
   in waves of at most six) when the tool offers spawns. Each leaf
   returns its family's disposition table. Sequential is the exception:
   only where a dependency between families requires an order, or no
   spawn is available — then say which and why. Per family, open the cited files
   (`ground-truth`, `explorer`) and check history since the audit:
   already fixed, already filed, or code moved. Verification path, not demotion: a claim with no
   `file:line` (or cited external source) gets the exact check that would
   settle it — a render, a measurement, an external lookup — named in the
   plan; it only leaves this step as the spike that runs that check, with
   its would-be task already drafted and blocked by the spike. Per family,
   revalidate, dedupe within the family, name its dependencies and
   classify each item, then repeat until a full pass adds nothing new.
   Done per family when each item is kept, dropped with a reason,
   spike-owned or decision-owned, with evidence. A family whose pass
   did not run stays `not checked` and the plan stays partial; it is
   never absorbed by a sibling family's result.
3. **Deduplicate and find dependencies.** This synthesis runs once,
   after every family has reported. Merge claims that are one
   underlying problem once across families on the labelled items. A merge never deletes a number: record it as
   `merged into <task> (from <family>#<n>, …)`. Check the tracker and
   existing plan artifacts (`.scratch/<slug>/issues/`, open issues/PRs) so
   retained work extends them instead of generating an overlapping second
   plan. Name blocking edges between tasks. Rank what remains by blast radius.
4. **Draft the plan.** For implementation tasks, borrow the slicing and
   ticket shape from `to-tickets` (vertical slices, blocking edges,
   what / problem / fix / if-skipped) — drafting or reusing tasks only.
   Its quiz-for-approval and publish steps are not automatic here: skip
   the quiz when a breakdown is already approved or implementation is
   already authorized, and carry that approval through instead of
   re-asking; publish tickets only when the user asked for tickets, not
   when they asked only for a plan. State the destination you used.
   Every task, spike and decision carries its family and item number.
   Keep three kinds distinct — never dress one as another:
   - **Implementation task** — outcome, affected area, acceptance
     criteria, and the verification that proves it.
   - **Research spike** — One question per spike: the question, what
     evidence closes it, timebox, and the single task or decision it
     feeds, filed in this same plan and blocked by the spike.
   - **Owner decision** — the choice, options, and what each costs; the
     agent does not decide it.
     Preserve what the audit already decided: strengths become a
     do-not-regress guardrail on the nearest task, proposed wording is
     carried as acceptance wording, success criteria become release gates
     at the head of the plan. The sequencing skeleton is the audit's own
     roadmap (effort as S/M/L, blockers first, then week-1, then
     month-1); each deviation is justified per item.
     Default home: the configured tracker; else `.scratch/<slug>/spec.md`
     beside its `issues/` — git-ignored, never `docs/`. Reuse the audit's
     own slug/folder when it has one; amend that artifact instead of forking
     a second one. High-quality means a newcomer can start from the task alone.
     Persist by default per handoff's Durable deliverables section: chat summarizes
     the outcome and links the saved files.
5. **Challenge gate, then self-check.** Run `challenge` (skeptic, angle:
   plan) on the drafted plan and fix what it finds, re-planning only what
   changed. Then check: per family,
   `items = kept + dropped + spike-owned + decision-owned + missing`,
   and `missing` must be 0 or each missing item named with why; every
   spike's output is filed; every "blocked by" edge agrees with the order
   arrow. Self-check failures are reported, not fixed only in chat. After writing, search the plan for every phrase this turn withdrew. A
   withdrawn rule left as a current instruction fails the plan. When the plan contradicts a loaded file (a skill, a package
   `AGENTS.md`, or a check's success message), resolve the contradiction
   from the authorized decisions, then place that file in the order
   those decisions imply: an obsolete execution rule is a prior task; a
   description of current behavior the plan will change lands with that
   change. Name the loaded file. A gitignored plan does not reach the
   next session. An unchallenged plan's header reads `draft`; an
   unbalanced plan is not reportable.
6. **Report.** Per family: kept (as tasks, spikes, decisions), dropped (with why:
   unsupported, already fixed, duplicate), spike-owned, decision-owned, and
   anything the revalidation could not settle. Evidence is `file:line`.
7. **Implement only if authorized.** When the authorization above holds,
   hand the retained implementation tasks to `implement` in dependency
   order and say which spikes/decisions still block the rest. Without it,
   stop at the plan and name the next command (`/implement`).

Do not invent findings the audit did not state unless the code contradicts
the audit — then say so, and still do not silently expand scope.
