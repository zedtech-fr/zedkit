#!/usr/bin/env bash
# Fail if a changeset names a missing or private package.
# Those files are never consumed (`changeset version` no-ops) and
# `changesets/action` then skips publish because hasChangesets stays true.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

python3 - <<'PY'
from pathlib import Path
import json
import re
import sys

root = Path(".")
public: set[str] = set()
private: set[str] = set()
for pkg in list(root.glob("packages/*/package.json")) + list(root.glob("apps/*/package.json")):
    data = json.loads(pkg.read_text())
    name = data.get("name")
    if not name:
        continue
    (private if data.get("private") else public).add(name)

name_re = re.compile(r'^["\']([^"\']+)["\']\s*:')
fail = 0
for cs in sorted(root.glob(".changeset/*.md")):
    text = cs.read_text()
    if not text.startswith("---"):
        print(f"{cs}: missing frontmatter")
        fail = 1
        continue
    end = text.find("\n---", 3)
    if end < 0:
        print(f"{cs}: unclosed frontmatter")
        fail = 1
        continue
    names = []
    for line in text[4:end].splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = name_re.match(line)
        if match:
            names.append(match.group(1))
    if not names:
        print(f"{cs}: no package names in frontmatter")
        fail = 1
        continue
    for name in names:
        if name in private:
            print(f"{cs}: {name} is private — docs/tooling PRs carry no changeset")
            fail = 1
        elif name not in public:
            print(f"{cs}: {name} is not a workspace package")
            fail = 1

sys.exit(fail)
PY
status=$?
[ "$status" -eq 0 ] && echo "changeset-packages: ok"
exit "$status"
