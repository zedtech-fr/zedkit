---
name: review
description: "Single entry point for reviewing a change: pins the diff once, runs the right review lenses in parallel subagents, dedupes and returns one verdict. Use when asked to review a branch, PR, commit range or work-in-progress."
---

One command for "review this". Pin the diff once, pick lenses, fan out, one verdict.

Unless this brief already contains `Playbook: review` or `Mode: inline fallback`, hand the user's text to `orchestrate` with `Playbook: review` and stop. Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## 1. Pin the diff

Resolve the fixed point (commit, branch, tag, `HEAD~N`; ask when missing) and capture it once: the pinned commit, `git diff <fixed-point>...HEAD` plus `git log <fixed-point>..HEAD --oneline`, and the local `zedkit-ai` CLI version (installed version-locked CLI, or built from the pinned kit commit when working from zedkit sources; never an unpinned `npx` download). Fail fast here on a bad ref or an empty diff — never inside the subagents.

## 2. Pick the lenses (route over `lenses.md`)

Read `lenses.md` (same folder). Minimum on every review: `code`<!-- if:skill=ponytail -->, `ponytail`<!-- /if -->, `persona`, `quality gate`. Add each lens whose Trigger matches the pinned diff. A `planned` runner reports skipped-planned (not a blocker); skipping a mandatory lens whose runner exists IS a blocker. UI class names: open `../setup-ai/design-policy.md`. Do not restate it.

## 3. Fan out

One subagent per lens, in parallel (`parallel-work`) in waves of at most 6; inline when the diff is a few lines. Route each spawn with the local `zedkit-ai route <agent> --kind check --stakes <s> --provider <active-tool>` CLI and check the printed `provider:` matches the active tool, then pass that model id via the spawn tool's model parameter — pasting the id into brief text is not passing it. Do not substitute the parent model, another family, or a fast mode. If the cell is missing or `inherit`, or the tool has no model parameter, do not spawn. A fast mode is allowed only when the user explicitly requested it in this request. On a capacity or contract rejection, queue the wave and wait with backoff; do not retry in a tight loop. A `check` spawn is read-only: compare `git status --porcelain` before and after. Every brief shares the same pinned context block verbatim (pinned commit, CLI version, owner decisions such as a v1 exception or an intentionally planned lens, proofs already acquired) plus the diff command, the lens skill, and `ground-truth` — a finding without `file:line` is not a finding; a provenance finding without an upstream source and diff comparison is not a finding (the PR description alone is not proof); the install precheck starts from `standard` then applies the call's needs and the agent's floors. When the change implements a plan with a ladder table, verify the table against the diff<!-- if:skill=code-review --> (brief `code-review`)<!-- /if -->.

## 4. Merge

Dedupe, rank by severity, one verdict: ship, fix-then-ship (list blockers), or rework. Open with the lenses-run table (every lens: ran or skipped + reason; a `planned` runner reports skipped-planned with its reason, never a blocker and never silent; a preset that omits a runner is a product choice to record, not an automatic blocker; cross-check the PR description and drop accusations the second pass already recalibrated). Then a second independent `check` spawn (not the synthesizer) verifies each ranked finding against the same pinned commit. It may keep a finding, drop it, or adjust its severity either way, and it says why. It stays inside the synthesis. A finding it drops is not a blocker. If that pass cannot run, say so: its absence does not drop blockers.

## 5. Turn the miss into a rule

Every miss becomes a rule: lint rule, a test, or an AGENTS.md line; file it or add it in this change when trivial. A fix without its rule is incomplete until the rule exists or is filed. Carry `Stakes:` from the plan.
