# Catalog — @zedkit/core

## Model success or failure without throwing

- Import: `@zedkit/core` — `Result`, `ok`, `err`, `isOk`, `isErr`, `mapResult`, `unwrapOr`
- Wraps: `(none)`
- Status: stable

```ts
import { isOk, ok, unwrapOr } from "@zedkit/core";
const found = ok({ name: "zed" });
if (isOk(found)) console.log(found.value.name);
const name = unwrapOr(found, { name: "?" }).name;
```

## Handle errors without try/catch

- Import: `@zedkit/core` — `tryCatch`, `tryCatchAsync`, `normalizeThrown`
- Wraps: `(none)`
- Status: stable

```ts
import { tryCatch } from "@zedkit/core";
const parsed = tryCatch(() => JSON.parse(input));
if (!parsed.ok) return fallback(parsed.error);
```

## Generate prefixed unique IDs

- Import: `@zedkit/core` — `newPrefixedId`, `isPrefixedId`
- Wraps: `ulid`
- Status: stable

```ts
import { isPrefixedId, newPrefixedId } from "@zedkit/core";
const id = newPrefixedId("order"); // order_01M5Q75SHJ9CVV6E3RBF0FGEM1
if (!isPrefixedId(id, "order")) throw new Error("bad id");
```
