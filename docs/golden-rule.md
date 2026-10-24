# Golden rule

Advice, not a requirement — for people using or contributing to zedkit.

Always reach a third-party library through a thin wrapper that re-exports
it: your own small module with a stable public surface, instead of
importing the library directly all over the code.

```ts
// packages/core/src/ids.ts — the wrapper
export { ulid as newPrefixedId } from "ulid";

// consumer — imports the wrapper, never the library
import { newPrefixedId } from "@zedkit/core";
```

This keeps flexibility: you can swap, upgrade, patch, or pin the library
in one place, narrow its API to what you really use, add logging, typing,
or defaults in one place, and mock it easily in tests — while consumers
keep the same import.

Trade-off: do not wrap trivially stable standard-library features, and
keep the wrapper thin — re-export and narrow, never reinvent. zedkit
itself follows this rule: each package wraps a mature npm library where
one exists, and each catalog entry names what it wraps.
