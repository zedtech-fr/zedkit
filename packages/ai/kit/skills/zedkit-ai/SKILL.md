---
name: zedkit-ai
description: "Classify a request onto a kit command, print a Route card, then reuse orchestrate or open the destination skill."
disable-model-invocation: true
---

# zedkit-ai

This skill is the **entry command** (`/zedkit-ai`). It classifies, prints a
Route card, then delegates. It is not the `zedkit-ai` CLI (`route`, `sync`,
`validate`). Classify `$ARGUMENTS`, not the token `/zedkit-ai`. Never route
to this skill itself.

**Before ANY tool call** after reading this skill, print the Route card as
the opening of your first reply, before any tool call, then continue in
the same turn. This file and [`routes.md`](routes.md) count as already loaded.

## 1. Classify

Read [`routes.md`](routes.md). Score `$ARGUMENTS` against the **cues**
column; pick the best row. Never invent a command outside that inventory.

- **Intention** → the row's command.
- **Surface** → `none|code|docs|kit|ui|public-api|release`. `public-api` or
  `release` raises stakes to at least `sensitive`. When surface is `ui`,
  Gates quotes skill `definition-of-done` Visual work (375, 809, 1440;
  `UNSEEN` caps Confidence at 6) — point at that section, do not copy it.
- **Stakes** → `trivial|standard|sensitive|critical`. Start at the row
  default; only go up. Auth, secrets, user data, or money start at
  `sensitive`. Reviews default to `sensitive`.
- **Authorisation** → `none` (read-only), `owner` (this request asked for
  writes), `explicit-go` (publish / merge / force-push / deploy / secrets).
  A `release` surface without `explicit-go` uses the `release-stop` overlay.

**Mode:** `interactive` unless the user text or session is clearly bot,
headless, CI, or non-interactive. Interactive: at most one closed question
when ambiguous. Bot: no questions; pick the conservative row; label it an
assumption; stop before any irreversible step.

**Conservative tie-break** (bot, or interactive after one refused question):
read-only over write; stop-and-ask over ship; never `release` without
`explicit-go`.

If the destination skill folder is missing, `Stops` names the installed
preset and the run ends.

## 2. Route card

```
Route: <command>
Skill: <destination skill>
Via: orchestrate | open-skill | stop
Stakes: trivial|standard|sensitive|critical
Mode: interactive | bot
Surface: code|docs|kit|ui|public-api|release|none
Authorisation: none | owner | explicit-go
Chain: <short playbook chain>
Gates: <tokenomics gates; UI DoD v2 one-liner when surface=ui>
Stops: <approval / missing skill / release / irreversible>
```

Interactive and (stakes ≥ `sensitive`, or surface `public-api` or
`release`): stop for plan approval before writes. Release routes stop and
never ship without an explicit go.

## 3. Delegate

Reuse skill `orchestrate` and `.agents/tokenomics.md`. Do not add a model matrix,
a build-team table, or a second dispatch. After hand-off, model
selection stays `zedkit-ai route <agent> --kind <k> --stakes <s>
--provider <active-tool>`: cheap cells (`build`/`check` at `trivial`/`standard`)
by default; stronger cells only for business or user-need decisions
(`decide`/`design` at `sensitive+`) and for reviews (`check` at
`sensitive+`). No substitution. Never fast unless this request asked for
fast.

- **via orchestrate:** open `.agents/skills/orchestrate/SKILL.md` by path
  with `Playbook: <command>` and the card fields. Follow it here.
- **via open-skill:** open that row's destination
  `.agents/skills/<name>/SKILL.md` by path and follow it here (that skill
  keeps its own intro and stops).
- **via stop:** print the card and end. Do not ship.
