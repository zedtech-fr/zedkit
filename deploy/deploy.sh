#!/usr/bin/env bash
# Publish the static docs build to the web host.
#
# Usage: deploy.sh <ssh-target> [remote-dir]
#   ssh-target  user@host of a machine with Docker and Compose installed
#   remote-dir  directory on the host (default: /srv/app)
#
# Run `pnpm --filter @zedtech/zedkit-docs build` first: the output
# directory apps/docs/out is what gets published. Idempotent; safe to re-run.
set -euo pipefail

target="${1:?usage: deploy.sh <ssh-target> [remote-dir]}"
remote="${2:-/srv/app}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/docs/out"

if [ ! -f "$out/index.html" ]; then
  echo "deploy: $out/index.html not found; build the docs first" >&2
  exit 1
fi

ssh "$target" "mkdir -p '$remote/site' '$remote/suggest'"
scp -q "$root/deploy/Caddyfile" "$root/deploy/compose.yaml" "$target:$remote/"
rsync -a --delete --exclude '*.test.mjs' "$root/deploy/suggest/" "$target:$remote/suggest/"
if [ -f "$root/deploy/suggest.env" ]; then
  scp -q "$root/deploy/suggest.env" "$target:$remote/suggest.env"
else
  ssh "$target" "umask 077; : > '$remote/suggest.env'"
fi
rsync -a --delete "$out/" "$target:$remote/site/"
ssh "$target" "cd '$remote' && docker compose up -d --remove-orphans && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"
echo "deploy: done"
