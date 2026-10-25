#!/usr/bin/env bash
# Breaking-change guard: a PR labelled `breaking` must carry a changeset
# with a minor-or-major bump AND a one-line migration note (`old -> new`
# or the word "migration"). Read-only: uses the gh API + the checked-out
# PR head. Skips silently outside pull_request events.
set -uo pipefail

[ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] || exit 0
[ -n "${GITHUB_REF:-}" ] || exit 0
pr="${GITHUB_REF#refs/pull/}"
pr="${pr%/merge}"
case "$pr" in ''|*[!0-9]*) exit 0 ;; esac

labels="$(gh pr view "$pr" --json labels --jq '.labels[].name' 2>/dev/null || true)"
echo "$labels" | grep -qx 'breaking' || exit 0

files="$(gh pr view "$pr" --json files --jq '.files[].path' 2>/dev/null | grep -E '^\.changeset/[^/]+\.md$' || true)"
[ -n "$files" ] || { echo "breaking PR #$pr carries no .changeset/*.md file"; exit 1; }

fail=0
while IFS= read -r file; do
  [ -f "$file" ] || continue
  grep -qE '": (minor|major)"' "$file" || { echo "$file: breaking change needs a minor-or-major bump"; fail=1; }
  grep -qiE '\->|migrat' "$file" || { echo "$file: add a one-line migration note (old -> new)"; fail=1; }
done <<< "$files"
[ "$fail" -eq 0 ] || exit 1
echo "breaking-changeset: ok"
