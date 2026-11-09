---
name: plan
description: "Single entry point for planning work: verifies the starting facts, writes the spec and tickets at the right size, then challenges the result. Use before implementing anything non-trivial."
---

One command for "plan this". Research first, write the plan at the right
size, then attack it before anyone codes.

Unless this brief already contains `Playbook: plan` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: plan` and stop. Sibling
entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## 1. Research

Apply `ground-truth`: open the code, docs, CI and history the plan will rely
on; every claimed fact cites its source. Unverified items stay labelled.

## 2. Write it down

Small task: a short spec via `to-spec`. Multi-step: `to-spec`, then `to-tickets`
with blocking edges. Bigger than one session: `wayfinder`, decision tickets
first. Plan may self-invoke; `implement`, `to-spec` and `to-tickets` never do —
the user or the orchestrator calls them (`/implement`, or the skill by name).
Default home: the configured tracker; else `.scratch/<feature-slug>/spec.md`
and `.scratch/<feature-slug>/issues/` — git-ignored, never `docs/`. Amend, don't
fork; persist by default per handoff's Durable deliverables section (chat links
files; explicit `chat-only`/`no-write` stays in chat).

A `### Assumptions` table is mandatory. For every undefined term or ambiguous
requirement, state what you assume and whether it might not hold: inputs /
missing fields; concurrency, retries, idempotency; failure modes; freshness
of state; what "done" means. If an assumption would change the design, ask.
A plan without this table is a draft; `challenge` treats it as **BLOCKING**.

## 3. Ladder per planned piece (mandatory)

One row per file, module, dependency, or script (`ponytail-review`): need to
exist? in this codebase? standard library? native platform feature or a
standard tool? installed dependency? one line? else the minimum code that
works. Stop at the first rung that holds. No ladder table → draft.

## 4. Challenge

Run `challenge` (`Playbook: challenge`) on the finished plan. Unchallenged
plans are drafts: fix what it finds, then re-plan only what changed.

## 5. Stakes and kind

Put `Stakes: trivial|standard|sensitive|critical` at the top (`standard` when
unsure). Stakes only go up (`Stakes raised: <old> -> <new>: <reason>`). Auth,
secrets, tenancy, user data, money, data loss, public API or release start at
`sensitive`; irreversible or multi-tenant exposure at `critical`. Each agent
step: `Kind: decide|design|build|check` and optional
`Needs: reasoning=low|medium|high, context=small|medium|large`. Read gates
with `zedkit-ai stakes <plan file>`.
