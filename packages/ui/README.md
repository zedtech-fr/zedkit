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
- Planned next: dialog, toast, data table, app shell, wizard
  stepper — one slice each.

## Develop

`pnpm --filter @zedkit/ui test|typecheck|lint|build`.
Component tests render with Testing Library + jsdom.
