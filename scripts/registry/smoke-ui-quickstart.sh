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

# The pack closure ships prebuilt `dist/` (package `files` lists it; a clean
# checkout has none). Build the UI closure before packing so every cell packs
# the same bytes; with a warm turbo cache this is a no-op.
if [[ ! -f "${ROOT}/packages/ui/dist/index.js" ]]; then
  echo "smoke-ui-quickstart: no packages/ui/dist — building the UI closure first" >&2
  (cd "$ROOT" && pnpm exec turbo run build --filter=@zedtech/zedkit-ui)
fi

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
if [[ "$LAYOUT" == "src" ]] && ! grep -q '@source "../../node_modules' "$GLOBALS"; then
  # Older snippets only name the Vite/Next-plain depth; under --src-dir the
  # scan root sits one level deeper (docs: prose/guides/getting-started.mdx).
  # Snippets that already name both depths (one line per depth) need no edit.
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

if [[ "${SKIP_RENDER_CHECK:-}" == "1" ]]; then
  echo "smoke-ui-quickstart: ok (next $LAYOUT, $PM, build only; render check skipped)"
  exit 0
fi

start_server
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then break; fi
  sleep 1
done
node "${ROOT}/scripts/quickstart-render-check.mjs" "http://127.0.0.1:${PORT}/" "smoke-ui-quickstart: next $LAYOUT ($PM)"

echo "smoke-ui-quickstart: ok (next $LAYOUT, $PM, styled Button page rendered)"
