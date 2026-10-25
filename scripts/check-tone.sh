#!/usr/bin/env bash
# Tone guard: the public repo keeps a neutral, professional tone.
# Fails on self-promotional marketing terms in tracked contents and
# paths, untracked contents, and (on pull_request events) the PR
# title + body — squash merges copy those into history, so the file
# scan alone cannot catch them. This file holds the enforcement
# list, so it exempts itself (same shape as check-no-private-refs).
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

terms='\b(vitrine|showcase)\b'
self="scripts/check-tone.sh"
fail=0

if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] && [ -n "${GITHUB_REF:-}" ]; then
  pr="${GITHUB_REF#refs/pull/}"
  pr="${pr%/merge}"
  case "$pr" in ''|*[!0-9]*) ;; *) {
    meta="$(gh pr view "$pr" --json title,body --jq '.title + "\n" + (.body // "")' 2>/dev/null || true)"
    if printf '%s\n' "$meta" | grep -qiE -e "$terms"; then
      echo "banned marketing terms in PR #$pr title/body (they land in squash history):"
      printf '%s\n' "$meta" | grep -inE -e "$terms" | head -5
      fail=1
    fi
  } ;; esac
fi

hits=$(git grep -inE -e "$terms" -- . ":!$self" || true)
if [ -n "$hits" ]; then
  echo "banned marketing terms in tracked contents:"
  echo "$hits"
  fail=1
fi

paths=$(git ls-files | grep -iE -e "$terms" || true)
if [ -n "$paths" ]; then
  echo "banned marketing terms in tracked paths:"
  echo "$paths"
  fail=1
fi

untracked=$(git ls-files --others --exclude-standard || true)
if [ -n "$untracked" ]; then
  ufiltered=$(printf '%s\n' "$untracked" | grep -vE "^$self$" || true)
  if [ -n "$ufiltered" ]; then
    uhits=$(printf '%s\n' "$ufiltered" | xargs grep -HinE -e "$terms" -- 2>/dev/null || true)
    if [ -n "$uhits" ]; then
      echo "banned marketing terms in untracked contents:"
      echo "$uhits"
      fail=1
    fi
  fi
fi

[ "$fail" -eq 0 ] || exit 1
echo "tone: ok"
