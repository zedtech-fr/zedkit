# Third-party notices — vendored agent skills

All skills in `.agents/skills/` are verbatim, unmodified copies from their
upstream repositories (verified by diff at vendoring time). Each upstream's
licence file is kept next to the skills: see `skills/LICENSE-*-*`.

## Ponytail skills (6) — MIT

- Author: Dietrich Gebert
- Upstream: https://github.com/DietrichGebert/ponytail
- Licence: MIT, Copyright (c) 2026 DietrichGebert
  (`skills/LICENSE-ponytail-MIT`, copy of upstream `LICENSE`)
- Skills: `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`,
  `ponytail-help`, `ponytail-review` (upstream `skills/ponytail*`)
- Modifications: none.

## Matt Pocock engineering skills (19) — MIT

- Author: Matt Pocock
- Upstream: https://github.com/mattpocock/skills
- Licence: MIT, Copyright (c) 2026 Matt Pocock
  (`skills/LICENSE-mattpocock-skills-MIT`, copy of upstream `LICENSE`)
- Skills: `code-review`, `codebase-design`, `diagnosing-bugs`,
  `domain-modeling`, `handoff`, `implement`, `implement-spec`,
  `improve-codebase-architecture`, `pr`, `research`, `retro`,
  `setup-matt-pocock-skills`, `setup-ts-deep-modules`, `tdd`, `to-spec`,
  `to-tickets`, `triage`, `wayfinder`, `writing-for-agents`
  (upstream `skills/engineering/*`, `skills/productivity/*`,
  `skills/in-progress/setup-ts-deep-modules`)
- Modifications: none.

## Borrowed excerpt inside `pr` — Apache-2.0

- The `pr` skill's Summary visuals menu is adapted from Dex Horthy's
  `show-me` skill (https://github.com/humanlayer/humanlayer), as recorded
  in `skills/pr/CREDITS.md` (kept verbatim).
- Licence: Apache License 2.0
  (`skills/LICENSE-humanlayer-Apache-2.0`, copy of upstream `LICENSE`).

## Deliberately not vendored

- `ask-matt` (upstream `skills/engineering/ask-matt`, MIT — redistribution
  would be allowed with credits): excluded on purpose. It routes over skills
  that are not vendored here (`grill-with-docs`, `grill-me`, `grilling`,
  `prototype`), so it would be a broken router. Install from upstream if
  needed: https://github.com/mattpocock/skills
- `grilling` (upstream `skills/productivity/grilling`) and `prototype`
  (upstream `skills/engineering/prototype`): not vendored. Three vendored
  skills invoke them via the Skill tool (`wayfinder`, `triage` and
  `improve-codebase-architecture` call `grilling`; `wayfinder` also calls
  `prototype`; other `prototype` mentions elsewhere are prose, not skill
  calls). On machines without these skills installed personally those calls
  fail — install them from https://github.com/mattpocock/skills if you use
  those three skills.
