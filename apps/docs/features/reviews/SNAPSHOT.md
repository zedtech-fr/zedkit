# Public review snapshot (exporter contract)

The docs site reads one JSON file (`adapters/public-reviews.json`). The
out-of-repo exporter must emit **one** of the two version-1 shapes below.
Do not emit both `issues` and `reviews` on the same object.

The public run history page is fed by the **issue index**. A live-shaped
file of every hosted run cannot live in git (one dense row is already near
the 200KB cap). Live-shaped input remains valid so a denser payload can
land later without a parser rewrite.

## Version

Both shapes require `"version": 1`. Any other version fails closed.

## Live-run shape (production)

Keys: `version`, `kind`, `reviews`. Extra keys on the wrapper or on a
row fail closed (`exactObject`).

```json
{ "version": 1, "kind": "public-live-runs", "reviews": [ /* hosted live rows */ ] }
```

Production overwrites this file with hosted `Payload` + `visibility`.
There is no `selected` field.

## Issue index (public run history page)

Required keys: `version`, `kind`, `issues`, `pullRequests`. Extra keys
on the wrapper are ignored (`requiredObject`) so a denser payload can
sit in the same file.

```json
{ "version": 1, "kind": "public-stand-in", "issues": [], "pullRequests": [] }
```

An empty `issues` / `reviews` array is valid. Static export still needs
a placeholder `generateStaticParams` entry; that is a site concern, not
an exporter concern.

## Dispatch

`parsePublicReviewSnapshot`:

1. Object with `reviews` and **no** `issues` → live parser (strict).
2. Object with `issues` → index parser (lenient extra keys).
3. Otherwise → error.

A hybrid object that has both `issues` and `reviews` is parsed as an
index; `reviews` is ignored. Do not rely on that: emit one shape.

## Run ids

`run_id` / `runId` / `runIds[]` must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.
Path segments, spaces, and `..` fail closed.
