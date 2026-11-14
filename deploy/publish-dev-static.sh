#!/usr/bin/env bash
# Publish the static docs export to a staging site directory only.
# Static files only: no reverse-proxy reload, no container recreate, no
# suggest env, and no git checkout on the host.
#
# Usage: publish-dev-static.sh <ssh-target> [dest-key]
# dest-key defaults to zed-dev. Destinations are allowlisted in this
# script so a caller cannot retarget them.
set -euo pipefail

target="${1:?usage: publish-dev-static.sh <ssh-target> [dest-key]}"
dest_key="${2:-zed-dev}"
case "$dest_key" in
  zed-dev) remote="/data/srv/zedkit" ;;
  zed-epic-73) remote="/data/srv/zedkit-epic-73" ;;
  *)
    echo "publish-dev-static: unknown dest $dest_key" >&2
    exit 1
    ;;
esac
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="${DEPLOY_OUT:-$root/apps/docs/out}"

if [ ! -f "$out/index.html" ]; then
  echo "publish-dev-static: $out/index.html not found; build the docs first" >&2
  exit 1
fi

branch="${DEV_BRANCH:-}"
if [ -z "$branch" ]; then
  branch="$(git -C "$root" branch --show-current 2>/dev/null || echo manual)"
fi
sha="${DEV_SHA:-}"
if [ -z "$sha" ]; then
  sha="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
fi
printf 'branch=%s\ncommit=%s\nbuilt=%s\n' "$branch" "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$out/dev-build.txt"
printf 'User-agent: *\nDisallow: /\n' > "$out/robots.txt"

# Refuse a dest that is missing, a git checkout, or not the real directory.
ssh "$target" "set -euo pipefail
dest='$remote'
if [ ! -d \"\$dest\" ]; then
  echo \"publish-dev-static: missing directory \$dest\" >&2
  exit 1
fi
if [ -e \"\$dest/.git\" ]; then
  echo \"publish-dev-static: refusing git worktree at \$dest\" >&2
  exit 1
fi
real=\$(readlink -f \"\$dest\")
if [ \"\$real\" != \"\$dest\" ]; then
  echo \"publish-dev-static: refusing symlink dest \$dest -> \$real\" >&2
  exit 1
fi
"

rsync -a --delete --exclude '.git' "$out/" "$target:$remote/"
echo "publish-dev-static: $sha -> $remote"
