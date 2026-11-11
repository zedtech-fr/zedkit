---
"@zedtech/zedkit-ui": patch
---

`readAssistantStreamEvent` and `isAssistantStreamStage` take an optional `stages` allow-list so a generic run can keep its own in-progress names; omitted still drops `"writing"`.
