# Upgrade: ref as a prop, and kit messages

Applies when you bump `@zedtech/zedkit-ui` (and `@zedtech/zedkit-quality` if
you use `uiPreset`) through the minors that land ref-as-prop and
`ZedkitUiProvider`. Runtime of existing `<Button ref={r} />` call sites
does not change. Types, lint, and chrome strings do.

English chrome is the default with no provider. Wrap the tree only when
you want French or your own copy.

## 1. Ref is a prop (no `forwardRef`)

Hosts take `ref` on the props object (`React.ComponentProps<"button">`).
`@zedtech/zedkit-quality` flags `forwardRef` and points at
`packages/ui/src/button.tsx`. Each exported root sets `data-slot`.

```tsx
// before
const Save = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} {...props} />
));
type SaveRef = React.ElementRef<typeof Button>;

// after
function Save(props: ButtonProps) {
  return <Button {...props} />;
}
type SaveRef = React.ComponentRef<typeof Button>;
```

Search (review every hit):

```sh
rg -n "forwardRef" --glob "*.tsx"
rg -n "ElementRef<" --glob "*.ts*"
```

Drop the `forwardRef` wrapper and keep the body; `ref` arrives in `props`.

## 2. Kit messages (`ZedkitUiProvider`)

Kit chrome (Close, Filter…, empty table, loading names) reads from
`ZedkitUiProvider`. A per-host label / `aria-label` / `placeholder` prop
still wins.

```tsx
import { ZedkitUiProvider, zedkitUiMessagesFr } from "@zedtech/zedkit-ui";

<ZedkitUiProvider messages={zedkitUiMessagesFr}>
  <App />
</ZedkitUiProvider>
```

Search for leftover literals on kit hosts (review every hit):

```sh
rg -n 'aria-label="Close"' --glob "*.tsx"
rg -n 'placeholder="Filter' --glob "*.tsx"
```

## Per-app checklist

Each app that depends on `@zedtech/zedkit-ui` does this in its own
repository. Maintainers there open the upgrade PR; this repo does not.

1. Bump `@zedtech/zedkit-ui`. If you lint with `uiPreset`, bump
   `@zedtech/zedkit-quality` in the same PR.
2. Run the searches above. Replace `forwardRef` wrappers. Keep a
   per-host label where the screen needs different words than the kit.
3. Wrap the tree with `ZedkitUiProvider` only when chrome must not be
   English.
4. `pnpm typecheck` and `pnpm lint` (or the repo's equivalents).
5. Merge on that app's own review path.
