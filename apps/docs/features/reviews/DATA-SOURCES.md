# Public run history data sources

The public run history page (`/issues`) is built from two adapters
behind `ReviewPort`, merged at docs build into a version-1
`PublicIssueIndex` (`kind: public-github-runs`; `issues` +
`pullRequests`):

1. **GitHub REST** for `zedtech-fr/zedkit` (public): issue number,
   title, state, and linked PRs (runs-API `issue`/`pr` union closing
   keywords in the PR body). Optional build-time token
   (`ZEDKIT_GITHUB_READ_TOKEN`, else `GITHUB_TOKEN`) only raises the
   rate limit. Unauthenticated still works. The token is never logged
   and never imported from a client module.
2. **Hosted runs API** `GET {NEXT_PUBLIC_ZEDOS_RUNS_API_BASE}/<live-service>/api/runs`
   (v1 envelope). Staging and epic preview set the base to
   `https://dev.zedkit.app`. Production leaves it unset, so the section
   is empty (not an error).

Build-time fetch fills the static export. There is no client refresh.
If GitHub or an attempted runs fetch fails after retries, the page
renders ErrorState with no Retry — recovery is the next site publish —
never sample rows. The ErrorState links to All issues.

`kind: public-github-runs` is the production merge. Fixture JSON for
the snapshot parser (`public-stand-in`, `generated-run-index`) lives
only under tests.

The live-shaped parser below stays so tests (and a denser payload later)
do not need a rewrite. It is **not** the public-page feed.

## Environment

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_ZEDOS_RUNS_API_BASE` | Origin for the runs list. Unset → skip that fetch. |
| `ZEDKIT_GITHUB_READ_TOKEN` / `GITHUB_TOKEN` | Optional, server/build only. |

## Failure policy

GitHub is always attempted. The runs API is attempted only when the
base is a non-empty HTTPS/HTTP URL. An invalid base is a load error
(same as a failed fetch). Any attempted source that fails after
`fetchJson` retries yields an empty index plus `hasLoadError`. Empty
successful lists are the empty state (“No public runs yet”), not the
error state. Load-error HTML is `robots` noindex; `/issues` stays on
the sitemap so the URL still resolves.

The HTML is baked at build. ErrorState has no Retry. The visitor sees
fresh data after the next publish.

`liveUrl` is kept only when it matches `HOSTED_LIVE_HREF_PREFIX` plus a
path-safe run id.

## Caps (contract)

Partial lists return as success. There is no truncated flag.

| Source | Cap |
| --- | --- |
| GitHub issues / pulls | 10 pages × 100 |
| GitHub review fallbacks | 40 PRs |
| Hosted runs API | 10 pages × 200 (`limit`) |

## Home hero active run (client)

The home illustration polls the same hosted list from the browser:
`GET {NEXT_PUBLIC_ZEDOS_RUNS_API_BASE}/<live-service>/api/runs?active=1&limit=1`
(`fetchActiveHeroRun`). This is not the `/issues` feed (`/issues` stays
build-time only).

The consumer keeps a row only when `version === 1`, `runs` is an array,
and the first run has `active === true` and `stale !== true`. Envelope
`kind` is ignored. The run must include `runId`, boolean `active` /
`stale`, optional `title` / `issue` / `pr` / `liveUrl`, and `steps`
with the five keys `plan`, `build`, `check`, `fix`, `done` (status
`pending` | `active` | `done` | `failed` | `skipped`, optional
`summary`). Extra step objects and extra run keys are ignored. Parse
or fetch errors keep the last live card and mark it stale; empty or
inactive/stale lists return the placeholder.

## Version

Both shapes require `"version": 1`. Any other version fails closed.

## Generated run index (internal model)

Required wrapper keys: `version`, `kind`, `issues`, `pullRequests`.
Extra keys on the wrapper and on index rows are ignored
(`requiredObject`) so a denser payload can sit in the same file.

```json
{ "version": 1, "kind": "public-github-runs", "issues": [], "pullRequests": [] }
```

An empty `issues` / `pullRequests` array is valid. Static export still
needs a placeholder `generateStaticParams` entry; that is a site
concern, not a merge concern.

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
| `endedAt` | Optional ISO-8601 string, or `null`. The runs API keeps this stamp; the list uses it for `UpdatedAgo` on completed and failed steps (`startedAt` while running). |
| `durationMs` | Finite number ≥ 0, or `null` (running). |
| `models` | String array. Skip empty strings. Plan, implement, and dry-run: engine model. Review: lens and second-pass models. Improve: improve model. |
| `verdict` | `approve` \| `request-changes` \| `comment`, or `null`. |
| `score` | Optional integer 0–10, or `null`. Shown next to a review verdict. |
| `superseded` | Optional boolean. The list shows replacement copy when true (`Replaced by newer run`, or `Didn't finish — replaced by a newer run` when the step also failed). |
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

Join order for the live merge: GitHub closing references (`Fixes #N`
in the PR body) first; then runs-API `issue` / `pr`; remainder
unlinked. GitHub review fallback (verdict + Confidence score) fills
each null field on a **completed** `review` entry. A completed review
with a verdict and a null score still receives the GitHub score. A
failed or running review keeps `verdict: null` so Failed / Running
stays visible. Fallback parse keeps the newest GitHub review that has
both a mapped state and a `Confidence: N/10` line; a human APPROVED
review without that line does not stamp. Each fallback fetch is one
unpaginated request (GitHub default page size).

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
{ "version": 1, "kind": "public-live-runs", "reviews": [] }
```

`reviews` holds hosted live rows. This shape stays parseable so a
denser payload can land later. It is **not** the production feed for
the public run history page. There is no `selected` field.

Optional join fields on `run` (safe integer or null / string or null;
omit when unknown):

- `issue` — GitHub issue number. When it is a safe integer, the mapper
  builds an issue row. When it is missing or null, the PR stays
  unlinked (`/issues/pr/:n`).
- `live_url` — hosted live console URL. The public gate keeps it only
  when it matches `HOSTED_LIVE_HREF_PREFIX` plus a path-safe run id;
  otherwise the index stores `null`. Index-only `/issues/N/runs/<id>`
  (and unlinked run URLs) redirect to that href, or to the issue /
  unlinked page when it is missing. A live-backed `/issues/N/runs/<id>`
  still mounts the shared kit console when a live row exists.
  `review_url` is a GitHub review link and is **not** a hosted
  console URL; the mapper never copies it to `liveUrl`.
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

## Share URL (site, not merge)

Issue pages pin a local `ThemeScope` from these query keys. The merge does not emit them. An empty query inherits the site look (the identity dock is enough). Do not restore an inline preview form.

| Key | Pins |
| --- | --- |
| `identity` | shipped kit preset: `mist`, `press`, `tide`, `volt`, `maison`, `glass` |
| `preview` | `dark` |
| `theme` | legacy alias of `preview` (`theme=dark` still parses) |
| `density` | `compact` |

Any listed key pins the whole appearance. Missing, empty, or unknown values use codec defaults (glass, light, default density); they do not inherit the site look. `serializeReviewAppearance` in `apps/docs/features/reviews/model/review-appearance.ts` is the canonical writer (omit glass, light, default density).

Pinned URLs read `window.location.search` after mount (static export). The first paint may show the unpinned site look; that flash is accepted.

## Staging and production

`deploy-dev.yml` and `deploy-epic-preview.yml` set
`NEXT_PUBLIC_ZEDOS_RUNS_API_BASE=https://dev.zedkit.app` on the docs
build and may pass `GITHUB_TOKEN` to raise the GitHub rate limit.
They do not ingest a JSON snapshot. Production `deploy-docs.yml` is
unchanged: no runs base, no ingest.

