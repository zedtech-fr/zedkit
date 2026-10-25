# Catalog — @zedkit/ui

## Theme an admin app (dark/light included)

- Import: `@zedkit/ui/styles.css` (+ one `@source` line, see README)
- Wraps: `tailwindcss` (v4 CSS-first)
- Status: stable

```ts
import "@zedkit/ui/styles.css"; // tokens + theme, once per app
// globals.css also needs this line so Tailwind scans components:
// @source "../node_modules/@zedkit/ui/src/**/*.{ts,tsx}";
// .dark on <html> (next-themes recommended) flips the theme.
```

## Merge class names without conflicts

- Import: `@zedkit/ui` — `cn`
- Wraps: `clsx`, `tailwind-merge`
- Status: stable

```ts
import { cn } from "@zedkit/ui";
cn("px-4", isActive && "bg-accent"); // "px-4 bg-accent"
cn("px-4", "px-2"); // "px-2" — last conflicting utility wins
```
