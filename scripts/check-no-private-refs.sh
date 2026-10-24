#!/usr/bin/env bash
# Fails if private project names or private customer/domain/vendor terms
# appear in tracked file contents, tracked file paths, or untracked (but not
# ignored) file contents. This is a PUBLIC repo: they must never appear in
# code, docs, comments, paths, or config. The patterns are stored base64-encoded and decoded only
# in memory, so this file itself never spells them out. To extend the list,
# append the base64 of the new pattern (without trailing newline) to ENCODED.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

ENCODED=(
  'emVkb3M='
  'emVkYnJpZGdl'
  'bGl0dGxlLj9iaWNlcHM='
  'cm9tYWlu'
  # Customer, domain and vendor terms of private work. Same rule: never here.
  'a29sZWN0bw=='
  'b2QtP3BkcA=='
  'ZS0/ZmFjdHU='
  'ZS0/aW52b2lj'
  'ZmFjdHVyLT94'
  'c2VyZW5zaWE='
  'ZG94YWxsaWE='
  'ZGF0YWRvZw=='
  'bG9jYWxzdGFjaw=='
  'ZXZlbnRicmlkZ2U='
  'KF58W15hLXpdKWF3cyhbXmEtel18JCk='
  'KF58W15hLXpdKXNxcyhbXmEtel18JCk='
  'YmFjay0/b2ZmaWNl'
  'bm90aW9u'
  'ZmFjdHVyYXRpb24='
  'c3FsWyAtXWFzWyAtXWFbIC1dc2VydmljZQ=='
  'ZW5yb2xs'
  'KF58W15hLXpdKShwdXJjaGFzZXxzYWxlcykoW15hLXpdfCQp'
  'amlyYQ=='
  'YXRsYXNzaWFu'
  'cG9zdG1hbg=='
  'ZmlyZWhvc2U='
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
  done | paste -sd'|' -
)

fail=0

# pnpm-lock.yaml is machine-generated: integrity hashes are random base64 and
# will eventually contain any short word pattern. Excluded from the content
# scan (it cannot carry a prose reference).
hits=$(git grep -inE -e "$patterns" -- . ':!pnpm-lock.yaml' || true)
if [ -n "$hits" ]; then
  echo "private project references in tracked file contents:"
  echo "$hits"
  fail=1
fi

paths=$(git ls-files | grep -iE -e "$patterns" || true)
if [ -n "$paths" ]; then
  echo "private project references in tracked file paths:"
  echo "$paths"
  fail=1
fi

untracked=$(git ls-files --others --exclude-standard || true)
if [ -n "$untracked" ]; then
  untracked_hits=$(printf '%s\n' "$untracked" | xargs grep -HinE -e "$patterns" -- 2>/dev/null || true)
  if [ -n "$untracked_hits" ]; then
    echo "private project references in untracked file contents:"
    echo "$untracked_hits"
    fail=1
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "check-no-private-refs: FAILED"
  exit 1
fi
echo "check-no-private-refs: ok"
