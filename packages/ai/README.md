# @zedkit/ai

An agent-agnostic AI setup for a code repo: an `AGENTS.md` template, skills,
subagents, and a small installer and validator. Works with Claude Code,
Cursor, Codex, Muse and any tool that reads `AGENTS.md` or Agent Skills.
Original work by the same author, plus vendored MIT skills (see
[kit/THIRD_PARTY_NOTICES.md](kit/THIRD_PARTY_NOTICES.md)).

## Use it

```sh
zedkit-ai init .               # copy the core kit into this repo
# then ask your agent: "run the setup-ai skill"
zedkit-ai validate             # check skills and subagents
```

`init` installs generic instructions. The `setup-ai` skill makes them specific:
it explores the repo (code, docs, CI, history), runs the commands it finds,
then fills `AGENTS.md` with verified facts and proposes repo-specific nested
rules, skills and subagents. If a setup already exists (`AGENTS.md`,
`.cursor/rules`, `CLAUDE.md`, ...), it audits it first (stale, contradictory,
duplicated, too long) and improves it in place instead of replacing it.
`setup-ai` also fills the template's `Role and style` section (role, tone,
reply language) from repo evidence — docs language, commit style — asking a
single question when the evidence cannot tell.

Not published to npm yet. From a zedkit checkout, build once and call the
binary directly: `pnpm --filter @zedkit/ai build`, then
`node packages/ai/dist/bin.js init <dir>`.

`init` options: `--preset core|full`, `--target claude,cursor`, `--dry-run`.
It copies files (you own them afterwards) and never overwrites an existing
one. It also skips `.cursor/rules/project.mdc` (with a skip line naming the
rule) when another rule in `.cursor/rules/` is already always on
(`alwaysApply: true`), instead of adding a second one. Run `zedkit-ai list`
to see presets and subagents.

## What you get

```
AGENTS.md                  instructions every tool reads
CLAUDE.md -> AGENTS.md
.agents/skills/            workflows (the Agent Skills layout)
.agents/agents/            subagents
.claude/{skills,agents}    symlinks to .agents/
.cursor/{skills,agents}    symlinks to .agents/
.cursor/rules/project.mdc  one always-on rule pointing at AGENTS.md
```

One source (`.agents/`), thin per-tool links. Nested `AGENTS.md` files hold
per-folder rules.

## The kit

**Principles it enforces**

- *Verify, do not guess* (`ground-truth`): read the source before relying on a
  name, shape, flag or version; cite `file:line`; say what was not checked.
- *Smallest complete change* (`ponytail`, MIT, vendored): reuse before adding.
- *Parallel and context-aware* (`parallel-work`): fan out independent work to
  subagents with self-contained briefs; contract first, disjoint files.
- *Proven done* (`definition-of-done`, agent `verifier`): gates on the final
  state, no weakened tests, refactor parity by reading bodies, cold second
  review.

**Skills first-party:** `ground-truth`, `parallel-work`, `definition-of-done`,
`adversarial-tests`, `rules-upkeep`, `persona-review`, `setup-ai`, `use-zedkit`.

**Entry points (one command per phase):** `review` (pins the diff, fans out
`code-review` + `persona-review` + `adversarial-tests`/`security-reviewer`
when relevant, one verdict), `plan` (`to-spec`/`to-tickets`/`wayfinder`, then
`challenge`), `challenge` (`plan-challenger` + domain/design checks),
`implement` (extended: challenged plan in, `definition-of-done`, `review`).
All four live in the `core` preset; the detailed skills stay reusable and are
never copied into them.

**Skills vendored (MIT):** `ponytail` (+ review, audit, debt, gain, help) and
the Matt Pocock engineering skills (`tdd`, `code-review`, `diagnosing-bugs`,
`handoff`, `pr`, `to-spec`, `triage`, ...).

**Subagents:** `explorer` (read-only lookup), `architect` (plan, never code),
`plan-challenger` (pre-mortem and ranked objections), `verifier` (gate),
`improver` (apply review findings, smallest diff), `security-reviewer`.

**Presets:** `core` (the skills most projects benefit from; `zedkit-ai list`
shows them) and `full` (all). Keep the skill count low: every skill's name and
description is loaded into context up front (Codex caps that list at about 2%
of the context window and shortens descriptions past it). Subagents are always
installed; their files are only read when one is used.

## Choices worth knowing

- Subagent `model` is left unset (inherits). An unknown model id silently
  falls back in some tools, so pin one in your project only after listing what
  your tool accepts. The validator rejects any other value in the kit.
- Subagent `description` is one line: a block (`>`) can be shown literally and
  the agent is then never chosen. The validator checks it.
- Read-only subagents say so in their prompt body and set
  `disallowedTools: Write, Edit` (Claude Code honors it; other tools tolerate
  the key). There is deliberately no `readonly:` key: at least one tool
  silently drops a subagent file with an unknown field, so the validator
  rejects it.
- Cursor reads `.cursor/agents`, `.claude/agents` and `.codex/agents`
  ([docs](https://cursor.com/docs/subagents), checked 2026-10-24); the installer
  links `.cursor/agents` anyway so a Cursor-only repo needs nothing else.
- Codex reads `.agents/skills` (it follows symlinks) and `AGENTS.md`
  ([docs](https://developers.openai.com/codex/skills), checked 2026-10-24), so
  it needs no adapter. The subagent files are not wired for Codex.
- Muse reads `AGENTS.md`, `.agents/skills` and `.agents/agents` directly
  (verified empirically 2026-10-24 with `muse skills list` and a headless
  `muse exec` run: every core skill and all 6 subagents load), so it needs
  no adapter either. It ignores the `.claude/` and `.cursor/` links. This is
  how the `readonly:` ban above was found: files setting it never appear in
  its agent list.
- Symlinks need a filesystem that supports them (Windows: developer mode or
  WSL).

## API

`installKit(options)` and `validateKit(dir)`: see [CATALOG.md](CATALOG.md).

## Verify

```sh
pnpm --filter @zedkit/ai typecheck && pnpm --filter @zedkit/ai lint && pnpm --filter @zedkit/ai build && pnpm --filter @zedkit/ai test
```

The tests also validate the whole bundled kit.
