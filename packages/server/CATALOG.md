# Catalog — @zedtech/zedkit-server

## Rate-limit calls per key

- Import: `@zedtech/zedkit-server` — `MemoryRateLimiter`
- Wraps: `(none)`
- Status: beta

```ts
import { MemoryRateLimiter } from "@zedtech/zedkit-server";
const limiter = new MemoryRateLimiter();
if (!limiter.allow(clientIp, 100)) return tooManyRequests();
```

## Redact secrets before logging

- Import: `@zedtech/zedkit-server` — `redactValue`
- Wraps: `(none)`
- Status: beta

```ts
import { redactValue } from "@zedtech/zedkit-server";
logger.info(redactValue({ user, token, headers }));
```

## Retry with exponential backoff

- Import: `@zedtech/zedkit-server` — `computeBackoffMs`
- Wraps: `(none)`
- Status: beta

```ts
import { computeBackoffMs } from "@zedtech/zedkit-server";
const waitMs = computeBackoffMs(failedAttemptNo);
await sleep(waitMs);
```

## Sign and verify webhook deliveries

- Import: `@zedtech/zedkit-server` — `webhookSignatureHeader`, `verifyWebhookSignatureHeader`, `VerifyWebhookOptions`
- Wraps: `(none)`
- Status: beta

```ts
import { verifyWebhookSignatureHeader as verify } from "@zedtech/zedkit-server";
if (!verify(secret, rawBody, headers["webhook-signature"], { maxAgeSeconds: 300 })) {
  return unauthorized();
}
```

## Tell a Postgres conflict from a bug

- Import: `@zedtech/zedkit-server` — `pgErrorCode`
- Wraps: `(none)`
- Status: beta

```ts
import { pgErrorCode } from "@zedtech/zedkit-server";
try {
  await db.insert(users).values(row);
} catch (error) {
  if (pgErrorCode(error) === "23505") return conflict();
  throw error;
}
```
