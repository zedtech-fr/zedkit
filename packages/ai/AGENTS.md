# AGENTS.md — @zedkit/ai

1. Two parts: `kit/` (markdown and JSON shipped as data) and `src/` (a
   small installer, validator and CLI). Runtime deps: `@zedkit/core`,
   `yaml`.
2. `kit/` is the single source of truth for this repo's own skills and
   subagents too (`.agents/skills` and `.agents/agents` are symlinks into
   it). Edit there.
3. Agent-agnostic: no tool-specific paths or model ids inside skills or
   subagents. Subagent `model` is omitted or `inherit`; descriptions are
   one line; names equal the folder or file name. `validateKit` enforces
   it and the tests run it on the whole kit.
4. Never name a private project, customer, vendor or internal URL in the
   kit (CI denylist: `scripts/check-no-private-refs.sh`). Examples use
   generic names.
5. Vendored skills stay verbatim. Any edit is listed under Modifications
   in `kit/THIRD_PARTY_NOTICES.md`, and new vendored skills get their
   licence file next to them.
6. First-party skills: imperative, short, one job, the trigger in the
   `description` ("Use when ..."). Add one only if no existing skill or
   subagent fits; a preset entry only if most projects benefit.
7. Installer never overwrites. New behavior needs a test in
   `tests/unit/install.test.ts`.
8. Explicit named exports in `src/index.ts`, each in `CATALOG.md`.
9. Definition of done: `pnpm --filter @zedkit/ai typecheck && pnpm --filter @zedkit/ai lint && pnpm --filter @zedkit/ai build && pnpm --filter @zedkit/ai test`
   green (each separately), `pnpm catalog:check` green.
