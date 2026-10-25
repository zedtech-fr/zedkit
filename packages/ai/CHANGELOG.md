# @zedtech/zedkit-ai

## 0.3.0

### Minor Changes

- fa3b613: Add the `copywriter` read-only i18n-first microcopy reviewer (keys, tone, doubtful-client bar, FR/EN proposals); flip the `copy` lens to exists.
- b99b3c4: Quality loop: `frontend-quality` + `doc-demos` lens rows (planned until their runners land), miss-to-rule step in `review`, new `audit` skill + command with content tests.
- 1a858c7: Enrich the lazy end-client persona with interrupted and flaky-network bars (auto-save, resume where left off, reload-safe idempotent flows) and add the Stressed user persona (named loading feedback, no naked spinners); matching checks in `ui-designer` and the `skeptic` ui/ux angle.
- d5ba31f: Add the `seo-auditor` and `a11y-auditor` read-only reviewers (seo package rules; WCAG basics); flip both lenses to exists.
- 0c81d35: Add the `ui-designer` read-only UI reviewer (kit reuse, states, responsive, themes, lazy-client bar) and `docs/agents-catalog.md` (when to call which agent, typical chains); flip the `ui` lens to exists.

### Patch Changes

- 3809828: Lens registry: docs trigger also covers agents and commands (dogfood finding — new kit content matched no content lens).
- b35e593: Fix two pre-review findings: `audit` skill says owner (not the internal lanes term), `copywriter` key rule scoped to products with i18n.
- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.
- Updated dependencies [59a12be]
  - @zedtech/zedkit-core@0.1.1

## 0.2.0

### Minor Changes

- 93b16af: Add the review lens registry (`skills/review/lenses.md`): `review` now routes path/type to mandatory lenses over one table, with a lenses-run report and a resolver test.
- c515c4e: Personas as data: kit `personas.template.md` installed to `.agents/personas.md` (existing file kept), `persona-review` reads it with a generic fallback, `setup-ai` customizes it per project.
- ba05241: Replace `plan-challenger` with one generic `skeptic` agent (angle per brief: plan, ui/ux, security, scope, data/ops, copy); `plan-challenger` stays as a deprecated alias for one release. Lens registry updated (single skeptic row), lens test asserts trigger/output columns.

## 0.1.0

### Minor Changes

- 7426a08: Initial release: agent-agnostic AI kit (AGENTS.md template, skills, subagents), installer and validator.

### Patch Changes

- Updated dependencies [48b6f4a]
  - @zedtech/zedkit-core@0.1.0
