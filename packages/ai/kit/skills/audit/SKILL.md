---
name: audit
description: "Recurring repo quality audit that opens small issues and fix PRs. Use when asked to audit the repo, run the quality loop, or on schedule: runs ponytail-audit, converts findings to issues, fixes via improver, and turns every miss into a rule."
---

One loop for "audit this repo, then fix it". The audit itself is
`ponytail-audit` (one-shot report, changes nothing); this skill adds the loop
around it: issues, small fixes, and a rule per miss.

## Process

1. **Scope.** Whole repo by default. Start where a miss costs most (entry
   points, money, auth, data writes, user-facing flows); name what you skip.
2. **Audit.** Run `ponytail-audit` and keep its ranked report. Every finding
   needs its concrete case — no case, no issue.
3. **Issues.** One issue per surviving finding: title, the four parts
   (what / problem / fix / if-skipped), owning lane, and the miss-to-rule
   line (which lint/test/AGENTS.md rule would have caught it).
4. **Fix.** Per issue, smallest first: brief `implement` (or the `improver`
   agent when the fix is review-shaped), then `verifier`, then one small PR.
   Never batch unrelated fixes; never stack PRs.
5. **Rules.** Each merged fix carries its rule from step 3 (added or filed).
   A fix without a rule is incomplete.
6. **Report.** What was audited, issues opened, PRs merged, rules added.
   One line per merge.

## Rules

- Read-only until step 4: the audit itself changes nothing.
- Small issues, small PRs. A finding too big for one PR is split before it
  is filed.
- Reuse before adding: the audit must not propose what the repo, the kit,
  or an installed dependency already covers (`ponytail-review` ladder).
