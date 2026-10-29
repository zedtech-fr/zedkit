# Spike: live identity editor

Proof (this branch): `packages/ui/src/identity-tokens.ts` writes CSS
variables onto a scoped `[data-identity]` node; `preview/identity-editor.tsx`
is a fixture (presets, one control per family, undo/redo/reset, prompt stub,
CSS/JSON export). Tests: `identity-tokens.test.ts`, `identity-editor.test.tsx`.

Not a product. Do not merge without owner approval.

## Token inventory

Families identities already vary (`identities.css` + `identities/*.css`).
Mist scoped reset is the checklist (`identity-scope-reset.test.ts`).

| Family | Tokens | Gap vs this spike |
|---|---|---|
| Colour | `--background` … `--sidebar-accent`, `--overlay` | Light pair only (5 channels). No dark, no semantic rest. |
| Type | `--zk-font-*`, `--font-*`, `--text-*`, weights, `--zk-heading-*`, `--zk-label-*`, `--zk-body-leading` | Display family, heading tracking, body leading. No scale, weight, transform. |
| Spacing | `--spacing` | One control. |
| Shape | `--radius` + xs…3xl, `--zk-border-width`, ring widths | One radius copied to every step; one border width. |
| Depth | `--zk-shadow-*`, `--zk-shadow-color`, glass tokens | `sm` + `md` only. No glass. |
| Motion | `--motion-*`, `--zk-reveal-*`, `--zk-lift-*`, button motion | Unedited. |
| Texture | `--zk-bg-*`, `--zk-deco-ticker` | Unedited. |

Shipped looks (mist, press, tide, volt, maison, glass) already differ on
spacing, radius, border, leading, tracking, colour, shadow, and type.
The editor must keep that: a generated look that only tints colour is not
an identity.

## Architecture

```text
IdentityTokens (zod)
  -> tokensToCss(selector)
  -> <style data-slot="identity-token-sheet">
  -> [data-identity-scope][data-identity="draft"]
```

No reload. Components keep reading utilities (`bg-card`, `rounded-xl`,
`shadow-md`, `font-sans`). The sheet overrides the same variables identity
CSS already sets. Selector is a scoped node, not `<html>`, so the page
identity stays put.

History is a past/present/future stack of token snapshots (stdlib, no lib).

## AI flow

```text
prompt -> suggestIdentityTokens -> schema.parse -> diff (history) -> apply/undo
```

`@zedtech/zedkit-ai` copies skills into a repo. It has no generate or
structured-output call. This spike stubs `suggestIdentityTokens` as a
keyword map that still runs `identityTokenSchema.parse`. Lot 4 replaces
the stub with a model call whose JSON goes through `parseIdentityTokens`.
Show the JSON export as the diff; Undo is the reject path.

## Reuse

- Identity CSS + `[data-identity-scope]` (already live in docs)
- `identityPresets` values copied from the shipped files
- `zod` (already in `ui`)
- Kit `Field` / `Input` / `Button` / `Stack`
- No `culori` (HSL regex). No new package.

## Open questions

1. Public API: export the schema/writer now, keep the editor a fixture
   until messages and dark land?
2. Dark: second schema object, or generate dark from light?
3. Contrast: reject palettes under 4.5:1 before apply?
4. Where the model runs (docs route vs consumer server). No key in this
   repo.
5. Per-step radius and type scale: more controls, or derive from one?

## Lot 4 issue split

1. **Schema + writer** (this proof): compact `IdentityTokens`, CSS sheet,
   unit tests. Patch changeset.
2. **Editor chrome**: fixture → kit export, `ZedkitUiProvider` strings,
   docs page, undo/export.
3. **Full families**: dark, type scale, motion, glass, per-step radius.
4. **Model adapter**: structured JSON → `parseIdentityTokens`. Diff
   preview. No SDK in `ui`.
5. **Guards**: contrast, reduced-motion caps already in identity CSS.

## Risks

- One radius for every step flattens tide/glass scales.
- Stub suggestions are not a model.
- Colour channels are trusted HSL; a later contrast check is required
  before shipping generated palettes.
- Injected `<style>` is scoped; do not write it on `<html>` in the
  product (fights `IdentityScript`).
