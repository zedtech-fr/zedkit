# QA route inventory — zedkit site (`http://localhost:3100`)

Branch `epic/73-redesign` @ `3130b42d`. Enumerated 2026-11-14 from the App
Router (`apps/docs/app`), `apps/docs/lib/site-nav-data.ts`,
`apps/docs/app/sitemap.ts`, `apps/docs/tests/site-routes.ts`
(`SITE_AUDIT_ROUTES`), and `docs-manifest.json`. Audited at 1440/390 ×
light/dark (1920 only if a layout breaks there).

## App-router routes (15 `page.tsx`)

- `/` — `app/(home)/page.tsx`
- `/docs` + slugs — `app/docs/[[...slug]]/page.tsx`
  (`getting-started`, `build-an-admin-dashboard`,
  `set-up-your-coding-agents`, `nest/start-a-safe-nestjs-api`,
  `add-seo-to-nextjs`, `zedkit-and-shadcn`, `foundations`,
  `maturity-and-compatibility`, plus manifest slugs)
- `/catalog` — `app/(site)/catalog/page.tsx`
- `/examples/note-list` — `app/(site)/examples/note-list/page.tsx`
- `/features/identity-editor` — `app/(site)/features/identity-editor/page.tsx`
- `/features/identity-kit-demos`
- `/issues`, `/issues/[n]`, `/issues/pr/[n]` — `app/(site)/issues/`
- `/reviews`, `/reviews/pr/[n]`, `/reviews/pr/[n]/runs/[id]` —
  `app/(site)/reviews/`
- `/issues/run`, `/issues/[n]/runs/[id]`, `/issues/pr/[n]/runs/[id]` —
  `app/(run-console)/issues/`

## Chrome / export / registry

- `sitemap.xml` (`apps/docs/app/sitemap.ts`)
- Site nav (AI / UI / Docs / Catalog / Issues)
- Site footer + 404 (`app/not-found.tsx` + `app/_not-found/`)
- `/r/<brick>.json` registry payloads (`public/r/`)
- `robots.txt`, `llms.txt`, `opengraph-image`

## Server-rendered evidence (this run)

`node packages/ai/dist/bin.js evidence --base-url http://127.0.0.1:3100`
with 17 concrete routes at 390/1440 × light/dark → run record kept
outside the repo (`/tmp/qa-evidence/`, gitignored by location).
Per-route findings and fix verification in `qa/report.md`.
