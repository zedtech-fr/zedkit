#!/usr/bin/env bash
# Fails if private project names or private customer/domain/vendor terms
# appear in tracked file contents, tracked file paths, or untracked (but not
# ignored) file contents. This is a PUBLIC repo: they must never appear in
# code, docs, comments, paths, or config. Patterns live in
# denylist-patterns.sh (shared with check-pack.sh).
set -uo pipefail

# shellcheck source=denylist-patterns.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/denylist-patterns.sh"

cd "$(git rev-parse --show-toplevel)"

patterns="$(denylist_pattern)"

fail=0

# pnpm-lock.yaml is machine-generated: integrity hashes are random base64 and
# will eventually contain any short word pattern. Excluded from the content
# scan (it cannot carry a prose reference).
hits=$(git grep -inE -e "$patterns" -- . ':!pnpm-lock.yaml' | denylist_filter_hits || true)
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
