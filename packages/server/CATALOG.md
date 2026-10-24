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
