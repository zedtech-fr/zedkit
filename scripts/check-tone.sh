#!/usr/bin/env bash
# Tone guard: the public repo keeps a neutral, professional tone.
# Fails on self-promotional marketing terms, internal review-lane
# names, coding-agent product names, and private workflow labels in
# tracked contents and paths, untracked contents, and (on
# pull_request events) the PR title + body — squash merges copy
# those into history, so the file scan alone cannot catch them.
#
# Enforcement list, base64-encoded and decoded only in memory (same
# rule as denylist-patterns.sh): no file in this repo spells the
# banned terms out, including this one — so unlike before, this
# script no longer exempts itself. To extend, append the base64 of
# the new term (without trailing newline) to TONE_ENCODED.
# Kit --provider ids (lowercase, no digit suffix) stay allowed.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

TONE_ENCODED=(
  'dml0cmluZQ=='
  'c2hvd2Nhc2U='
  'bXVzZVswLTldKw=='
  'Y3Vyc29yLWFnZW50'
  'Y29tcG9zZXI='
  'c3VwZXJ2aXNpb24='
)

# Mirrors _denylist_b64decode: GNU coreutils uses -d, older macOS -D.
_tone_b64decode() {
  if printf '' | base64 -d >/dev/null 2>&1; then
    base64 -d
  else
    base64 -D
  fi
}

# Prints the terms as one |-alternation. Decodes one blob per line:
# a single base64 -d call would fuse the blobs (the decoder ignores
# newlines in its input).
_tone_pattern() {
  for enc in "${TONE_ENCODED[@]}"; do
    printf '%s' "$enc" | _tone_b64decode
    echo
  done | paste -sd'|' -
}

terms="\b($(_tone_pattern))\b"
fail=0

if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] && [ -n "${GITHUB_REF:-}" ]; then
  pr="${GITHUB_REF#refs/pull/}"
  pr="${pr%/merge}"
  case "$pr" in ''|*[!0-9]*) ;; *) {
    meta="$(gh pr view "$pr" --json title,body --jq '.title + "\n" + (.body // "")' 2>/dev/null || true)"
    if printf '%s\n' "$meta" | grep -qiE -e "$terms"; then
      echo "banned tone terms in PR #$pr title/body (they land in squash history):"
      printf '%s\n' "$meta" | grep -inE -e "$terms" | head -5
      fail=1
    fi
  } ;; esac
fi

hits=$(git grep -inE -e "$terms" -- . || true)
if [ -n "$hits" ]; then
  echo "banned tone terms in tracked contents:"
  echo "$hits"
  fail=1
fi

paths=$(git ls-files | grep -iE -e "$terms" || true)
if [ -n "$paths" ]; then
  echo "banned tone terms in tracked paths:"
  echo "$paths"
  fail=1
fi

untracked=$(git ls-files --others --exclude-standard || true)
if [ -n "$untracked" ]; then
  uhits=$(printf '%s\n' "$untracked" | xargs grep -HinE -e "$terms" -- 2>/dev/null || true)
  if [ -n "$uhits" ]; then
    echo "banned tone terms in untracked contents:"
    echo "$uhits"
    fail=1
  fi
fi

[ "$fail" -eq 0 ] || exit 1
echo "tone: ok"
