---
schema: 1
# The kit ships a full default policy and reads it from the package, so this
# file only holds what your project changes. Every cell defaults to
# `model: inherit` (the session model) with a default effort.
#
# Set a model for one <kind>.<stakes> cell, for one provider:
#
# providers:
#   cursor:
#     build:
#       standard: { model: <base model id, no thinking suffix>, effort: medium }
#
# kind:   decide | design | build | check (how an agent is used for one call)
# stakes: trivial | standard | sensitive | critical (how much is at risk)
# effort: low | medium | high | max
---

# Tokenomics

This file decides which model and effort each kind of work gets, per tool.
Source agents never name a model: they declare a role and default needs, and
the cell for the call (kind x stakes) decides.

## How to change it

- Edit the `model` (a base id, no thinking suffix such as `-high`) and the
  `effort` of a cell in the frontmatter above. On Cursor, `route` encodes the
  pair into the id the tool lists (`max` prints as `xhigh`). An id that already
  ends in a level is kept as written and its `effort` is not applied: strip
  `-low`, `-medium`, `-high` or `-xhigh` to re-enable `effort`. Upgrade the kit
  before writing bare cells.
- Models are named only in the `providers` block of that frontmatter. This
  prose may explain why a model was chosen.
- Stakes are the main lever. A bug on a payment button is `critical` even if
  the fix is one line. Needs (reasoning, context) can shift the column one
  step toward `sensitive`.

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
  do not spawn.
- Never spawn a fast mode, or a model id with a `fast` token, unless the user
  explicitly requested fast mode in this request.
