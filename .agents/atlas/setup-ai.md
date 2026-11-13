# Agent setup markdown and package README prompts

Full Entry paths, traps, and Touches for the index rows that point here. The index in `.agents/atlas.md` stays a pointer; fix facts here and keep that row in sync.

## Where

| Topic | Entry | Why it lives there / trap | Touches | Checked |
| --- | --- | --- | --- | --- |
| Evidence of the last setup run | `.agents/setup-log/reading.md` | Rule map and merged rules with `file:line`; a one-shot log, not maintained | nothing: read-only history | 2026-11-07 |
| Agent-setup markdown (map, suggest, per-package setup.md) | `apps/docs/prose/agent/`, `packages/ai/kit/cursor-onboarding.md` | Docs-owned map/suggest/UI/Nest; AI stays kit-owned. Copied to `apps/docs/public/{map,suggest.md}` and `public/{ai,ui,nest}/setup.md` by `writeAiSetupPublicAssets`. Nest start-one skips to the human walkthrough (no scaffold). Suggest lists every subset/combo follow-up; map.md Paste prompts include Suggest, AI and UI (home), and Combined (all three). Atlas word **kit** is `packages/ai/kit/`; user prompts say zedkit AI/UI/Nest. Committed `apps/docs/lib/ai-setup-onboarding.generated.ts` must match `readAiSetupKit()` (setup preset, including `pr`); merging kit.json without `apps/docs/scripts/generate.mjs` drops rows. | `apps/docs/lib/ai-setup-onboarding.mjs`; `scripts/doc-pins.mjs` | 2026-11-13 |
| Package README agent pointers | `packages/ai/README.md`, `packages/ui/README.md`, `packages/nest/README.md` | npm/GitHub start surface. AI heading is "Cursor: one paste"; UI and Nest are "Agent: one paste". Prompt bytes live in `apps/docs/lib/ai-setup-onboarding.mjs` (`*_SETUP_MINI_PROMPT`); inlined in each README — do not import the docs app. Agent-setup markdown row owns map/suggest/setup.md sources. | `packages/ai/tests/unit/cursor-onboarding.test.ts`; `packages/ui/tests/unit/readme-setup-prompt.test.ts`; `packages/nest/tests/readme-setup-prompt.test.ts` | 2026-11-11 |
| Setup-map offline fixture | `apps/docs/fixtures/setup-map.mjs`, `apps/docs/scripts/setup-map-fixture.test.mjs` | Vendored Next host in `apps/docs/fixtures/setup-map/host/`. In-process `main` from `packages/ai/dist/cli.js` (build AI first); never `scripts/adoption-smoke.mjs`, Playwright, or `create-next-app`. | `pnpm test:registry:nodeploy` | 2026-11-11 |
