#!/usr/bin/env bash
# Push a git tag and create a GitHub release for every public package
# whose current version is on npm but has no tag/release yet.
# changesets/action only tags what it detects in the publish output;
# newer @changesets/cli output is not detected, so do it explicitly.
# Idempotent: existing tags and releases are left untouched (no force).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=release-tags-lib.sh
source "$ROOT/scripts/release-tags-lib.sh"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
      echo "usage: release-tags.sh [--dry-run]"
      exit 0
      ;;
    *)
      echo "unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

for pkg in packages/*/package.json; do
  name=$(jq -r '.name' "$pkg")
  version=$(jq -r '.version' "$pkg")
  private=$(jq -r '.private // false' "$pkg")
  [ "$private" = "true" ] && continue
  tag="$name@$version"
  if ! wait_for_npm_version "$tag"; then
    echo "skip $tag (not on npm)"
    continue
  fi
  if ! git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null; then
    if [ "$DRY_RUN" = "1" ]; then
      echo "dry-run: would push tag $tag"
    else
      git tag "$tag" 2>/dev/null || true
      git push origin "refs/tags/$tag"
      echo "pushed tag $tag"
    fi
  fi
  if ! gh release view "$tag" >/dev/null 2>&1; then
    changelog="$(dirname "$pkg")/CHANGELOG.md"
    notes=""
    if [ -f "$changelog" ]; then
      notes=$(awk -v v="$version" '
        $0 == "## " v { on = 1; next }
        on && /^## / { exit }
        on { print }' "$changelog")
    fi
    [ -n "$notes" ] || notes="$tag"
    if [ "$DRY_RUN" = "1" ]; then
      echo "dry-run: would create release $tag"
    else
      gh release create "$tag" --verify-tag --title "$tag" --notes "$notes"
      echo "created release $tag"
    fi
  fi
done
