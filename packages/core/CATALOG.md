# Catalog — @zedtech/zedkit-core

- Keywords: typescript, utilities, result-type, error-handling, typed-errors, ulid, unique-id, prefixed-id, hashing, functional
- Audience: TypeScript developers tired of untyped throws and ad-hoc helpers.
- Purpose: Typed Result helpers, safe try/catch wrappers, prefixed IDs and hashing — stop writing the same utilities in every repo.
- Attribution: Original work by the same author.


## Model success or failure without throwing

- Import: `@zedtech/zedkit-core` — `Result`, `ok`, `err`, `isOk`, `isErr`, `mapResult`, `unwrapOr`
- Wraps: `(none)`
- Status: beta
- Short name: Result
- Audience: TypeScript developers who want typed outcomes instead of try/catch everywhere.
- Purpose: Return `ok`/`err` Results so failures are values the compiler forces you to handle.
- When to use: For fallible operations (parsing, lookups, validation) where the caller must handle failure.
- When not to use: For truly exceptional programmer bugs — throw (or assert) instead of returning `err`.
- See also: `Handle errors without try/catch`

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
- Short name: tryCatch
- Audience: TypeScript developers wrapping throwing calls (JSON, IO, third-party SDKs).
- Purpose: Turn any throwing call into a typed Result without a try/catch block.
- When to use: At the boundary with throwing code you do not control.
- When not to use: Inside code that already returns Results — compose with `mapResult` instead.
- See also: `Model success or failure without throwing`

```ts
import { tryCatch } from "@zedtech/zedkit-core";
const parsed = tryCatch(() => JSON.parse(input));
if (!parsed.ok) return fallback(parsed.error);
```

## Generate prefixed unique IDs

- Import: `@zedtech/zedkit-core` — `newPrefixedId`, `isPrefixedId`
- Wraps: `ulid`
- Status: beta
- Short name: Prefixed IDs
- Audience: Developers who want readable, sortable, collision-free IDs (orders, jobs, keys).
- Purpose: Generate ULID-based IDs with a type prefix (`order_...`) plus a prefix check.
- When to use: For public-facing or log-friendly IDs where the prefix disambiguates the kind.
- When not to use: For database primary keys — use the database's native id/uuid default instead.

```ts
import { isPrefixedId, newPrefixedId } from "@zedtech/zedkit-core";
const id = newPrefixedId("order"); // order_01M5Q75SHJ9CVV6E3RBF0FGEM1
if (!isPrefixedId(id, "order")) throw new Error("bad id");
```
