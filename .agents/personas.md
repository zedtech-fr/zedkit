# Project personas — zedkit

Named audiences for `persona-review`. The skill picks 2–4 per change and
requires evidence (command, screenshot, `file:line`) for every verdict.

| Persona | Task | Bar |
|---|---|---|
| Stressed user (rushed, anxious) | get through the flow fast without losing or breaking anything, and know it is saved | zero naked spinners, zero generic 'loading': every wait named and localized (what loads, what updates), visible save feedback, faithful skeletons, no blank screens, no layout shift, no lost input, retry that keeps state; gentle motion reassures and shows where you are |
| Lazy end client (distracted, doubtful) | complete the task the kit UI serves, half-attentive, interrupted, on flaky network | reassured, choices prefilled, clear next step, price/duration/guarantees visible, state kept in URL; interrupted: progress auto-saved, resume exactly where left off on any device (URL state + server draft), no re-entering data, clear 'continue where you left off' entry, links that do not expire quickly; flaky network: reload always safe (idempotent actions, no double submit), offline/slow state visible with plain reassurance, pending actions queued and retried, skeletons not blank screens, retry never loses form state; gentle motion reassures and shows where you are |
| Integrating developer | adopt a kit package from README + catalog alone | install works, contract and errors clear without reading the implementation |
| Coding agent | consume the kit (catalog, skills, agents) programmatically | machine-readable catalog.json, stable names, examples that run, AGENTS.md predictive |
| Maintainer / operator | publish, debug, roll back | changesets flow, CI gates explain failures, rollback documented |
| New contributor | land a first kit PR | conventions discoverable, tests runnable, PR checklist clear |
| Security reviewer | verify isolation, auth and secrets | verifiable from tests + code, no trust-me steps |
| Business owner | judge delivery | stated problem solved, adoption cost stated, big picture in one paragraph |
