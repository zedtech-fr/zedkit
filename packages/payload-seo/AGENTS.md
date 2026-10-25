# AGENTS.md — @zedkit/payload-seo

Payload field factory for the shared SEO leaf set. `payload` is a
peer dependency (types only — the factory returns plain field
config, no runtime import).

Rules:

- New code goes in `src/`, tests in `tests/unit/` (plain vitest;
  assert field shapes and validator messages, never boot Payload).
- Every public export gets a `## <need>` entry in CATALOG.md
  (format in `docs/catalog/README.md`), then run
  `pnpm catalog:build` from the root.
- Keep the leaf set in sync with `@zedkit/seo`'s metadata inputs:
  every stored value must have a consumer (meta title/description,
  keywords, canonical, OG tags, robots flags).
- No custom admin UI here: editor guidance lives in `admin`
  descriptions. A live SERP preview is future work, only if asked.
- Public repo: generic wording only, no private project names
  anywhere (CI denylist enforces it).
