#!/usr/bin/env bash
# Put a pinned npm 11.x into the Node prefix so pnpm 9.15.9's publisher
# PATH (dirname(process.execPath) before inherited PATH) resolves it.
# Then fail closed unless that publisher npm meets the OIDC floor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "ensure-release-publisher: $*" >&2
  exit 1
}

NODE_BIN="$(dirname "$(node -p 'process.execPath')")"
PREFIX="$(dirname "$NODE_BIN")"
PINNED_NPM="$(node --input-type=module -e "import { PINNED_NPM } from '${ROOT}/scripts/release-publisher.mjs'; process.stdout.write(PINNED_NPM)")"
[ -n "$PINNED_NPM" ] || fail "could not read PINNED_NPM"

echo "ensure-release-publisher: node_bin=${NODE_BIN} prefix=${PREFIX} pin=${PINNED_NPM}"
npm install -g --prefix "$PREFIX" --no-fund --no-audit "npm@${PINNED_NPM}"
# pnpm looks up npm in dirname(process.execPath), not a later PATH entry.
[ -x "${NODE_BIN}/npm" ] || fail "npm not installed at ${NODE_BIN}/npm"
node "${ROOT}/scripts/release-publisher.mjs"
