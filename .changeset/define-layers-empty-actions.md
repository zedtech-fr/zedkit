---
"@zedtech/zedkit-quality": patch
---

`defineLayers` accepts an empty `actionPatterns` (views may legitimately import data): the view ban is omitted instead of emitting an invalid empty group.
