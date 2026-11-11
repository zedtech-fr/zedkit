# Public review snapshot (exporter contract)

The docs site reads one JSON file (`adapters/public-reviews.json`). The
out-of-repo exporter must emit **one** of the two version-1 shapes below.
Do not emit both `issues` and `reviews` on the same object.

The public run history page is fed by the **generated run index**
(`issues` + `pullRequests`). A live-shaped file of every hosted run
cannot live in git (one dense row is already near the 200KB cap).
Live-shaped input remains valid so a denser payload can land later
without a parser rewrite. Do not emit both shapes on one object.

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

Optional join fields on `run` (safe integer or null / string or null;
omit when unknown):

- `issue` — GitHub issue number. When it is a safe integer, the mapper
  builds an issue row. When it is missing or null, the PR stays
  unlinked (`/issues/pr/:n`).
- `live_url` — HTTPS URL of the existing hosted live console. This is
  the only field that becomes the provisional page's outbound link.
  `review_url` is a GitHub review link and is **not** a hosted console
  URL; the mapper never copies it to `liveUrl`.
- `issue_title`, `opened_pr_url` — already accepted. Title falls back
  to `Issue #N` when `issue_title` is empty. Issue `state` is `open`
  unless the generated run index sends `state`.

Unknown keys on a live `run` still fail closed.

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

Plan and implement phases of one implement ticket run are **two**
timeline entries (distinct `id`, shared `runId`). The generated run
index emits both. `liveRunsToIndex` still maps one live row to one
entry; do not split live phases in this parser.

Public-repo visibility on the **index**: only the string `"private"` is
dropped. Missing, `null`, and `"public"` stay. Live `list()` still keeps
only `visibility: "public"` (dense console gate). A live-shaped export
of missing visibility is rejected at parse; that is why the generated
run index is the public run history page shape.

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

## Staging ingest

`deploy-dev.yml` may replace `adapters/public-reviews.json` **before**
the docs build. Set repository variable `PUBLIC_REVIEWS_SNAPSHOT` to a
runner-local path. Optionally set `PUBLIC_REVIEWS_SNAPSHOT_REMOTE` to
`scp` that file from the existing staging SSH host (`zed-dev`) into the
local path first. Do not commit a host filesystem path.

- Unset or missing file: keep the checked-in stand-in and continue
  (fail-open).
- Present but fails parse, scrub, or `assertPubliclySafe`: fail the
  deploy (fail-closed). Secrets must not ship.

`apps/docs/scripts/copy-public-reviews-snapshot.mjs <source> <dest>`
is the gate. The CLI requires both paths; the workflow skips the CLI
when the local path env is unset. Epic preview and production deploys
do not ingest.
