#!/usr/bin/env bash
# Fails if any tracked file names a private project. This is a PUBLIC repo:
# private project names must never appear in code, docs, comments, or config.
# The patterns are stored base64-encoded and decoded only in memory, so this
# file itself never spells them out. To extend the list, append the base64 of
# the new pattern (without trailing newline) to ENCODED below.
set -uo pipefail

ENCODED=(
  'emVkb3M='
  'emVkYnJpZGdl'
  'bGl0dGxlLj9iaWNlcHM='
  'cm9tYWlu'
)

b64decode() {
  # GNU coreutils uses -d; older macOS uses -D.
  if printf '' | base64 -d >/dev/null 2>&1; then
    base64 -d
  else
    base64 -D
  fi
}

# Decode one blob per line: a single base64 -d call would fuse the blobs
# (decoder ignores newlines in its input).
patterns=$(
  for enc in "${ENCODED[@]}"; do
    printf '%s' "$enc" | b64decode
    echo
  done | paste -sd'|'
)
hits=$(git grep -inE -e "$patterns" -- . || true)
if [ -n "$hits" ]; then
  echo "private project references found in tracked files:"
  echo "$hits"
  echo "check-no-private-refs: FAILED"
  exit 1
fi
echo "check-no-private-refs: ok"
