# Routes

Inventory and matching table for the `/zedkit-ai` entry command. This skill
classifies on intention × surface × stakes × authorisation, then delegates.
Score `$ARGUMENTS` against **Cues** (semicolon-separated substrings); the
row with the highest total matched-cue length wins. Never invent a command
that is not in this table. Never route to skill `zedkit-ai` itself.

When **Surface** is `ui`, the Route card **Gates** line quotes skill
`definition-of-done` Visual work (375 / 809 / 1440 × light/dark; `UNSEEN`
caps Confidence at 6). Do not copy that section.

`release-stop` is an overlay, not a kit command: any publish / Version PR /
npm publish / merge-to-trunk request without `explicit-go` stops.

| Command             | Skill               | Via         | Cues                                                                                | Default stakes | Surface | Chain                                                                | Stops                                                |
| ------------------- | ------------------- | ----------- | ----------------------------------------------------------------------------------- | -------------- | ------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| audit               | audit               | orchestrate | unused exports; audit this package; are there other; unused checks; search the repo | standard       | code    | coverage map → evidence → report                                     | no product edits unless the same request asks        |
| challenge           | challenge           | orchestrate | attack this plan; before we code; challenge the attached; attached spec             | sensitive      | none    | skeptic → domain-modeling → codebase-design → verdict                | missing Assumptions table is BLOCKING                |
| fix                 | fix                 | open-skill  | fix the failing; failing typecheck; fix it                                          | standard       | code    | name defect + check → confirm → ladder → change → run check          | grows past one change → stop                         |
| from-audit          | from-audit          | orchestrate | turn this audit; into a plan; from-audit then; implement the findings               | standard       | none    | coverage map → revalidate → plan                                     | do not implement unless already authorised           |
| handoff             | handoff             | orchestrate | handoff; next session                                                               | standard       | none    | compact to temp dir                                                  | redact secrets                                       |
| implement           | implement           | orchestrate | implement ticket; first batch                                                       | standard       | code    | refuse missing plan; frontier batch; tdd; definition-of-done; review | no second batch in the same call                     |
| improve-config      | rules-upkeep        | orchestrate | encode today's correction; into AGENTS.md                                           | standard       | kit     | rules-upkeep                                                         | format + atlas                                       |
| improve-from-review | improve-from-review | open-skill  | punchlist; encode the miss; improve from review; also publish                       | standard       | none    | apply punchlist → rules-upkeep                                       | no new features                                      |
| orchestrate         | orchestrate         | orchestrate | coordinate; then implement then review; run orchestrate                             | standard       | none    | tokenomics → build team → dispatch                                   | named Playbook is the job                            |
| plan                | plan                | orchestrate | plan GitHub issue; public export; src/index.ts                                      | standard       | none    | research → spec → tickets → challenge                                | unchallenged plan is not implementable               |
| pr                  | pr                  | orchestrate | draft the PR body; PR body for this branch; write the PR body; do not merge         | standard       | none    | PR body template                                                     | not merge, not publish                               |
| quick-wins          | quick-wins          | orchestrate | quick wins; audit only; quick wins implement                                        | standard       | none    | audit (default) or implement                                         | one topic; irreversible still asks                   |
| research            | research            | orchestrate | research how; Agent Skills frontmatter; frontmatter works                           | standard       | none    | researcher → markdown in repo                                        | primary sources                                      |
| review              | review              | orchestrate | review the diff; origin/dev; review this button; button PR                          | sensitive      | none    | pin diff → lenses → merge → second pass                              | check spawn is read-only                             |
| setup-ai            | setup-ai            | open-skill  | set up AI; from what it contains; onboard agents; installing the kit                | standard       | kit     | intro → A audit → B readers + interview → C–D writes → E score       | intro before tools; interview; plan approval; report |
| to-audit            | to-audit            | orchestrate | unsure of the facts; audit this topic first                                         | standard       | none    | topic audit                                                          | before plan; do not implement                        |
| triage              | triage              | orchestrate | triage; issue inbox; write briefs                                                   | standard       | none    | roles → brief                                                        | tracker disclaimer                                   |
| release-stop        | —                   | stop        | ship npm; Version PR; merge to main; npm publish                                    | critical       | release | —                                                                    | wait for explicit go; never ship                     |
