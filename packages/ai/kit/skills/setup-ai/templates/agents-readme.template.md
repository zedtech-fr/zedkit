# AI setup map

Human and agent index for this repo. Always-loaded law lives in root `AGENTS.md`. Folder law lives in nested `AGENTS.md`. This file is the map, not a second copy of the rules.

## Design loop

0. Unclear, or only questions? `/to-audit`. Have an audit? `/from-audit`.
1. `/plan` — research, spec, ladder, **assumptions table**. Never implements.
2. `/challenge` — stress-test the plan. **BLOCKING** if the assumptions table is missing.
3. `/implement` — the named unit, or the plan's first dependency-ready batch when none is named (the to-tickets frontier; agent `implementer` when the orchestrator fans out). Work branch; open the PR.
4. `/review` — punchlist (agent `reviewer`); `/implement` of findings via `improver`.
5. Close with `definition-of-done` and `rules-upkeep` (`Rules: none` when nothing to encode).

On every message, pick depth first (root `AGENTS.md`). A search or inventory is an audit, not a grep-and-reply. Every numbered command hands to `orchestrate` (tokenomics + **build team**), except `/fix` and `/improve-from-review`, which stay inline. Plan, challenge and review: go deep, be strict, and be brutally honest.

## Commands (human-triggered)

| Command                | Does                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `/plan`                | Spec, tickets, ladder, assumptions. Never implements.                     |
| `/challenge`           | Attack a plan.                                                            |
| `/implement`           | Build from a challenged plan; unscoped, the first dependency-ready batch. |
| `/review`              | Pin the diff, run lenses, one verdict.                                    |
| `/orchestrate`         | Coordinator: frame, dispatch, aggregate. Does not edit.                   |
| `/setup-ai`            | Audit and tailor this setup.                                              |
| `/improve-config`      | Encode session learnings (skill `rules-upkeep`).                          |
| `/to-audit`            | Topic audit from questions or an unclear plan.                            |
| `/from-audit`          | Revalidate an audit; turn it into an actionable plan.                     |
| `/fix`                 | One defect, inline, with its check.                                       |
| `/improve-from-review` | Apply a review punchlist, then encode a reusable miss.                    |
| `/quick-wins`          | `audit <scope>` or `implement <findings or topic>`.                       |
| `/research`            | Prior-art scout (hands to `orchestrate`).                                 |

Drop rows the preset did not install. Add a row when you add a command.

## Atlas

`.agents/atlas.md` is the lookup: where things live, the repo's words, exact commands, reasons. Read it before you search; open `.agents/atlas/<topic>.md` when the Entry names one. Fix one row when a search or a correction taught you something. `zedkit-ai validate` fails on a path that no longer exists, including paths inside a linked topic file. Skill `rules-upkeep` says how.

## Always-on vs globbed

Root `AGENTS.md` is always on: assumptions, file budget, living config, ladder. Nested `AGENTS.md` plus one Cursor `.mdc` (`nested.mdc`, `globs:` comma-separated, `**/`-prefixed) attach only when matching files are in play. Split to per-folder `.mdc` only when the pointer body would differ. `alwaysApply: true` only for short cross-cutting gates.

## Skills (procedures)

Kit skills cover plan / review / tdd / craft. Repo skills copied from `setup-ai/templates/catalog/` during setup are the repeated local shapes (use-case, adapter, endpoint, migration, domain-change). List them here when you install one.
