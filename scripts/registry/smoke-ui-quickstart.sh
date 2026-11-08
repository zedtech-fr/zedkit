#!/usr/bin/env bash
# CI: Next.js --src-dir consumer of the home quickstart snippets, installing
# the LOCAL workspace kit (pack-and-override), then asserting the built page
# really paints the styled Button (render check, not just a green build).
#   PM=pnpm bash scripts/registry/smoke-ui-quickstart.sh   # default
#   PM=npm   bash scripts/registry/smoke-ui-quickstart.sh   # D1: npm must not ERESOLVE
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SNIPPETS="${ROOT}/apps/docs/home-quickstart/snippets"
WORK="${TMPDIR:-/tmp}/zedkit-ui-quickstart-smoke-$$"
PORT="${SMOKE_PORT:-3109}"
PM="${PM:-pnpm}"
LAYOUT="${LAYOUT:-src}"

cleanup() {
  if [[ -n "${SRV:-}" ]]; then
    pkill -P "$SRV" 2>/dev/null || true
    kill "$SRV" 2>/dev/null || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

for f in install.sh npm-globals.css npm-page.tsx; do
  if [[ ! -f "${SNIPPETS}/${f}" ]]; then
    echo "smoke-ui-quickstart: missing ${SNIPPETS}/${f}" >&2
    exit 1
  fi
done

case "$PM" in
  pnpm) USE="--use-pnpm"; BUILD="pnpm exec next build" ;;
  npm) USE="--use-npm"; BUILD="npx --yes next build" ;;
  *) echo "smoke-ui-quickstart: unknown PM=$PM (want pnpm|npm)" >&2; exit 1 ;;
esac

start_server() {
  # No intermediate shell: $! stays the server supervisor, killed on trap.
  if [[ "$PM" == "pnpm" ]]; then
    pnpm exec next start --port "$PORT" >/tmp/zedkit-ui-quickstart-serve-$$.log 2>&1 &
  else
    npx --yes next start --port "$PORT" >/tmp/zedkit-ui-quickstart-serve-$$.log 2>&1 &
  fi
  SRV=$!
}

if [[ "$LAYOUT" == "src" ]]; then
  SRC_FLAG="--src-dir"
  GLOBALS="src/app/globals.css"
  PAGE="src/app/page.tsx"
else
  SRC_FLAG=""
  GLOBALS="app/globals.css"
  PAGE="app/page.tsx"
fi

pnpm dlx "create-next-app@${CREATE_NEXT_APP_VERSION:-16.4.3}" "$WORK" \
  --ts --tailwind --eslint --app $SRC_FLAG --import-alias "@/*" "$USE" --yes

cd "$WORK"
cp "${SNIPPETS}/npm-globals.css" "$GLOBALS"
cp "${SNIPPETS}/npm-page.tsx" "$PAGE"
if [[ "$LAYOUT" == "src" ]]; then
  # The snippet is Vite-oriented; under --src-dir the scan root sits one level
  # deeper (docs: prose/guides/getting-started.mdx "Next.js: use ... @source
  # "../../node_modules/…"").
  sed -i 's#@source "../node_modules#@source "../../node_modules#' "$GLOBALS"
fi

mkdir -p pack
node "${ROOT}/scripts/workspace-pack-closure.mjs" pack-and-override @zedtech/zedkit-ui "$WORK" "$WORK/pack" >/dev/null
if [[ "$PM" == "pnpm" ]]; then
  bash -c "$(cat "${SNIPPETS}/install.sh")"
else
  npm install ./pack/*.tgz
fi
bash -c "$BUILD"

start_server
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then break; fi
  sleep 1
done
node "${ROOT}/scripts/quickstart-render-check.mjs" "http://127.0.0.1:${PORT}/" "smoke-ui-quickstart: next $LAYOUT ($PM)"

echo "smoke-ui-quickstart: ok (next $LAYOUT, $PM, styled Button page rendered)"
