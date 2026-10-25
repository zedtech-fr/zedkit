# apps/docs — Agent Instructions

Generated Fumadocs site. Pages come from `docs/catalog/catalog.json` via
`scripts/generate.mjs`; never hand-write a page per need.

## Frontend rules (enforced)

- **One demo = one file** in `components/demos/<name>-demo.tsx`, registered
  in `components/demos/registry.ts` (key `XxxDemo` + file). Pages and MDX
  consume demos **only** through the registry key or the
  `ComponentPreview` frame — never a direct demo-file import.
- **Pages stay thin.** `app/**/page.tsx` loads MDX + layout. No namespace
  imports (`import * as`) in pages.
- **Kit layout modules only** in `components/`: `Stack`, `Section`,
  `Heading`, `Text` from `@zedtech/zedkit-ui`. No raw `<div>`/`<span>`
  layout. Semantic landmarks (`main`, `section`) and inline semantics
  (`strong`, `pre`/`code` for displayed source) stay.
- The root ESLint `uiPreset` already applies here (tokens only, no `style`
  attributes, jsx-a11y, Tailwind hygiene).
- `scripts/check.mjs` (run by `pnpm catalog:check` in CI) enforces the
  registry mapping, the no-direct-import rule, and the no-raw-div rule.

## Commands

```sh
pnpm docs:generate   # regenerate content/ from the catalog (gitignored)
pnpm docs:check      # coverage + registry + frontend rules
pnpm dev             # from the repo root: catalog build + site on :3100
```
