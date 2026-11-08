---
name: audit
description: "Thorough, persistent audit of a repo, package or topic: coverage map from the actual request, evidence from code, history, artifacts, consumers and external primary sources, findings split by kind with acceptance criteria. Use when asked to audit, search or inventory (are there other/unused/useless checks, similar dead weight, what else can we drop), run the quality loop, or on schedule. Investigates by default; never shrinks the ask to the last task's cousin; fixes only when the same request asks for them."
---

An audit is an investigation, not a scan and not a fix loop. It is complete
when every question in its coverage map has a defensible answer — not when
findings are implemented, and never as proof the product is defect-free.

Unless this brief already contains `Playbook: audit` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: audit` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

## Mode

- **Investigate (default).** Read-only: no product edits, no issues, no PRs.
  The deliverable is the audit report.
- **Audit and implement.** Only when the same request asks for fixes
  ("audit and fix", "then implement"). Run the full investigation first,
  then the fix loop below on the retained findings. Do not shrink the
  investigation to what is cheap to fix.

## Process

1. **Preserve the objective; build the coverage map.** Restate the full
   requested objective verbatim in the report — never quietly reduce it to
   convenient checks. Turn it into a coverage map: one row per question the
   audit must answer (area, claim to test, evidence that would settle it).
   Write the report as you go, in the configured tracker or
   `.scratch/<slug>/audit.md` (git-ignored, never `docs/`); that file is the
   resume point across turns — reopen and extend it instead of restarting.
   If your tool offers a native durable-goal mechanism, register the
   objective there; if it does not, the report file carries continuity.
   Do not invent a goal tool you do not have.
2. **Gather evidence per row.** Use the sources that can actually settle
   each row: code and `git` history, specs and prior audits, issues and PRs,
   CI results, shipped or installed artifacts, and observed consumer
   behavior. When external evidence can materially improve a row, research
   it (`research`, `researcher`): current official documentation and
   standards, credible specialist sources, exemplary implementations.
   Search results are leads — open the underlying source, cite it, check
   its version and applicability, and resolve conflicts explicitly
   (`ground-truth`: running code beats docs beat memory). Consider
   alternatives beyond the current implementation before judging it.
   `ponytail-audit` is one lens (bugs, risk, scale, tests, lean) inside
   this step, never the whole investigation; its finding cap does not
   bound the audit.
3. **Trace important claims end to end.** Where relevant, follow a claim
   from source → shipped/installed artifact → actual consumer behavior.
   Green tests, matching strings and existing docs prove only what they
   cover. Verify with the check that fits the claim: run it, reproduce it,
   or inspect the rendered/runtime result. A claim you could not trace
   stays labelled with the missing link.
4. **Challenge consequential conclusions.** Any finding that would drive a
   costly fix, a release decision or a public claim gets an independent
   second check (`skeptic`, or a fresh `check` spawn that did not produce
   it). Use specialists selectively — one per coverage area that needs
   depth, not a fan-out per file.
5. **Write findings by kind.** Separate, and never blend:
   - **Verified defect** — reproduced or traced, with its concrete case.
   - **Requirement gap** — a stated requirement (spec, request, standard)
     the evidence shows is unmet.
   - **Design judgment** — a defensible trade-off call, stated as such.
   - **Improvement opportunity** — better exists; nothing is broken.
     Each actionable finding carries: evidence (`file:line`, command and
     exit, or cited source), affected scope, practical impact, a priority
     with its justification, and an acceptance criterion a checker could
     test. No concrete case, no defect. List missing evidence and unresolved
     questions in their own section — they are findings about coverage.
6. **Completion bar.** Each coverage-map row ends in exactly one state:
   - **Answered** — evidence in hand, strong enough to survive challenge.
     The evidence is a command and its output, a `file:line`, or a URL
     opened in this session. A spawn that did not start stays **Not
     checked**. A result whose data is null: open the retained artifact
     this session (the result's ref, notes, or spilled payload) and
     verify it. Cite that artifact when it settles the row. If it is
     missing, unreadable, or does not settle the row, the row stays
     **Not checked** until this session repeats the settling check and
     cites it. **Partial** is a finished report.
   - **Unresolved after investigation** — the settling check was actually
     run or attempted and genuine uncertainty remains (conflicting
     sources, evidence that stayed inaccessible after a real attempt).
     State what was attempted and what the uncertainty is.
   - **Not checked** — a required check was not performed: skipped,
     deferred, or never attempted. Listing it does not close it.
     The audit is complete only when no row is **not checked**. Any
     not-checked row makes the audit **partial**, however honestly it is
     disclosed — an unperformed install, runtime or consumer check listed
     under open questions is still a partial audit. Depth serves decisions:
     expand research where a row is still weak; stop when each row is
     answered or its uncertainty is real and investigated.
7. **Report.** Objective, coverage map with per-row state (answered /
   unresolved after investigation / not checked), findings by kind,
   unresolved questions, `Not checked:` (parts not read or not run).
   Point at `from-audit` for turning findings into a plan; do not start it
   unless asked.

## Fix loop (audit-and-implement mode only)

1. **Issues.** One issue per retained finding: the four parts
   (what / problem / fix / if-skipped), owner, acceptance criterion, and
   the miss-to-rule line (which lint/test/AGENTS.md rule would have
   caught it).
2. **Fix.** Per issue, smallest first: brief `implement` (or the `improver`
   agent when the fix is review-shaped), then `verifier`, then one small
   PR. Never batch unrelated fixes; never stack PRs.
3. **Rules.** Each merged fix carries its rule from step 1 (added or
   filed). A fix without a rule is incomplete.
4. **Report.** The audit report above, plus issues opened, PRs merged,
   rules added. One line per merge. Unimplemented findings stay visible —
   the audit's completeness never depends on the fix loop finishing.

## Rules

- Read-only in investigate mode: the audit itself changes nothing.
- Small issues, small PRs. A finding too big for one PR is split before it
  is filed.
- Reuse before adding: the audit must not propose what the repo, the kit,
  or an installed dependency already covers (`ponytail-review` ladder).
- A subagent's report is a claim, not evidence (`ground-truth`): open the
  cited source yourself before a finding rests on it.
