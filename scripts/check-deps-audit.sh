#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

blocked_advisory="GHSA-8g5g-mxqh-grgj"

audit_file="$(mktemp)"
trap 'rm -f "$audit_file"' EXIT
pnpm audit --json >"$audit_file" 2>/dev/null || true

if [[ ! -s "$audit_file" ]]; then
  echo "check-deps-audit: pnpm audit produced no output" >&2
  exit 1
fi

python3 - "$blocked_advisory" "$audit_file" <<'PY'
import json
import sys
from pathlib import Path

blocked = sys.argv[1]
raw = Path(sys.argv[2]).read_text(encoding="utf-8")
try:
    doc = json.loads(raw)
except json.JSONDecodeError as exc:
    raise SystemExit(f"check-deps-audit: invalid audit JSON: {exc}") from exc

advisories = doc.get("advisories") or {}
for entry in advisories.values():
    url = str(entry.get("url") or "")
    if blocked in url or blocked in str(entry.get("cves") or ""):
        title = entry.get("title") or entry.get("module_name") or "unknown"
        raise SystemExit(
            f"check-deps-audit: blocked advisory {blocked} still present ({title})"
        )
PY

pnpm audit --audit-level high

echo "check-deps-audit: ok"
