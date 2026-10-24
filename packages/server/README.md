# @zedkit/server

Server-side helpers with a stable public surface. Original work by the
same author. Zero runtime dependencies.

## API

- `MemoryRateLimiter` — fixed-window, in-process rate limiting:
  `allow(key, limitPerMinute)`. Correct for single-instance deployments;
  multi-instance enforcement needs a shared store behind the same shape.
- `redactValue(value, key?)` — recursively replace credential-looking
  material with placeholders before logging. Secret-like keys become
  `"[redacted]"`, bearer tokens become `"Bearer [redacted]"`, strings
  over 64 chars are truncated.

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

Both modules are small and dependency-free: source-copying the two files
is a sane alternative to installing (MIT allows it). Install the package
for versioned updates.
