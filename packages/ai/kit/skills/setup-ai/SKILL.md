---
name: setup-ai
description: "Set up or improve this repo's AI setup from what the repo actually contains: explores code, docs and CI, then writes or upgrades AGENTS.md, nested rules, and repo-specific skills and subagents. Use when asked to set up AI, onboard agents, audit or improve existing agent instructions, or after installing the kit."
---

# Setup AI

Make the AI setup of **this** repo true and specific. Generic advice is already in the kit; your job is what only this repo can say: its commands, its layout, its traps, its repeated workflows.

Two modes, decided in step 1: **fresh** (little or nothing exists) and **improve** (a setup exists: keep it, fix it, extend it).

## Rules for the whole run

- **Evidence only.** Every command, path, version and convention you write comes from a file you opened or a command you ran (see `ground-truth`). Mark the rest `UNVERIFIED` or leave it out.
- **Additive.** Never delete or rewrite the user's existing text without asking. Propose, then apply what they accept.
- **Smallest useful setup** (see `ponytail`). Each artifact must be justified by evidence from step 3. No skill for a workflow that happened once.
- **Prefer enforcement to prose.** If a linter, type check, test or CI job can enforce a rule, configure that and mention it in one line. Prose is for what tools cannot check.
- A public repo gets no private names, customer data or internal URLs in any file you write.

## 1. Inventory what exists

List, with paths: `AGENTS.md` (root and nested), `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md`, `.agents/`, `.claude/`, `.cursor/`, `.codex/`, `CONTRIBUTING.md`, PR and issue templates, `CODEOWNERS`.

- Nothing or only boilerplate: **fresh**. Run `zedkit-ai init` (if the kit is not installed yet) and continue.
- Anything real: **improve**. Read all of it first. Note what each file is for and which tool reads it.
- Audit only files the repo owns. A vendored or symlinked kit (for example `.agents/skills` pointing into a package) is listed once and not audited.
- Note uncommitted changes. Treat the current working state as the baseline and do not revert anything.

## 2. Explore in parallel

Launch read-only `explorer` subagents in one batch, one question each, with the brief format of `parallel-work`. Ask each to return `file:line` evidence and nothing else. If you cannot spawn subagents, ask the same questions yourself, one after the other.

| Question | Where it looks |
|---|---|
| Stack, layout, entry points, workspaces | manifests, lockfiles, top-level folders, build config |
| The real commands: install, dev, typecheck, lint, test, build, migrate | manifest scripts, `Makefile`, task runners, CI workflow files |
| Conventions already enforced | lint, format and compiler configs, test layout, naming seen in the code |
| What the docs say | README, `docs/`, ADRs, glossary, contributing guide |
| How the team works | `git log` (commit style, PR size, hotfix habits), templates, branch rules, CI jobs and what blocks a merge |
| Sensitive areas | auth, tenancy, secrets handling, money, migrations, generated code, vendored folders |

Then **run the gate commands you found**, preferring forms without side effects (note any that write build output). Judge a command by its exit code, not by parsed output. A command that fails is a finding, not something to hide.

## 3. Find the gaps

In **improve** mode, audit each existing file and report before you edit:

| Check | How |
|---|---|
| Stale | paths that no longer exist, commands that fail, tools the repo no longer uses. Check each path and run each command; do not judge by reading. |
| Contradictory | two files giving different commands or rules |
| Duplicated | a paragraph, or three or more lines, repeated across files; keep one home and link to it |
| Too long for always-loaded | root file over about 100 lines, nested file over about 60, skill over about 150; or details only one folder needs |
| Missing trigger | skills or agents whose `description` does not say when to use them |
| Unenforced | prose rules a tool could check. Before calling a rule unenforced, open the lint, type and CI configs and search them for it. |

In both modes, list **gaps**: repo facts an agent would otherwise get wrong. Examples: a non-obvious test command, a generated folder not to edit, a module boundary, a migration procedure, a naming rule the linter misses, a service that must be running.

## 4. Decide what to create

For each gap pick the smallest home:

| Artifact | Create it when |
|---|---|
| Root `AGENTS.md` | always: non-negotiables, verified commands, map, review angles. Short. |
| Nested `AGENTS.md` | a folder has its own stack, commands or rules that the rest of the repo does not |
| Repo skill | a multi-step workflow is repeated in this repo (seen in two or more places in code, docs or `git log`), for example "add an endpoint" or "add a migration" |
| Subagent | a narrow job needs fresh context or fewer permissions, for example a reviewer for one sensitive area |
| Lint, CI or hook change | a rule is mechanical and keeps being broken |
| Nothing | the fact is already clear from the code |

Present the plan as a table: artifact, path, why (with evidence), action (create, edit, dedupe, leave alone), and whether it is `safe` (additive) or `needs OK` (removes or rewrites existing text). Every finding from step 3 gets a row, or an explicit "left alone: reason". **Wait for the user's go before writing.** If nobody can answer (non-interactive run), output the table and stop.

## 5. Write

- **Root `AGENTS.md`**: start from the kit template if there is none. Replace every `<placeholder>` with a verified fact or delete the line. Non-negotiables name how each is enforced.
- **Nested `AGENTS.md`**: only what differs from the root. Link, do not copy.
- **Repo skills**: folder `.agents/skills/<name>/SKILL.md`. The `description` says when to use it. Steps use this repo's real paths and commands, end with the command that proves the result, and point at an existing example file as the model. Follow `rules-upkeep` for format.
- **Subagents**: `.agents/agents/<name>.md`, one-line description, `model` omitted. Read-only unless the job needs writes.
- **Improve mode**: edit in place, smallest change, keep the author's wording where it is correct. Log what changed.

## 6. Verify

- Every command in the written files was run, or is marked `UNVERIFIED` with the reason.
- Every path and link exists: check each one (`test -e`).
- No placeholder like `<Project>` is left.
- `zedkit-ai validate` is clean, and the tool folders (`.claude/`, `.cursor/`) resolve to `.agents/`.
- A fresh reader, or a subagent given only the new files, can answer: how do I run the tests, where does X live, what must I never do here?

## 7. Report

Short: what you created or changed, what you left alone and why, the findings you did not fix (failing commands, contradictions needing a human decision), and everything marked `UNVERIFIED`.
