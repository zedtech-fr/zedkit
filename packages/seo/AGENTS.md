# AGENTS.md — @zedtech/zedkit-seo

Generic SEO builders. Pure functions, options-driven: every builder
takes a site/page/entries input and returns content. No brand, no
hard-coded URLs, no CMS calls — callers map their docs to the plain
input shapes first.

Rules:

- New code goes in `src/`, tests in `tests/unit/` (plain vitest,
  no DOM needed except the standard `Response` in llms tests).
- Every public export gets a `## <need>` entry in CATALOG.md
  (format in `docs/catalog/README.md`), then run
  `pnpm catalog:build` from the root.
- JSON-LD stays typed via `schema-dts` (the one dependency,
  types-only). If schema.org adds a type you need, extend the
  builders — never hand-write `@context` blobs at call sites.
- Metadata/robots/sitemap shapes mirror the Next.js Metadata API
  structurally on purpose, so the package needs no `next`
  dependency. Keep them in sync with that API by shape, not by
  import.
- SEO preservation (for consumers): never change a published URL
  without a redirect; keep titles/descriptions stable unless the
  page changed; every page keeps exactly one canonical + one
  JSON-LD graph; drafts are `noindex` until published.
- Public repo: generic wording only, no private project names
  anywhere (CI denylist enforces it).
