#!/usr/bin/env bash
# Publish the static docs build to the web host.
#
# Usage: deploy.sh [--dev] <ssh-target> [remote-dir]
#   --dev       publish to the dev site directory and stamp the build;
#               content only: no config upload, no service changes
#   ssh-target  user@host of a machine with Docker and Compose installed
#   remote-dir  directory on the host (default: /srv/app)
#
# Run `pnpm --filter @zedtech/zedkit-docs build` first: the output
# directory apps/docs/out is what gets published. Idempotent; safe to re-run.
set -euo pipefail

mode="prod"
if [ "${1:-}" = "--dev" ]; then
  mode="dev"
  shift
fi

target="${1:?usage: deploy.sh [--dev] <ssh-target> [remote-dir]}"
remote="${2:-/srv/app}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/docs/out"

if [ ! -f "$out/index.html" ]; then
  echo "deploy: $out/index.html not found; build the docs first" >&2
  exit 1
fi

site="$remote/site"
if [ "$mode" = "dev" ]; then
  site="$remote/site-dev"
fi
case "$site" in
  "$remote/site"|"$remote/site-dev") ;;
  *) echo "deploy: refusing unexpected site dir: $site" >&2; exit 1 ;;
esac

ssh "$target" "mkdir -p '$remote/site' '$remote/site-dev' '$remote/suggest'"
if [ "$mode" = "prod" ]; then
  scp -q "$root/deploy/Caddyfile" "$root/deploy/compose.yaml" "$target:$remote/"
  # Gate: the host image must accept the config before anything restarts.
  ssh "$target" "docker run --rm -v '$remote/Caddyfile:/etc/caddy/Caddyfile:ro' caddy:2 caddy validate --config /etc/caddy/Caddyfile"
  rsync -a --delete --exclude '*.test.mjs' "$root/deploy/suggest/" "$target:$remote/suggest/"
  if [ -f "$root/deploy/suggest.env" ]; then
    scp -q "$root/deploy/suggest.env" "$target:$remote/suggest.env"
  else
    ssh "$target" "umask 077; : > '$remote/suggest.env'"
  fi
else
  branch="${DEV_BRANCH:-}"
  if [ -z "$branch" ]; then
    branch="$(git -C "$root" branch --show-current 2>/dev/null || echo manual)"
  fi
  sha="${DEV_SHA:-}"
  if [ -z "$sha" ]; then
    sha="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
  fi
  printf 'branch=%s\ncommit=%s\nbuilt=%s\n' "$branch" "$sha" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$out/dev-build.txt"
  printf 'User-agent: *\nDisallow: /' > "$out/robots.txt"
fi
rsync -a --delete "$out/" "$target:$site/"
if [ "$mode" = "prod" ]; then
  ssh "$target" "cd '$remote' && docker compose up -d --remove-orphans && docker compose ps --status running -q caddy | grep -q . && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"
fi
echo "deploy: done"
