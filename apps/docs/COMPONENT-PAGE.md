# Component page template (UI registry bricks)

Rich UI needs with a `registry` brick in `docs-manifest.json` render through
`ComponentPage` instead of the thin catalog layout. All factual content comes
from `catalog.json`, TypeScript sources, and `registry/generated/ui/` — never
hand-written props or export lists.

## Sections (order)

| # | Section | Source |
| --- | --- | --- |
| 0 | At a glance (Who / What / Use when / Avoid when / See also) | Shared generated block, same as non-registry pages |
| 1 | Install | Package manager tabs + `npx shadcn add <site>/r/<registry>.json` |
| 2 | Import | Catalog `- Import:` line (exact symbols) |
| 3 | Registry source | `registry/ui/<registry>.tsx` (rewritten imports), Copy on each block |
| 4 | Exports | Symbols from Import + role heuristic |
| 5 | Preview | `ComponentPreview` / demo registry |
| 6 | Examples | Catalog `examples[]` (2–3 fenced `ts` blocks; titles from `- Examples:`) |
| 7 | Props | `AutoTypeTable` when manifest lists `props` + `source` |
| 8 | Accessibility | Catalog `- A11y:` |
| 9 | Related | Catalog `seeAlso` → doc links |
| 10 | Troubleshooting | Catalog `- Troubleshooting:` |

## Catalog fields (UI component needs with registry)

Add to the need section in `packages/ui/CATALOG.md`:

- `- Registry: <brick>` — must match `registry.json` and `docs-manifest.json`
- `- Examples: Title one, Title two, …` — one title per ```ts block (≥2 for component pages)
- `- A11y:` — keyboard, focus, semantics
- `- Troubleshooting:` — short factual bullets (plain text)

Run `pnpm catalog:build` after edits.

## Rollout

Badge, Drawer, and ConfirmDialog use this template when `registry` is set in the manifest. Enable other `registry` bricks in `public/r/` one PR at a time.
