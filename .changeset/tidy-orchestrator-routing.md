---
"@zedtech/zedkit-ai": patch
---

Harden review and orchestration execution: route the tokenomics cell via the spawn tool's model parameter (never pasted into brief text), pin the local CLI version and commit (never an unpinned download), queue saturated capacity in waves instead of retrying, share one pinned context block across briefs, and report planned lenses explicitly.
