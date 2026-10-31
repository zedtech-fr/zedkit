# Component page template (UI registry bricks)

Rich UI needs with a `registry` brick in `docs-manifest.json` render through
`ComponentPage` instead of the thin catalog layout. All factual content comes
from `catalog.json`, TypeScript sources, and `registry/generated/ui/` — never
hand-written props or export lists.

## Sections (order)

| # | Section | Source |
| --- | --- | --- |
| 0 | Maturity badge + purpose line | Generated props on `ComponentPage` |
| 1 | Preview / Code | `ComponentPreview` / demo registry (before any install copy) |
| 2 | Install or copy | npm package path + registry copy path (separate tabs) |
| 3 | Usage and states | Catalog guidance fields + `examples[]` + collapsed exports |
| 4 | Props | `AutoTypeTable` with kit props first; inherited HTML attrs folded |
| 5 | Accessibility | Catalog `- A11y:` |
| 6 | Related | Catalog `seeAlso` → doc links |
| 7 | Troubleshooting | Catalog `- Troubleshooting:` |

Page title uses catalog `Short name` (for example **Button**), not the need heading.

## Catalog fields (UI component needs with registry)

Add to the need section in `packages/ui/CATALOG.md`:

- `- Registry: <brick>` — must match `registry.json` and `docs-manifest.json`
- `- Examples: Title one, Title two, …` — one title per ```ts block (≥2 for component pages)
- `- A11y:` — keyboard, focus, semantics
- `- Troubleshooting:` — short factual bullets (plain text)

Run `pnpm catalog:build` after edits.

## Rollout

**Button** is the reference page. **Badge** and other registry bricks reuse the same
template with no page-specific code. Enable additional `registry` bricks in
`public/r/` one PR at a time.
