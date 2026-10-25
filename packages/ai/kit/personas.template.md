# Project personas

Named audiences for `persona-review`. The skill reads this file, picks 2–4
personas per change, and requires evidence (command, screenshot, `file:line`)
for every verdict. Customize names and details per project; keep one row each
for the end client, the integrator, and the operator.

| Persona | Task | Bar |
|---|---|---|
| Lazy end client (distracted, doubtful) | complete the task on a phone, half-attentive | reassured, choices prefilled, clear next step, price/duration/guarantees visible, state kept in URL |
| Integrating developer | adopt the feature from README + examples alone | contract, errors and failure semantics clear without reading the implementation |
| Coding agent | consume the API/docs programmatically | machine-readable surface, stable names, no hidden steps, examples that run |
| Maintainer / operator | see what happened, repair, replay | logs, recovery path, no data loss, rollback documented |
| New contributor | make a first correct change | conventions discoverable, tests runnable, review checklist clear |
| Security reviewer | verify isolation, auth and secrets | verifiable from tests + code, no trust-me steps |
| Business owner | judge delivery | stated problem solved, adoption cost stated, big picture in one paragraph |
