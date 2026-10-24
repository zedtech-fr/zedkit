# @zedkit/server

Server-side helpers with a stable public surface. Original work by the
same author. Zero runtime dependencies.

```sh
pnpm add @zedkit/server
```

```ts
import { redactValue } from "@zedkit/server";

logger.info({ event: "login", user: redactValue(user) });
```

## API

- `MemoryRateLimiter` — fixed-window, in-process rate limiting:
  `allow(key, limitPerMinute)`. Correct for single-instance deployments;
  multi-instance enforcement needs a shared store behind the same shape.
- `redactValue(value, key?)` — recursively replace credential-looking
  material with placeholders before logging. Secret-like keys become
  `"[redacted]"`, bearer/basic tokens become `"<scheme> [redacted]"`,
  strings over 64 code points are truncated, cyclic references become
  `"[circular]"`. Dates pass through; Maps, Sets, prototypes, and symbol
  keys are preserved.
- `computeBackoffMs(attemptNo, random?)` — exponential retry backoff
  (2s × 3^(n-1), ±20% jitter, 1s floor, 1h cap).
- `webhookSignatureHeader(secret, body, timestamp)` /
  `verifyWebhookSignatureHeader(secret, body, header, options?)` —
  Stripe-style `t=…,v1=…` HMAC signatures over exact body bytes, with an
  optional freshness check. Bring your own secret.
- `pgErrorCode(error)` — read the Postgres error code (`23505`
  unique, `23503` FK, ...) from a thrown value, or `null` when it
  has none. Lets callers decide conflict-vs-bug.

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

These modules are small and dependency-free: source-copying the files
is a sane alternative to installing (MIT allows it). Install the package
for versioned updates.

## Verify

```sh
pnpm --filter @zedkit/server typecheck && pnpm --filter @zedkit/server lint && pnpm --filter @zedkit/server build && pnpm --filter @zedkit/server test
```
