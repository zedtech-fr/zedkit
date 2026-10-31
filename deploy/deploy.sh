#!/usr/bin/env bash
# Publish the static docs build to the web host.
#
# Usage: deploy.sh [--dev|--rollback] <ssh-target> [remote-dir]
#   --dev       publish to the dev site directory and stamp the build;
#               content only: no config upload, no service changes
#   --rollback  restore the config backed up by the last prod deploy
#               and restart from it
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
elif [ "${1:-}" = "--rollback" ]; then
  mode="rollback"
  shift
fi

target="${1:?usage: deploy.sh [--dev|--rollback] <ssh-target> [remote-dir]}"
remote="${2:-/srv/app}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/docs/out"

if [ "$mode" = "rollback" ]; then
  ssh "$target" "cd '$remote' && for f in Caddyfile compose.yaml compose.override.yaml; do if [ -f \"\$f.bak\" ]; then cp \"\$f.bak\" \"\$f\"; fi; done && docker compose up -d --remove-orphans && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"
  echo "deploy: rolled back"
  exit 0
fi

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
  ssh "$target" "cp '$remote/Caddyfile' '$remote/Caddyfile.bak' 2>/dev/null; cp '$remote/compose.yaml' '$remote/compose.yaml.bak' 2>/dev/null; cp '$remote/compose.override.yaml' '$remote/compose.override.yaml.bak' 2>/dev/null; true"
  scp -q "$root/deploy/Caddyfile" "$root/deploy/compose.yaml" "$root/deploy/compose.override.yaml" "$target:$remote/"
  # Gate: the host image must accept the final config before any restart.
  ssh "$target" "docker run --rm -v '$remote/Caddyfile:/etc/caddy/Caddyfile:ro' caddy:2 caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile"
  rsync -a --delete --exclude '*.test.mjs' "$root/deploy/suggest/" "$target:$remote/suggest/"
  suggest_env="${DEPLOY_SUGGEST_ENV:-$root/deploy/suggest.env}"
  if [ -f "$suggest_env" ]; then
    scp -q "$suggest_env" "$target:$remote/suggest.env"
  else
    ssh "$target" "umask 077; : > '$remote/suggest.env'"
  fi
  release_id="${DEPLOY_SHA:-}"
  if [ -z "$release_id" ]; then
    release_id="$(git -C "$root" rev-parse HEAD 2>/dev/null || echo unknown)"
  fi
  # Fingerprint the files the process will actually load. Node does not
  # notice later edits to the mounted directory or env file.
  fp="$(ssh "$target" "sha256sum '$remote/suggest/server.mjs' '$remote/suggest/tokens.mjs' '$remote/suggest.env' | sha256sum | awk '{print \$1}'")"
  release_file="$(mktemp)"
  printf '{"id":"%s","fingerprint":"%s"}\n' "${release_id}:${fp:0:12}" "$fp" > "$release_file"
  scp -q "$release_file" "$target:$remote/suggest/release.json"
  rm -f "$release_file"
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
  # Reload the running container first: a config-only change must not
  # recreate it. Recreate once only if reload is impossible, and say why.
  if ! ssh "$target" "cd '$remote' && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"; then
    echo "deploy: reload failed, recreating once" >&2
    if ! ssh "$target" "cd '$remote' && docker compose up -d --remove-orphans && docker compose ps --status running -q caddy | grep -q . && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --force"; then
      ssh "$target" "cd '$remote' && docker compose ps -a && docker inspect -f 'OOMKilled={{.State.OOMKilled}} ExitCode={{.State.ExitCode}} Error={{.State.Error}}' \$(docker compose ps -aq caddy) && grep -c 'dev.zedkit.app' Caddyfile; docker compose logs --no-color --tail 200 caddy" || true
      echo "deploy: caddy did not come up; see container logs above" >&2
      exit 1
    fi
  fi
  # Reconcile Suggest on every delivery. Recreate it only when its code
  # or env changed, or when it is not running yet. Caddy stays reloaded.
  ssh "$target" "cd '$remote' && prev=\$(cat .suggest-fingerprint 2>/dev/null || true) && running=\$(docker compose ps --status running -q suggest || true) && if [ \"\$prev\" != '$fp' ] || [ -z \"\$running\" ]; then docker compose up -d --no-deps --force-recreate suggest; fi && printf '%s\n' '$fp' > .suggest-fingerprint"
fi
echo "deploy: done"
