# Catalog — find by need

"I want X, what do you have to do it?" Each package keeps a `CATALOG.md`
next to its code, organized by need in plain words. This page indexes them;
[`catalog.json`](catalog.json) is the machine-readable aggregate, generated
from the package catalogs — never edit it by hand.

New here? Read the [golden rule](../golden-rule.md) first: it is one
paragraph of advice that explains why every catalog entry wraps something.

## Packages

Each package PR adds its row here, following
[contributing a helper](../contributing.md).

| Package | Domain | Catalog |
|---|---|---|
| `@zedkit/core` | results, error handling, IDs | [packages/core/CATALOG.md](../../packages/core/CATALOG.md) |
| `@zedkit/server` | rate limiting, redaction, backoff, webhook signatures | [packages/server/CATALOG.md](../../packages/server/CATALOG.md) |
| `@zedkit/nest` | NestJS bootstrap factory | [packages/nest/CATALOG.md](../../packages/nest/CATALOG.md) |
| `@zedkit/ai` | AI agent setup: instructions, skills, subagents | [packages/ai/CATALOG.md](../../packages/ai/CATALOG.md) |

## Entry format

Every `## <need>` section in a package `CATALOG.md` carries the same four
fields plus a short example. This is the contract the generator parses —
keep it exact:

```md
## Do X without Y

- Import: `@zedkit/core` — `a`, `b`
- Wraps: `some-npm-package`
- Status: stable

\`\`\`ts
import { a } from "@zedkit/core";
// ...5-line example...
\`\`\`
```

- **Import** names the package (and subpath, if any) plus the symbols the
  need uses. Every public export of the package must appear here — CI
  checks it (`pnpm catalog:check`).
- **Wraps** names the mature npm package underneath, or `(none)` when the
  module is dependency-free by design.
- **Status** is `stable` (shipped, safe to use) or `planned` (documented
  shape, not implemented yet).
- The example is TypeScript, about five lines, copy-paste runnable.

Regenerate after any catalog edit: `pnpm catalog:build`, then commit the
result. CI fails when `catalog.json` drifts from the package catalogs.
