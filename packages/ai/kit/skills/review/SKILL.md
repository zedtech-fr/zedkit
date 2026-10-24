---
name: review
description: "Single entry point for reviewing a change: pins the diff once, runs the right review lenses in parallel subagents, dedupes and returns one verdict. Use when asked to review a branch, PR, commit range or work-in-progress."
---

One command for "review this". It picks the lenses, pins the diff once, fans
out, then merges everything into a single report with one verdict.

## 1. Pin the diff

Resolve the fixed point the user gave (commit, branch, tag, `HEAD~N`; ask when
missing) and capture it once: `git diff <fixed-point>...HEAD` plus
`git log <fixed-point>..HEAD --oneline`. Fail fast here on a bad ref or an
empty diff — never inside the subagents.

## 2. Pick the lenses

Always: `code-review` (its Standards and Spec axes; Standards applies
`ponytail-review`, never ad-hoc smells) and `persona-review` (does the change
serve its real audience). Add `adversarial-tests` when logic, handlers or
endpoints changed; add the `security-reviewer` subagent when auth, secrets,
tenancy, user data or external calls are touched.

## 3. Fan out

One subagent per lens, all in parallel (see `parallel-work` for the pattern;
skip the fan-out and run inline when the diff is a few lines). Every brief is
self-contained: the diff command, the lens skill to apply, and the evidence
rule from `ground-truth` — every finding cites `file:line`, or it is not a
finding.

## 4. Merge

Dedupe across lenses (same location and issue keep the strongest wording),
rank by severity, and end with exactly one verdict: ship, fix-then-ship (list
the blockers), or rework. One report, no per-lens sections.
