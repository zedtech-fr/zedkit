---
"@zedtech/zedkit-ui": patch
---

Add "use client" to client-only modules so React Server Component adopters (Next.js) build: without it the server graph resolves client-only stubs (react-hook-form react-server) and fails.
