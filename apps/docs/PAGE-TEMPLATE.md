# Catalog page template

Every catalog need becomes one docs URL: `/docs/<folder>/<slug>`. The page is
assembled at build time from generated blocks plus optional hand-written prose.

**Two layouts.** Most needs use the section order below (`pageMdx` in
`scripts/generate.mjs`). Needs with a `registry` brick in `docs-manifest.json`
render through `ComponentPage` instead — different section order; see
[COMPONENT-PAGE.md](./COMPONENT-PAGE.md).

## Section order (non-registry catalog pages)

| Section | Source | Required |
| --- | --- | --- |
| Front matter (`title`, `description`, `status`) | Generated | yes |
| Maturity badge | Generated | yes |
| At a glance (Who / What / Use when / Avoid when / See also) | Generated from catalog | when fields exist |
| Preview | Generated | when `docs-manifest.json` lists the need |
| Install | Generated | yes |
| Example | Generated from catalog | yes |
| Deep sections (Scenario, Troubleshooting, …) | Prose | optional |
| Props | Generated | when manifest lists props |
| Accessibility | Generated from catalog | when A11y field exists |

Do not duplicate generated section titles in prose. CI rejects them.

## Prose files

Path: `apps/docs/prose/<folder>/<slug>.mdx`

- `<folder>` is the package short name (`core`, `ui`, …), same as the generated folder.
- `<slug>` is the slug derived from the catalog need heading (see `slugify` in `scripts/generate.mjs`).
- No YAML front matter.
- Start with `## Your section title` (at least one `##` section).
- Use real snippets from the repo; facts must match the implementation.
- Prose is merged after **Example** and before **Props** (non-registry pages only).

Orphan prose (no matching catalog page) or prose that renames a generated section fails `pnpm docs:check`.

## Guide pages

Path: `apps/docs/prose/guides/<slug>.mdx` (plus `index.mdx` for `/docs`).

- Full MDX with YAML front matter; not merged into catalog pages.
- Code fences may use `{{snippet:name}}` to inline files from `prose/guides/snippets/` at generate time.
- `GUIDE_NAV_SLUGS` in `scripts/generate.mjs` controls sidebar order before package folders.
