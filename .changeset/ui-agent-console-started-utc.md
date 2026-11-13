---
"@zedtech/zedkit-ui": patch
---

`AgentConsole` Started stamps format in UTC with ordinary spaces so server HTML matches the browser on first paint. The chrome label is `Started (UTC)` / `Début (UTC)` so the zone is visible without `timeZoneName` (hydrate-safe).
