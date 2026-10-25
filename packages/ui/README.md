# @zedtech/zedkit-ui

Admin UI kit: design tokens, dark/light theme, and shadcn/ui-based
building blocks (MIT, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).
Neutral and calm by default. Not published to npm yet — install
from a packed tarball.

## Adopt in 3 lines

```css
/* app/globals.css (Tailwind v4, PostCSS or Vite plugin) */
@import "@zedtech/zedkit-ui/styles.css";
@source "../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
```

```tsx
import { cn } from "@zedtech/zedkit-ui"; // components land per slice; see CATALOG.md
```

Needs: React 19 + Tailwind v4 in the consumer (peer dependencies),
`.dark` class strategy for dark mode (`next-themes` recommended).

## Contents

- `styles.css`: tokens + dark/light theme preset.
- `cn()`: classnames merge.
- Primitives: `Button`, `Badge`, `Input`, `Label`, `Separator`,
  `Skeleton` (see CATALOG.md for usage).
- Overlays: `Dialog` set, `ConfirmDialog`, `Toaster`, `SecretField`.
- Data: `DataTable` (sort, filter, pagination, empty/loading/
  error states) + `Table` primitives.
- Layout: `AppShell` (sidebar + topbar + main slots), `PageHeader`.
- Wizard: `WizardSteps` (step indicator), `OptionCards` (multi-select cards).
- Detail: `DetailPanel` (key-value rows), `LivePulse` (live indicator).

## Provenance

Files marked `Derived from shadcn/ui (<item>)` are adapted from the
official shadcn/ui registry; the matching catalog entries carry
`- Derived from:`. Unmarked files are kit-authored. Derived files are
the only tolerated third-party-shaped exception: each migrates to
custom code only when customization needs it.

## Develop

`pnpm --filter @zedtech/zedkit-ui test|typecheck|lint|build`.
Component tests render with Testing Library + jsdom.

## Gallery

`pnpm --filter @zedtech/zedkit-ui preview` builds and serves a static gallery
of every component in every state at http://127.0.0.1:4123/ (`/dark`
for the dark theme). Static server render for visual review only —
behavior stays covered by unit tests. `pnpm --filter @zedtech/zedkit-ui
smoke` runs the Playwright smoke over both themes (sections render,
zero console errors) and writes screenshots to test-results/.
