---
"@zedtech/zedkit-ui": patch
---

`pullSseFrames` and `consumeSseStream` yield the same named SSE frames for LF, CRLF, and CR, including when a chunk splits a CRLF blank line.
