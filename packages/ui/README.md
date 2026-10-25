# @zedkit/ui

Admin UI kit: design tokens, dark/light theme, and shadcn/ui-based
building blocks (MIT, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).
Neutral and calm by default. Not published to npm yet — install
from a packed tarball.

## Adopt in 3 lines

```css
/* app/globals.css (Tailwind v4, PostCSS or Vite plugin) */
@import "@zedkit/ui/styles.css";
@source "../node_modules/@zedkit/ui/src/**/*.{ts,tsx}";
```

```tsx
import { cn } from "@zedkit/ui"; // components land per slice; see CATALOG.md
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
- Planned next: preview gallery, frontend guardrails.

## Develop

`pnpm --filter @zedkit/ui test|typecheck|lint|build`.
Component tests render with Testing Library + jsdom.

## Gallery

`pnpm --filter @zedkit/ui preview` builds and serves a static gallery
of every component in every state at http://127.0.0.1:4123/ (`/dark`
for the dark theme). Static server render for visual review only —
behavior stays covered by unit tests. `pnpm --filter @zedkit/ui
smoke` runs the Playwright smoke over both themes (sections render,
zero console errors) and writes screenshots to test-results/.
