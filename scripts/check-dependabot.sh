#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/.github/dependabot.yml"

if [[ ! -f "$file" ]]; then
  echo "check-dependabot: missing $file" >&2
  exit 1
fi

python3 - "$file" <<'PY'
import sys
from pathlib import Path

import yaml

path = Path(sys.argv[1])
doc = yaml.safe_load(path.read_text(encoding="utf-8"))
if not isinstance(doc, dict) or doc.get("version") != 2:
    raise SystemExit("check-dependabot: version must be 2")
updates = doc.get("updates")
if not isinstance(updates, list) or not updates:
    raise SystemExit("check-dependabot: updates must be a non-empty list")
for entry in updates:
    if not isinstance(entry, dict):
        raise SystemExit("check-dependabot: each update entry must be a mapping")
    eco = entry.get("package-ecosystem")
    if eco not in ("npm", "github-actions"):
        raise SystemExit(f"check-dependabot: unexpected ecosystem {eco!r}")
    if entry.get("directory") != "/":
        raise SystemExit("check-dependabot: directory must be /")
    if entry.get("schedule", {}).get("interval") != "weekly":
        raise SystemExit("check-dependabot: schedule.interval must be weekly")
    limit = entry.get("open-pull-requests-limit")
    if limit != 3:
        raise SystemExit("check-dependabot: open-pull-requests-limit must be 3")
PY

echo "check-dependabot: ok"
