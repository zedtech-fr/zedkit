# @zedtech/zedkit-core

Foundational helpers with a stable public surface. Original work by the
same author.

```sh
pnpm add @zedtech/zedkit-core
```

```ts
import { tryCatch } from "@zedtech/zedkit-core";

const parsed = tryCatch(() => JSON.parse(input));
if (!parsed.ok) return fallback(parsed.error);
```

## API

- `Result<T, E = Error>` — `{ ok: true, value: T } | { ok: false, error: E }`
- `ok(value)`, `err(error)`, `isOk(result)`, `isErr(result)`
- `mapResult(result, fn)`, `unwrapOr(result, fallback)`
- `tryCatch(fn)`, `tryCatchAsync(fn)` — never swallow; non-`Error` throws
  become `Error` with `cause` set. Raw `try`/`catch` stays banned
  everywhere else.
- `newPrefixedId(prefix)`, `isPrefixedId(id, prefix)` — `"<prefix>_<ulid>"`
  IDs via a thin wrapper over the `ulid` package (see the
  [golden rule](../../docs/golden-rule.md)).

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

`result` and `try-catch` are tiny and dependency-free: source-copying the
two files is a sane alternative to installing (MIT allows it). Install
the package when you also want `ids` (which needs the `ulid`
dependency) or versioned updates.

## Verify

```sh
pnpm --filter @zedtech/zedkit-core typecheck && pnpm --filter @zedtech/zedkit-core lint && pnpm --filter @zedtech/zedkit-core build && pnpm --filter @zedtech/zedkit-core test
```
