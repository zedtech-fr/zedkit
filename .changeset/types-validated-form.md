---
"@zedtech/zedkit-ui": patch
---

useValidatedForm ties form values to zod schema input and submit payload to schema output. Migration: drop the manual generic — `useValidatedForm(schema)` instead of `useValidatedForm<MyFields>(schema)`.
