---
"@zedtech/zedkit-ai": patch
---

Pin the install walkthrough to the current published version: every installer invocation in `cursor-onboarding.md` carries `@1.1.1` (exact via `--save-exact`, never a caret range), with a version statement naming the target and a skip-only-if-pinned rule. Reproducible installs; drop the suffix to float.
