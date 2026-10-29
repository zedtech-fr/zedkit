# Shared helpers for scripts/release-tags.sh (source, do not execute alone).

# Poll until npm view sees pkg@version (registry propagation after publish).
# Env: RELEASE_TAGS_NPM_VIEW (default: npm view), RELEASE_TAGS_NPM_MAX_ATTEMPTS (10),
# RELEASE_TAGS_NPM_SLEEP_SEC (base sleep, default 5 — scaled per attempt up to ~5m total).
wait_for_npm_version() {
  local spec="$1"
  local npm_view="${RELEASE_TAGS_NPM_VIEW:-npm view}"
  local max_attempts="${RELEASE_TAGS_NPM_MAX_ATTEMPTS:-10}"
  local base_sleep="${RELEASE_TAGS_NPM_SLEEP_SEC:-5}"
  local attempt=1
  while [ "$attempt" -le "$max_attempts" ]; do
    if $npm_view "$spec" version >/dev/null 2>&1; then
      return 0
    fi
    if [ "$attempt" -eq "$max_attempts" ]; then
      echo "error: npm registry: $spec not visible after $max_attempts attempts (waited up to ~5m)" >&2
      return 1
    fi
    local sleep_for=$((base_sleep * attempt))
    echo "wait npm $spec (attempt $attempt/$max_attempts, ${sleep_for}s)..."
    sleep "$sleep_for"
    attempt=$((attempt + 1))
  done
  return 1
}
