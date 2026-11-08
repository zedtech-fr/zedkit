#!/usr/bin/env bash
# Install pinned actionlint for workflow-lint. Primary: GitHub Releases
# download. Fallback: official GitHub API asset (same file, CDN). Never
# extract or run until SHA-256 matches the pin. TLS stays on.
set -euo pipefail

VERSION="1.7.10"
ASSET="actionlint_${VERSION}_linux_amd64.tar.gz"
# rhysd v1.7.10 linux_amd64: GitHub release digest + checksums.txt +
# independent sha256sum of the API-downloaded asset (2026-11-08).
SHA256="${ACTIONLINT_SHA256:-f4c76b71db5755a713e6055cbb0857ed07e103e028bda117817660ebadb4386f}"
ASSET_ID="334518670"
PRIMARY_URL="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/${ASSET}"
FALLBACK_URL="https://api.github.com/repos/rhysd/actionlint/releases/assets/${ASSET_ID}"

DEST="${ACTIONLINT_DIR:-.}"
CURL_BIN="${CURL_BIN:-curl}"
RETRY="${ACTIONLINT_CURL_RETRY:-2}"
DELAY="${ACTIONLINT_CURL_RETRY_DELAY:-1}"
MAX_TIME="${ACTIONLINT_CURL_MAX_TIME:-30}"

fail() {
  echo "install-actionlint: $*" >&2
  exit 1
}

if [[ ! "$SHA256" =~ ^[a-f0-9]{64}$ ]]; then
  fail "invalid sha256 pin"
fi

mkdir -p "$DEST"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
archive="$work/$ASSET"

fetch() {
  local url="$1"
  local dest="$2"
  shift 2
  rm -f "$dest"
  "$CURL_BIN" \
    --fail --silent --show-error --location \
    --proto "=https" \
    --tlsv1.2 \
    --retry "$RETRY" \
    --retry-delay "$DELAY" \
    --retry-connrefused \
    --max-time "$MAX_TIME" \
    -o "$dest" \
    "$@" \
    -- \
    "$url"
}

verify() {
  local file="$1"
  if [ ! -s "$file" ]; then
    echo "install-actionlint: empty download" >&2
    rm -f "$file"
    return 1
  fi
  if ! printf '%s  %s\n' "$SHA256" "$file" | sha256sum -c -; then
    echo "install-actionlint: sha256 mismatch (fail closed)" >&2
    rm -f "$file"
    return 1
  fi
}

auth_headers=()
token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [ -n "$token" ]; then
  auth_headers=(-H "Authorization: Bearer ${token}")
fi

echo "install-actionlint: fetching $ASSET (primary Releases)"
if fetch "$PRIMARY_URL" "$archive" "${auth_headers[@]}" && verify "$archive"; then
  echo "install-actionlint: primary verified"
else
  echo "install-actionlint: primary failed; trying official API asset $ASSET_ID"
  api_headers=(-H "Accept: application/octet-stream" -H "X-GitHub-Api-Version: 2022-11-28" "${auth_headers[@]}")
  if fetch "$FALLBACK_URL" "$archive" "${api_headers[@]}" && verify "$archive"; then
    echo "install-actionlint: fallback verified"
  else
    fail "could not download a verified $ASSET from Releases or the official API"
  fi
fi

tar -xzf "$archive" -C "$DEST" actionlint
chmod u+x "$DEST/actionlint"
test -x "$DEST/actionlint" || fail "extracted actionlint is not executable"
echo "install-actionlint: installed $DEST/actionlint ($VERSION)"
