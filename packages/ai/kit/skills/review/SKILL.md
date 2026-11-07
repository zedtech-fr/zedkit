---
name: review
description: "Single entry point for reviewing a change: pins the diff once, runs the right review lenses in parallel subagents, dedupes and returns one verdict. Use when asked to review a branch, PR, commit range or work-in-progress."
---

One command for "review this". Pin the diff once, pick lenses, fan out, one
verdict.

Unless this brief already contains `Playbook: review` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: review` and stop. Sibling
entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## 1. Pin the diff

Resolve the fixed point (commit, branch, tag, `HEAD~N`; ask when missing) and
capture it once: `git diff <fixed-point>...HEAD` plus
`git log <fixed-point>..HEAD --oneline`. Fail fast here on a bad ref or an
empty diff — never inside the subagents.

## 2. Pick the lenses (route over `lenses.md`)

Read `lenses.md` (same folder). Minimum on every review:
`code`<!-- if:skill=ponytail -->, `ponytail`<!-- /if -->, `persona`, `quality gate`. Add each lens whose Trigger
matches the pinned diff. A `planned` runner reports skipped-planned (not a
blocker); skipping a mandatory lens whose runner exists IS a blocker.

## 3. Fan out

One subagent per lens, in parallel (`parallel-work`); inline when the diff is
a few lines. Route each spawn with
`zedkit-ai route <agent> --kind check --stakes <s>` and pass that model id
exactly. Do not substitute the parent model, another family, or a fast mode.
If the cell is missing or `inherit`, do not spawn. A fast mode is allowed
only when the user explicitly requested it in this request. A `check` spawn is read-only: compare `git status --porcelain`
before and after. Every brief is self-contained: the diff command, the lens
skill, `ground-truth` — a finding without `file:line` is not a finding. When
the change implements a plan with a ladder table, verify the table against
the diff<!-- if:skill=code-review --> (brief `code-review`)<!-- /if -->.

## 4. Merge

Dedupe, rank by severity, one verdict: ship, fix-then-ship (list blockers),
or rework. Open with the lenses-run table (every lens: ran or skipped +
reason). Then a second independent `check` spawn (not the synthesizer) reads
the ranked findings against the pinned diff; it may only drop or demote.
Blockers that do not survive that pass are not blockers.

## 5. Turn the miss into a rule

Every miss becomes a rule: lint rule, a test, or an AGENTS.md line; file it
or add it in this change when trivial. A fix without its rule is incomplete
until the rule exists or is filed. Carry `Stakes:` from the plan.
