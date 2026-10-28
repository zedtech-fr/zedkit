#!/usr/bin/env bash
# Shared private-term patterns for the repo hygiene scripts. Stored
# base64-encoded and decoded only in memory, so no script file spells them
# out. Source this file; do not execute it. To extend the list, append the
# base64 of the new pattern (without trailing newline) to ENCODED.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "source this file, do not execute it" >&2
  exit 1
fi

DENYLIST_ENCODED=(
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

_denylist_b64decode() {
  # GNU coreutils uses -d; older macOS uses -D.
  if printf '' | base64 -d >/dev/null 2>&1; then
    base64 -d
  else
    base64 -D
  fi
}

# Prints the patterns as one |-alternation for grep -E. Decodes one blob
# per line: a single base64 -d call would fuse the blobs (the decoder
# ignores newlines in its input).
denylist_pattern() {
  for enc in "${DENYLIST_ENCODED[@]}"; do
    printf '%s' "$enc" | _denylist_b64decode
    echo
  done | paste -sd'|' -
}

# Public npm scopes allowed in dependency and import lines.
denylist_filter_hits() {
  grep -vE '@aws-sdk/' || true
}
