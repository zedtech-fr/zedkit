#!/usr/bin/env bash
# Optionally overwrite the public run history stand-in from a generated
# run index before the docs build. Fail-open when env is unset, the
# local file is missing, or scp fails. Fail-closed when a present file
# fails the copy gate.
#
# Usage: ingest-public-reviews.sh [dest]
# dest defaults to apps/docs/features/reviews/adapters/public-reviews.json
# under this repo. Tests pass a temp dest so they never write the
# checked-in stand-in.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="${1:-$root/apps/docs/features/reviews/adapters/public-reviews.json}"

if [ -z "${PUBLIC_REVIEWS_SNAPSHOT:-}" ]; then
  echo "PUBLIC_REVIEWS_SNAPSHOT unset; keeping stand-in"
  exit 0
fi
case "${PUBLIC_REVIEWS_SNAPSHOT}" in
  -*) echo "PUBLIC_REVIEWS_SNAPSHOT must not start with -" >&2; exit 1 ;;
esac
if [ -n "${PUBLIC_REVIEWS_SNAPSHOT_REMOTE:-}" ]; then
  case "${PUBLIC_REVIEWS_SNAPSHOT_REMOTE}" in
    -*) echo "PUBLIC_REVIEWS_SNAPSHOT_REMOTE must not start with -" >&2; exit 1 ;;
  esac
  scp_status=0
  scp "zed-dev:${PUBLIC_REVIEWS_SNAPSHOT_REMOTE}" "${PUBLIC_REVIEWS_SNAPSHOT}" || scp_status=$?
  if [ "$scp_status" -ne 0 ]; then
    echo "generated run index scp failed (exit ${scp_status}); keeping stand-in"
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      echo "generated run index scp failed (exit ${scp_status}); keeping stand-in" >> "$GITHUB_STEP_SUMMARY"
    fi
    exit 0
  fi
fi
if [ ! -f "${PUBLIC_REVIEWS_SNAPSHOT}" ]; then
  echo "generated run index missing; keeping stand-in"
  exit 0
fi
node "$root/apps/docs/scripts/copy-public-reviews-snapshot.mjs" \
  "${PUBLIC_REVIEWS_SNAPSHOT}" \
  "$dest"
