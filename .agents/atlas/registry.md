# shadcn registry theme and copy install

Full Entry paths, traps, and Touches for the index rows that point here. The index in `.agents/atlas.md` stays a pointer; fix facts here and keep that row in sync.

## Where

| Topic | Entry | Why it lives there / trap | Touches | Checked |
| --- | --- | --- | --- | --- |
| Registry copy theme (shadcn path) | `scripts/registry/theme-payload.mjs` | Generated from styles.css: cssVars.light/dark are the colour HSL roles only (shadcn wraps them); later `:root` / `@media` / identity selectors stay in `css` with their real selectors. Do not put `color-*` `hsl(var(--…))` aliases in cssVars — shadcn would double-wrap. Theme `css` `@utility` blocks are only those used by staged `registry/ui` sources: a new class on a copied brick needs stage + theme sync (`pnpm registry:build`) so committed `registry.json` gains that utility; skipping it fails `registry-copy-css.test.ts`. | drift: `scripts/registry/theme-tokens.mjs`; closure: `packages/ui/tests/unit/registry-copy-css.test.ts`; `scripts/registry/theme-payload.test.mjs` | 2026-11-11 |
| Registry stage + copy install | `scripts/registry/build.mjs` | Canonical source is `packages/ui/src`. Unique basename walk stages gitignored `registry/ui/`, then `shadcn build`. Rewrite resolves the importer's real target, then maps that file to its declared consumer path; only `src/utils.ts` gets `@/lib/utils`. Copy path is hosted JSON + `@zedkit`; GitHub shorthand is retired. Init `--base radix --preset nova`. `@source` is relative to the CSS file (`../` vs `../../`). | `resolve-ui-source.mjs`; `rewrite-ui-imports.mjs`; `scripts/registry/check.mjs` | 2026-11-08 |
