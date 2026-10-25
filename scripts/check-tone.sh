#!/usr/bin/env bash
# Tone guard: the public repo keeps a neutral, professional tone.
# Fails on self-promotional marketing terms in tracked contents and
# paths plus untracked contents. This file holds the enforcement
# list, so it exempts itself (same shape as check-no-private-refs).
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

terms='\b(vitrine|showcase)\b'
self="scripts/check-tone.sh"
fail=0

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
