#!/usr/bin/env bash
# Tone guard: the public repo keeps a neutral, professional tone.
# Fails on self-promotional marketing terms, a short phrasing list,
# and internal review-lane names, actor spellings, and private
# workflow labels in tracked contents and paths, untracked contents,
# and (on pull_request events) the PR title + body — squash merges
# copy those into history, so the file scan alone cannot catch them.
#
# Enforcement lists, base64-encoded and decoded only in memory (same
# rule as denylist-patterns.sh): no file in this repo spells the
# banned terms out, including this one. To extend, append the base64
# of the new term (without trailing newline) to the right list.
# Marketing terms and lane-id patterns are case-insensitive; actor
# spellings are case-sensitive so plain kit --provider names stay
# legal. Never spell a banned term in this file; encoded lists only.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

TONE_ENCODED=(
  'dml0cmluZQ=='
  'c2hvd2Nhc2U='
)

TOOLS_ENCODED=(
  'Q2xhdWRlWzAtOV0='
  'Q3Vyc29yLWFnZW50'
  'Q29tcG9zZXI='
  'U3VwZXJ2aXNpb24='
  'R3JvayBCb3Q='
  'cnYta2l0'
  'cnYtYnJpZGdl'
  'cmV2aWV3LWZhc3Q='
  'emVkb3MtYm90'
)

LANE_ENCODED=(
  'bXVzZVswLTldKw=='
)

# Short preaching/charter phrasing (decoded only in memory).
PHRASING_ENCODED=(
  'YmVzdCBwcmFjdGljZQ=='
  'YmVzdCBwcmFjdGljZXM='
  'aW5kdXN0cnkgc3RhbmRhcmQ='
)

# Mirrors _denylist_b64decode: GNU coreutils uses -d, older macOS -D.
_tone_b64decode() {
  if printf '' | base64 -d >/dev/null 2>&1; then
    base64 -d
  else
    base64 -D
  fi
}

# Prints blobs as one |-alternation. Decodes one blob per line:
# a single base64 -d call would fuse the blobs (the decoder ignores
# newlines in its input).
_alternation() {
  for enc in "$@"; do
    printf '%s' "$enc" | _tone_b64decode
    echo
  done | paste -sd'|' -
}

terms="\b($(_alternation "${TONE_ENCODED[@]}"))\b"
tools="\b($(_alternation "${TOOLS_ENCODED[@]}"))\b"
lanes="\b($(_alternation "${LANE_ENCODED[@]}"))\b"
phrasing="\b($(_alternation "${PHRASING_ENCODED[@]}"))\b"
fail=0

# $1 = ERE, $2 = i for case-insensitive grep, empty for case-sensitive.
_grep_ere() {
  if [ "$1" = "i" ]; then
    grep -iE "${@:2}"
  else
    grep -E "${@:2}"
  fi
}

_git_grep_ere() {
  if [ "$1" = "i" ]; then
    git grep -inE "${@:2}"
  else
    git grep -nE "${@:2}"
  fi
}

# Public live-service slug is the same token as an internal actor name.
# Allow it as a quoted string or URL path; prose still fails.
_filter_public_live_slug() {
  local slug
  slug=$(printf '%s' "${TOOLS_ENCODED[8]}" | _tone_b64decode)
  grep -vE "/${slug}/|\"${slug}\"" || true
}

# Scan every surface for one pattern. $1 = ERE, $2 = i or empty, $3 = label.
# $4 = public-slug to allowlist the hosted live-service path/string.
_scan() {
  local pattern="$1" iflag="$2" label="$3" allow="${4:-}"
  if [ "${GITHUB_EVENT_NAME:-}" = "pull_request" ] && [ -n "${GITHUB_REF:-}" ]; then
    local pr="${GITHUB_REF#refs/pull/}"
    pr="${pr%/merge}"
    case "$pr" in ''|*[!0-9]*) ;; *) {
      local meta
      meta="$(gh pr view "$pr" --json title,body --jq '.title + "\n" + (.body // "")' 2>/dev/null || true)"
      if printf '%s\n' "$meta" | _grep_ere "$iflag" -e "$pattern" -q; then
        echo "$label in PR #$pr title/body (they land in squash history):"
        printf '%s\n' "$meta" | _grep_ere "$iflag" -n -e "$pattern" | head -5
        fail=1
      fi
    } ;; esac
  fi

  local hits
  hits=$(_git_grep_ere "$iflag" -e "$pattern" -- . || true)
  if [ "$allow" = "public-slug" ] && [ -n "$hits" ]; then
    hits=$(printf '%s\n' "$hits" | _filter_public_live_slug)
  fi
  if [ -n "$hits" ]; then
    echo "$label in tracked contents:"
    echo "$hits"
    fail=1
  fi

  local paths
  paths=$(git ls-files | _grep_ere "$iflag" -e "$pattern" || true)
  if [ "$allow" = "public-slug" ] && [ -n "$paths" ]; then
    paths=$(printf '%s\n' "$paths" | _filter_public_live_slug)
  fi
  if [ -n "$paths" ]; then
    echo "$label in tracked paths:"
    echo "$paths"
    fail=1
  fi

  local untracked
  untracked=$(git ls-files --others --exclude-standard || true)
  if [ -n "$untracked" ]; then
    local uhits
    if [ "$iflag" = "i" ]; then
      uhits=$(printf '%s\n' "$untracked" | xargs grep -HinE -e "$pattern" -- 2>/dev/null || true)
    else
      uhits=$(printf '%s\n' "$untracked" | xargs grep -HnE -e "$pattern" -- 2>/dev/null || true)
    fi
    if [ "$allow" = "public-slug" ] && [ -n "$uhits" ]; then
      uhits=$(printf '%s\n' "$uhits" | _filter_public_live_slug)
    fi
    if [ -n "$uhits" ]; then
      echo "$label in untracked contents:"
      echo "$uhits"
      fail=1
    fi
  fi
}

_scan "$terms" "i" "banned marketing terms"
_scan "$tools" "" "internal review actor/tool names" "public-slug"
_scan "$lanes" "i" "internal review lane ids"
_scan "$phrasing" "i" "banned phrasing"

[ "$fail" -eq 0 ] || exit 1
echo "tone: ok"
