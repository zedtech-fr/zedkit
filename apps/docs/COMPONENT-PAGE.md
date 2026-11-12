# Component page template (UI registry bricks)

Rich UI needs with a `registry` brick in `docs-manifest.json` render through
`ComponentPage` instead of the thin catalog layout. All factual content comes
from `catalog.json`, TypeScript sources, and staged `registry/ui/` (`pnpm registry:build`) — never
hand-written props or export lists.

## Sections (order)

| # | Section | Source |
| --- | --- | --- |
| 0 | Breadcrumb (`UI /` job group), title (Short name), purpose (role), Stable, package, Source | Generated props on `ComponentPage`. Catalog `MaturityBadge` still hides Stable; the page header does not. Wraps is not in this meta row. |
| 1 | Preview / Code | `ComponentPreview` / demo registry (look + dark, before usage). Primary Preview sits in the violet high-value stage; usage and Preview Code are dark wells. |
| 2 | Who / Use / Avoid | Catalog guidance once, after the specimen |
| 3 | Use it | Catalog `examples[]` |
| 4 | Kit not installed yet? | Two quiet tabs, Install and Copy, after usage. Install: the package command, then the import, in one frame. Copy: a "Copy method" select ("Add with CLI (like shadcn)" or "Copy manually"), then the CLI command or the registry file, then the local import. The package manager is a select in the terminal header, shared by every command on the page and remembered across pages (same `package-manager` storage key as the generated pages). npm-only needs show the Install frame only. Commands, paths and companion files come from the adoption plan, never from page code ([AGENTS.md](./AGENTS.md#install-and-copy-instructions)) |
| 5 | Props | Kit props first from source types; inherited HTML attrs folded |
| 6 | Accessibility | Catalog `- A11y:` |
| 7 | Related | Catalog `seeAlso` → doc links |
| 8 | Troubleshooting | Catalog `- Troubleshooting:` |

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
