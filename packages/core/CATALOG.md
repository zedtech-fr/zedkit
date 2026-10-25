# Catalog — @zedtech/zedkit-core

## Model success or failure without throwing

- Import: `@zedtech/zedkit-core` — `Result`, `ok`, `err`, `isOk`, `isErr`, `mapResult`, `unwrapOr`
- Wraps: `(none)`
- Status: beta

```ts
import { isOk, ok, unwrapOr } from "@zedtech/zedkit-core";
const found = ok({ name: "zed" });
if (isOk(found)) console.log(found.value.name);
const name = unwrapOr(found, { name: "?" }).name;
```

## Handle errors without try/catch

- Import: `@zedtech/zedkit-core` — `tryCatch`, `tryCatchAsync`, `normalizeThrown`
- Wraps: `(none)`
- Status: beta

```ts
import { tryCatch } from "@zedtech/zedkit-core";
const parsed = tryCatch(() => JSON.parse(input));
if (!parsed.ok) return fallback(parsed.error);
```

## Generate prefixed unique IDs

- Import: `@zedtech/zedkit-core` — `newPrefixedId`, `isPrefixedId`
- Wraps: `ulid`
- Status: beta

```ts
import { isPrefixedId, newPrefixedId } from "@zedtech/zedkit-core";
const id = newPrefixedId("order"); // order_01M5Q75SHJ9CVV6E3RBF0FGEM1
if (!isPrefixedId(id, "order")) throw new Error("bad id");
```
