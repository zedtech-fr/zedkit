# AI setup of this repo

This repo uses its own [`@zedkit/ai`](../packages/ai/README.md) kit: the
skills and subagents in `packages/ai/kit/` are the single source of truth.

- `.agents/skills` and `.agents/agents` are symlinks into `packages/ai/kit/`.
- `.claude/` and `.cursor/` link to `.agents/` (skills and agents).
- Instructions: root `AGENTS.md` plus one `AGENTS.md` per package;
  `.cursor/rules/*.mdc` only points at them.

Edit skills and agents in `packages/ai/kit/`, then run
`pnpm --filter @zedkit/ai test` (it validates the whole kit). Licences and
credits of vendored skills: `packages/ai/kit/THIRD_PARTY_NOTICES.md`.
