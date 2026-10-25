#!/usr/bin/env bash
# Boost PR gate (lot G): PRs that touch package code or user-facing surfaces
# must carry a "Lenses run" table and filled "Personas" verdicts (OK /
# reservations / blocking + proof). Read-only via the gh API. Skips outside
# pull_request events and when no guarded paths change.
set -uo pipefail

[ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] || exit 0
[ -n "${GITHUB_REF:-}" ] || exit 0
pr="${GITHUB_REF#refs/pull/}"
pr="${pr%/merge}"
case "$pr" in ''|*[!0-9]*) exit 0 ;; esac

files="$(gh pr view "$pr" --json files --jq '.files[].path' 2>/dev/null || true)"
touch_packages=false
touch_personas=false
echo "$files" | grep -qE '^packages/' && touch_packages=true
echo "$files" | grep -qE '^(apps/docs/|README\.md|docs/|scripts/registry/)' && touch_personas=true

[ "$touch_packages" = true ] || [ "$touch_personas" = true ] || exit 0

body="$(gh pr view "$pr" --json body --jq '.body // ""' 2>/dev/null || true)"

require_lenses() {
  echo "$body" | grep -q 'Lenses run' || {
    echo "PR #$pr must include a Lenses run table (code, ponytail, persona, quality gate)"
    exit 1
  }
  echo "$body" | grep -qE '\| *(code|Lens) *\|' || {
    echo "PR #$pr Lenses run section should be a markdown table (lens, ran?, evidence)"
    exit 1
  }
}

require_personas() {
  echo "$body" | grep -q '## Personas' || {
    echo "PR #$pr must include a ## Personas section with verdicts and proof"
    exit 1
  }
  echo "$body" | grep -qE '\|[^|\n]+\| *(OK|reservations|blocking|réserves|bloquant|Reservations|Blocking) *\|' || {
    echo "PR #$pr Personas table needs at least one verdict (OK / reservations / blocking) per row"
    exit 1
  }
  filled="$(echo "$body" | grep -cE '\|[^|\n]+\| *(OK|reservations|blocking|réserves|bloquant|Reservations|Blocking) *\|' || true)"
  if [ "${filled:-0}" -lt 5 ]; then
    echo "PR #$pr Personas table looks incomplete (expected several filled verdict rows, got ${filled:-0})"
    exit 1
  fi
}

if [ "$touch_packages" = true ] || [ "$touch_personas" = true ]; then
  require_lenses
fi
if [ "$touch_personas" = true ]; then
  require_personas
fi

echo "pr-lenses: ok"
