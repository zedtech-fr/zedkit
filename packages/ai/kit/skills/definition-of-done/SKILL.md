---
name: definition-of-done
description: "Checklist to pass before calling a code change done. Cheap loop from the area AGENTS.md after the last edit; full CI and e2e are the PR's job. Tests for every changed behavior, no weakened tests, refactor parity, a cold second review, and a rendered-page critique for visual work. Use at the end of any code change and before opening a PR."
---

# Definition of done

Done is a claim. This list is the evidence. If one box cannot be ticked, say which and why. Never tick from memory.

## Gates

The **cheap loop** is the `Local loop` line in the area `AGENTS.md` (filter typecheck, lint, and the unit or integration tests that cover the files you touched). One foreground command. CI owns full-repo test, e2e, static-export smoke and catalog:check. A diff that adds or moves a routed or entry file (for example `page`, `layout`, `route`, `opengraph-image`, a CSS entry, an export map) also runs the area **build**. Typecheck does not exercise the router or the bundler.

- [ ] Cheap loop ran **after the last edit** (read the area AGENTS.md). A fix made after the run means run the cheap loop again.
- [ ] Area build ran when the diff includes a routed or entry file. Typecheck is not that build.
- [ ] Output was read, not assumed. A failure you cannot explain is not done.
- [ ] Nothing generated, built or cached is staged: check `git status` and `git diff --stat HEAD`. Never `git add -A` blindly.
- [ ] No secrets, tokens or personal data in code, tests, logs, fixtures or errors.
- [ ] The PR body carries `Stakes:` (never lowered; a raise has its `Stakes raised:` line). `sensitive` or higher has a recorded review; `critical` also has `Second review:` and `Human validation:` (check with `zedkit-ai stakes <body file>`).

## Tests

- [ ] Every changed behavior has a test. Bug fix: a regression test that fails without the fix. Use `tdd`; for edge cases use `adversarial-tests`. **Layer:** unit and integration tests are primary. Contract or Pact tests when a boundary earns them. End-to-end or browser tests only for an explicitly justified critical user path — not a default battery or an arbitrary count. Do not delete or change existing CI unless the owner asked.
- [ ] **No test deleted, skipped or weakened to make the change pass.** If one had to change, list each (name, why) in the PR description. A test edited to match new behavior proves nothing unless the old behavior was verified wrong.
- [ ] Tests assert behavior through the public interface, not internals.

## Refactors and rewiring

"No behavior change" holds only if you compared what the code does, not what it is called.

- [ ] Wherever a caller now points at something else, open both the old implementation (`git show <base>:<path>`) and the new one and compare what they do: synchronous or queued, what they write, what side effects and errors they have.
- [ ] Checks and validations still run before the side effects they protect, in the same order.
- [ ] Rewritten tests assert the **original** behavior, diffed against the base branch, not against the new code.

## Contracts and data

- [ ] Public API, event or schema changes are additive, or versioned with a stated migration path. List the consumers you searched.
- [ ] When the change ships CSS or a registry payload, one check compiles only that payload and asserts a behavior the component claims. An app that imports the package stylesheet does not cover the copy path.
- [ ] Persisted-data changes: old data still readable, rollout order safe (new code reads old data, old code survives new data).
- [ ] Docs, examples and catalogs that describe the changed surface are updated.

## Size

Estimate files created or modified (exclude lockfiles and generated files) before you start, and re-check when the count grows.

| Zone   | Files | Action                                         |
| ------ | ----- | ---------------------------------------------- |
| Green  | ≤ 20  | Proceed.                                       |
| Orange | 21–30 | Warn. Propose a split if seams exist.          |
| Red    | > 30  | Warn. Propose mergeable subtasks; do not stop. |

- [ ] File-count growth past the first estimate: re-check the zone and warn. Propose a split. Do not stop.
- [ ] A change to the authorized scope (the work is no longer the work that was approved) may need a decision before continuing.
- [ ] Each PR is mergeable alone, never a broken intermediate state. Split along seams: contract, implementation, wiring, tests with their code.

## Visual work

Applies when the diff touches a rendered surface: `**/*.tsx`, `**/*.css`,
`packages/ui/**`, `apps/docs/**` (except tests), tokens/looks, or a rendered
page. Proportion to **visual risk**, not diff size. Exception: a non-visual
change (N/A).

<!-- if:skill=compose-ui -->

- [ ] `/compose-ui` persona-chain brief exists (client business → personas → the client's customers → their personas → UI choices); each UI choice has `because`.

<!-- /if -->

- [ ] The cheap loop and an opened render are necessary, not sufficient. A rendered-page critique names the strongest remaining weaknesses (composition, hierarchy, type roles, density, rhythm). A self-assigned score is not done.
- [ ] Evidence matrix on the touched routes, after the last change: **375, 809 and 1440 × light and dark**. Full looks grid (every shipped look × both modes) only when a shared token, primitive, or identity sheet changes. Required states come from the ticket's `States:` line when present.
- [ ] Blocking measures on those routes: axe `wcag2a` / `wcag2aa` / `wcag21aa` / `wcag22aa` with **0 new** serious or critical vs the host baseline (contrast ≥ 4.5, or 3:1 for large text); no horizontal overflow (`scrollWidth` ≤ `innerWidth` / `clientWidth`); no clipped text (`scrollWidth` > `clientWidth` on the text node, or an unintended ellipsis); zero console errors and zero `pageerror`; a single `h1`; hit targets ≥ 24px (a host may be stricter); selected and focus states meet the contrast floor. Hero size is judged on the opened screenshots. If the host documents a visual-verify command, run it after the last change; otherwise perform the same checks on opened renders and record `UNSEEN` / `UNVERIFIED` where a capture is missing.
- [ ] Contact sheet opened and described (one sentence per width and per mode). `UNSEEN` if not looked at. Generated-but-unread shots do not count. Screenshots count only when the stylesheet and fonts are confirmed loaded.

<!-- if:agent=ui-designer -->

- [ ] agent `ui-designer` verdict in hand.

<!-- /if -->

## Review: two independent passes

Run both after the work, over every changed file, as if seeing it for the first time.

1. **Correctness and boundaries**: logic, edge cases, null and empty handling, module boundaries, contract compatibility, concurrency and retry safety.
2. **Maintainability and risk**, read again from scratch: can a newcomer follow it, is there coupling nobody mentioned, which error paths have no test, what leaks, and what did the first pass wave through.

For large changes run the `verifier` agent once per package or PR in parallel (see `parallel-work`) and merge the findings. The implementer's own pass is never enough alone.

## Report

End the task with: what changed, which gates ran and their result, what was **not** verified, any known risk. Keep it short.

When the work pushes to a deployment target: name the target (which site or account, which environment — e.g. preview vs production) before pushing. Push a complete, current baseline (the full current state) to a new target and confirm on the target rather than trusting the returned link; scope updates to an existing target so user- and editor-owned paths (existing content and settings) survive, then re-verify them. E.g. after pushing a preview: load it, confirm the expected changed content renders and prior configuration survived; when that observation is unavailable, record `verified on target: UNVERIFIED` instead of treating the push as proof.

<!-- if:skill=rules-upkeep -->

Also close with the `Rules` section from `rules-upkeep` (`Rules: none` when nothing to encode).

<!-- /if -->
