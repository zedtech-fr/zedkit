# Public review snapshot (exporter contract)

The docs site reads one JSON file (`adapters/public-reviews.json`).
The out-of-repo exporter must emit **one** version-1 shape: the
**generated run index** (`issues` + `pullRequests`). That is the
production feed for the public run history page. Do not emit both
`issues` and `reviews` on the same object.

A live-shaped file of every hosted run cannot live in git (one dense
row is already near the 200KB artefact cap). Live-shaped input remains
valid so a denser payload can land later without a parser rewrite. Do
not point staging ingest at a live-shaped dump of every run.

The checked-in file is a **stand-in** (`kind: public-stand-in`) used
when ingest is unset or `scp` fails. Staging overwrites it from a
generated file. The exporter may use any non-secret `kind` string.

Keep the generated file under **200KB** (repo artefact cap). Index rows
are the way to stay under the cap.

## Version

Both shapes require `"version": 1`. Any other version fails closed.

## Generated run index (production feed)

Required wrapper keys: `version`, `kind`, `issues`, `pullRequests`.
Extra keys on the wrapper and on index rows are ignored
(`requiredObject`) so a denser payload can sit in the same file.

```json
{ "version": 1, "kind": "public-stand-in", "issues": [], "pullRequests": [] }
```

An empty `issues` / `pullRequests` array is valid. Static export still
needs a placeholder `generateStaticParams` entry; that is a site
concern, not an exporter concern.

### Issue rows

Each `issues[]` object:

| Field | Rule |
| --- | --- |
| `number` | Safe integer (GitHub issue number). |
| `title` | Required string. The index parser does not invent a title; `Issue #N` is the live mapper fallback when `issue_title` is empty. |
| `state` | `open` or `closed`. |
| `pullRequests` | Array of safe integers (linked PR numbers). Empty when none. |
| `lastRunAt` | ISO-8601 string. |
| `entries` | Required array (may be empty). Zero-entry issues are dropped by the public gate. |
| `visibility` | Optional. Omit or `"public"`. Only the string `"private"` is dropped. Missing, `null`, and `"public"` stay. |

### Timeline entries

Each `entries[]` object (issue or unlinked PR):

| Field | Rule |
| --- | --- |
| `id` | Distinct string. Plan and implement of one run are two ids. |
| `runId` | Hosted run folder id. Path-safe: `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`. Plan and implement of one implement ticket run **share** this value. |
| `type` | `plan` \| `implement` \| `review` \| `improve` \| `dry-run`. |
| `status` | `running` \| `completed` \| `failed`. |
| `startedAt` | ISO-8601 string. |
| `durationMs` | Finite number ≥ 0, or `null` (running). |
| `models` | String array. Skip empty strings. Plan, implement, and dry-run: engine model. Review: lens and second-pass models. Improve: improve model. |
| `verdict` | `approve` \| `request-changes` \| `comment`, or `null`. |
| `liveUrl` | Allowlisted hosted-console href (`HOSTED_LIVE_HREF_PREFIX` plus a path-safe run id) or `null`. Never a GitHub `review_url`. Never a reserved host, other host, other path, query, hash, userinfo, `http:`, non-empty port, or a home path. The public gate drops those. |

Plan and implement phases of one implement ticket run are **two**
timeline entries (distinct `id`, shared `runId`). The generated run
index emits both. `liveRunsToIndex` emits one primary entry plus one
per related run; it does not split phases. Do not point production
ingest at live-shaped implement rows and expect a split.

### Pull-request rows

Each `pullRequests[]` object:

| Field | Rule |
| --- | --- |
| `number` | Safe integer (GitHub PR number). |
| `issueNumber` | Safe integer, or `null` when unlinked. |
| `runIds` | Array of path-safe run ids. |
| `entries` | **Required when `issueNumber` is `null`.** Linked PRs may omit it. If provided, they stay on that PR row (`listPullRequests`) and are not merged into the issue timeline; `getRun` uses the issue row. |
| `visibility` | Optional. Same rule as issue rows: only `"private"` is dropped. |

Unjoined review / improve / dry-run PRs stay in `pullRequests` with
`issueNumber: null` and their runs. Never omit them.

Join order for the exporter: implement metadata (`issue`, `pr_url`,
`opened_pr_url`) first; then GitHub closing references / `Fixes #N`;
remainder unlinked.

### Visibility (index)

Only the string `"private"` is dropped. Missing, `null`, and `"public"`
stay. Live `list()` still keeps only `visibility: "public"` (dense
console gate). A live-shaped export of missing visibility is rejected
at parse; that is why the generated run index is the public run history
page shape.

### Never export

Do not emit `token` files, `token_hash`, prompts, `final_text`, machine
paths, home directories, Bearer/Basic secrets, or a `liveUrl` with
`token=` / userinfo / `http:`. Index extras are dropped at parse (never
reach redaction). Live extras fail closed (`exactObject`, except
`verdict_json` below). Redaction applies only to surviving secret-like
keys and Bearer/Basic / home-path values — do not rely on it for
unknown keys. An unredacted home path or Bearer/Basic token on a
surviving field fails the ingest gate closed.

## Live-run shape (valid, not the public-page feed)

Keys: `version`, `kind`, `reviews`. Extra keys on the wrapper, a row,
or nested `run` / `items` / `decision` / `related` fail closed
(`exactObject`). Exception: `verdict_json` is any object or null —
extra keys there are accepted (`parseVerdict`).

```json
{ "version": 1, "kind": "public-live-runs", "reviews": [ /* hosted live rows */ ] }
```

This shape stays parseable so a denser payload can land later. It is
**not** the production feed for the public run history page. There is
no `selected` field.

Optional join fields on `run` (safe integer or null / string or null;
omit when unknown):

- `issue` — GitHub issue number. When it is a safe integer, the mapper
  builds an issue row. When it is missing or null, the PR stays
  unlinked (`/issues/pr/:n`).
- `live_url` — hosted live console URL. The public gate keeps it only
  when it matches `HOSTED_LIVE_HREF_PREFIX` plus a path-safe run id;
  otherwise the provisional page gets `null`. `review_url` is a GitHub
  review link and is **not** a hosted console URL; the mapper never
  copies it to `liveUrl`.
- `issue_title`, `opened_pr_url` — already accepted. Title falls back
  to `Issue #N` when `issue_title` is empty. Issue `state` is `open`
  unless the generated run index sends `state`.

Unknown keys on a live `run` still fail closed. Live rows must send
`visibility`: `"public"` or `"private"`. Missing live visibility fails
parse.

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

## Share URL (site, not exporter)

Issue pages pin a local `ThemeScope` from these query keys. The exporter does not emit them. An empty query inherits the site look (the identity dock is enough). Do not restore an inline preview form.

| Key | Pins |
| --- | --- |
| `identity` | shipped kit preset: `mist`, `press`, `tide`, `volt`, `maison`, `glass` |
| `preview` | `dark` |
| `theme` | legacy alias of `preview` (`theme=dark` still parses) |
| `density` | `compact` |

Any listed key pins the whole appearance. Missing, empty, or unknown values use codec defaults (glass, light, default density); they do not inherit the site look. `serializeReviewAppearance` in `apps/docs/lib/review-appearance.ts` is the canonical writer (omit glass, light, default density).

Pinned URLs read `window.location.search` after mount (static export). The first paint may show the unpinned site look; that flash is accepted.

## Staging ingest

`deploy-dev.yml` and `deploy-epic-preview.yml` may replace
`adapters/public-reviews.json` **before** the docs build. Both call
`deploy/ingest-public-reviews.sh` after building `@zedtech/zedkit-core`
(the ingest gate imports dist-only core). Set repository variable
`PUBLIC_REVIEWS_SNAPSHOT` (Settings → Secrets and variables → Actions →
Variables) to a runner-local path such as `/tmp/public-reviews.json`.
Today that file is only produced by `scp` from
`PUBLIC_REVIEWS_SNAPSHOT_REMOTE` (a path on `zed-dev`, for example
`exports/public-reviews.json`). Without REMOTE, a fresh runner has no
local file and always fail-opens. Do not commit a host filesystem path.

- Unset `PUBLIC_REVIEWS_SNAPSHOT` or missing local file: keep the
  checked-in stand-in and continue (fail-open).
- `PUBLIC_REVIEWS_SNAPSHOT_REMOTE` set and `scp` fails (any exit code:
  absent file, auth, or transport): keep the stand-in and continue
  (fail-open). The log names the scp exit code.
- Present but fails parse, scrub, or `assertPubliclySafe`: fail the
  deploy (fail-closed). Secrets must not ship.

`node apps/docs/scripts/copy-public-reviews-snapshot.mjs <source> <dest>`
is the gate. The CLI requires both paths; the shared script skips the CLI
when the local path env is unset. The epic preview ingest uses the same
script and the same two repository variables. Production deploys do not ingest.

