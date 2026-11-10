---
schema: 1
default_provider: cursor
# Project overrides only. Unset cells keep kit defaults (`model: inherit`).
# Models live in this providers block. Do not name them in the body.
# A cell is a base `model` plus `effort`; `route` prints the encoded id.
providers:
  cursor:
    decide:
      trivial: { model: cursor-grok-4.6-xhigh, effort: medium }
      standard: { model: cursor-grok-4.6-xhigh, effort: high }
      sensitive: { model: claude-sonnet-5-5, effort: max }
      critical: { model: claude-opus-5-5-high, effort: high }
    design:
      trivial: { model: cursor-grok-4.6-xhigh, effort: medium }
      standard: { model: cursor-grok-4.6-xhigh, effort: high }
      sensitive: { model: claude-sonnet-5-5, effort: max }
      critical: { model: claude-opus-5-5-high, effort: high }
    build:
      trivial: { model: composer-2.5, effort: medium }
      standard: { model: composer-2.5, effort: medium }
      sensitive: { model: cursor-grok-4.6-xhigh, effort: high }
      critical: { model: claude-sonnet-5-5, effort: max }
    check:
      trivial: { model: composer-2.5, effort: medium }
      standard: { model: composer-2.5, effort: medium }
      sensitive: { model: claude-sonnet-5-5, effort: max }
      critical: { model: claude-opus-5-5-high, effort: high }
  muse:
    decide:
      trivial: { model: muse-spark-1.3-contributor, effort: medium }
      standard: { model: muse-spark-1.3-contributor, effort: high }
      sensitive: { model: muse-wonder-1.0, effort: high }
      critical: { model: muse-wonder-full-1.0, effort: high }
    design:
      trivial: { model: muse-spark-1.3-contributor, effort: medium }
      standard: { model: muse-spark-1.3-contributor, effort: high }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-wonder-full-1.0, effort: high }
    build:
      trivial: { model: muse-ember-1.0, effort: medium }
      standard: { model: muse-ember-1.0, effort: medium }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-spark-1.3-contributor, effort: high }
    check:
      trivial: { model: muse-ember-1.0, effort: medium }
      standard: { model: muse-ember-1.0, effort: medium }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-wonder-full-1.0, effort: high }
---

# Tokenomics

This file decides which model and effort each kind of work gets, per tool.
Source agents never name a model: they declare a role and default needs, and
the cell for the call (kind x stakes) decides.

## How to change it

- Edit the `model` (a base id, no thinking suffix) and `effort` of a cell in
  the frontmatter above. On Cursor, `route` encodes the pair into the listed
  id (`max` prints as `xhigh`); composer, Muse and Claude stay bare.
- Models are named only in the `providers` block of that frontmatter. This
  prose may explain why a model was chosen.
- Stakes are the main lever. A bug on a payment button is `critical` even if
  the fix is one line. Needs (reasoning, context) can shift the column one
  step toward `sensitive`; `reasoning=low` lowers cheap cells one effort step.

## Rules that hold

- The cheapest cells never decide. Synthesis, verdicts and anything touching
  money, auth or data loss stay on `sensitive` cells or above.
- `sensitive` work gets a recorded review. `critical` work also gets a second,
  independent review and a human validation line before merge.
- Record the cell used, with its kind and stakes, in the plan and the setup
  log.
- A spawn uses this file's cell for the running provider, the call's kind,
  and the task's stakes. Pass that model id. Do not substitute the parent
  model, another family, or a fast mode. If the cell is missing or `inherit`,
  do not spawn. If the tool rejects the printed id, stop and report it; do
  not substitute.
- Never spawn a fast mode, or a model id with a `fast` token, unless the user
  explicitly requested fast mode in this request.

## This repo

Cursor is the parent. Each cell holds a base `model` and an `effort`; the
printed id may still be rejected by the session's Task allowlist, which is not
the cell. The table floor is medium; runtime `low` exists only for
`reasoning=low` on cheap check. Sensitive Sonnet cells use `max`. Muse uses
Ember on trivial and standard build and check, Spark elsewhere, Wonder on
decide sensitive, and Wonder Full on decide critical, design critical, and
check critical. Codex and Claude stay on shipped defaults.
