#!/usr/bin/env bash
# Lenses-table guard: a PR touching packages/* must carry the "Lenses run"
# table in its body (lens, ran-or-skipped + reason, evidence). Read-only:
# uses the gh API. Skips silently outside pull_request events and for PRs
# that touch no package code.
set -uo pipefail

[ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] || exit 0
[ -n "${GITHUB_REF:-}" ] || exit 0
pr="${GITHUB_REF#refs/pull/}"
pr="${pr%/merge}"
case "$pr" in ''|*[!0-9]*) exit 0 ;; esac

files="$(gh pr view "$pr" --json files --jq '.files[].path' 2>/dev/null || true)"
echo "$files" | grep -qE '^packages/' || exit 0

body="$(gh pr view "$pr" --json body --jq '.body // ""' 2>/dev/null || true)"
echo "$body" | grep -q 'Lenses run' || {
  echo "PR #$pr touches packages/* but its body has no Lenses run table"
  exit 1
}
echo "$body" | grep -qE '\| *(code|Lens) *\|' || {
  echo "PR #$pr Lenses run section should be a table (lens, ran?, evidence)"
  exit 1
}
echo "pr-lenses: ok"
