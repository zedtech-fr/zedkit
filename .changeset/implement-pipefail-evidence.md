---
"@zedtech/zedkit-ai": patch
---

The `implement` skill now requires preserving a check's exit status when its output is shortened through a pipe (`set -o pipefail` under bash, or the `gate` wrapper), so a passing pipeline can never mask a failing check.
