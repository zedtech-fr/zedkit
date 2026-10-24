# Catalog — @zedkit/server

## Rate-limit calls per key

- Import: `@zedkit/server` — `MemoryRateLimiter`
- Wraps: `(none)`
- Status: stable

```ts
import { MemoryRateLimiter } from "@zedkit/server";
const limiter = new MemoryRateLimiter();
if (!limiter.allow(clientIp, 100)) return tooManyRequests();
```

## Redact secrets before logging

- Import: `@zedkit/server` — `redactValue`
- Wraps: `(none)`
- Status: stable

```ts
import { redactValue } from "@zedkit/server";
logger.info(redactValue({ user, token, headers }));
```

## Retry with exponential backoff

- Import: `@zedkit/server` — `computeBackoffMs`
- Wraps: `(none)`
- Status: stable

```ts
import { computeBackoffMs } from "@zedkit/server";
const waitMs = computeBackoffMs(failedAttemptNo);
await sleep(waitMs);
```

## Sign and verify webhook deliveries

- Import: `@zedkit/server` — `webhookSignatureHeader`, `verifyWebhookSignatureHeader`, `VerifyWebhookOptions`
- Wraps: `(none)`
- Status: stable

```ts
import { verifyWebhookSignatureHeader as verify } from "@zedkit/server";
if (!verify(secret, rawBody, headers["webhook-signature"], { maxAgeSeconds: 300 })) {
  return unauthorized();
}
```
