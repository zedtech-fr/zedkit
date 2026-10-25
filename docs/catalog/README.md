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
| `@zedtech/zedkit-core` | results, error handling, IDs | [packages/core/CATALOG.md](../../packages/core/CATALOG.md) |
| `@zedtech/zedkit-server` | rate limiting, redaction, backoff, webhook signatures | [packages/server/CATALOG.md](../../packages/server/CATALOG.md) |
| `@zedtech/zedkit-nest` | NestJS bootstrap factory | [packages/nest/CATALOG.md](../../packages/nest/CATALOG.md) |
| `@zedtech/zedkit-ai` | AI agent setup: instructions, skills, subagents | [packages/ai/CATALOG.md](../../packages/ai/CATALOG.md) |
| `@zedtech/zedkit-ui` | admin UI kit: tokens, theme, components | [packages/ui/CATALOG.md](../../packages/ui/CATALOG.md) |
| `@zedtech/zedkit-seo` | robots, sitemaps, JSON-LD, metadata, llms.txt, slugs | [packages/seo/CATALOG.md](../../packages/seo/CATALOG.md) |
| `@zedtech/zedkit-payload-seo` | Payload SEO group field | [packages/payload-seo/CATALOG.md](../../packages/payload-seo/CATALOG.md) |

## Entry format

Every `## <need>` section in a package `CATALOG.md` carries the same four
fields plus a short example. This is the contract the generator parses —
keep it exact:

```md
## Do X without Y

- Import: `@zedtech/zedkit-core` — `a`, `b`
- Wraps: `some-npm-package`
- Status: beta

\`\`\`ts
import { a } from "@zedtech/zedkit-core";
// ...5-line example...
\`\`\`
```

- **Import** names the package (and subpath, if any) plus the symbols the
  need uses. Every public export of the package must appear here — CI
  checks it (`pnpm catalog:check`).
- **Wraps** names the mature npm package underneath, or `(none)` when the
  module is dependency-free by design.
- **Status** is one of `planned | alpha | beta | stable | deprecated`
  (CI validates the value; see Maturity below). A deprecated entry also
  carries `- Replaced by: ...` naming the replacement.
- The example is TypeScript, about five lines, copy-paste runnable.

## Maturity

Every need carries an honest maturity badge (also in
[`catalog.json`](catalog.json) as `status`, for docs badges and agents).
New entries start at `alpha`; promotion is a deliberate small PR that
re-checks the criteria below.

- `planned` — documented shape, not implemented yet. No code, no tests.
- `alpha` — implemented, but the API may still change. Proof is thin:
  missing tests, docs, or review.
- `beta` — tested through the public interface, documented with an
  example, reviewed — and for UI also covered by a11y checks and the
  gallery. API settling, ready for a first adoption. Not yet proven in
  a real app.
- `stable` — proven in real apps: adopted by at least two consumers,
  API protected by semver (breaking changes are a major), documented.
- `deprecated` — do not adopt; the entry names its replacement and will
  be removed in a future major.

Regenerate after any catalog edit: `pnpm catalog:build`, then commit the
result. CI fails when `catalog.json` drifts from the package catalogs.
