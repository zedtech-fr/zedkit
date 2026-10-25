# @zedtech/zedkit-ai

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
