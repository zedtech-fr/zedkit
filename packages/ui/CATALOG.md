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

## Trigger actions with buttons

- Import: `@zedkit/ui` — `Button`, `buttonVariants`, `ButtonProps`
- Wraps: `@radix-ui/react-slot`, `class-variance-authority`
- Status: stable

```ts
import { Button } from "@zedkit/ui";
<Button>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon" aria-label="Close">×</Button>
```

## Show a status or count badge

- Import: `@zedkit/ui` — `Badge`, `badgeVariants`, `BadgeProps`
- Wraps: `class-variance-authority`
- Status: stable

```ts
import { Badge } from "@zedkit/ui";
<Badge>live</Badge>
<Badge variant="outline">3 retries</Badge>
```

## Collect text input with a label

- Import: `@zedkit/ui` — `Input`, `Label`
- Wraps: `@radix-ui/react-label`
- Status: stable

```ts
import { Input, Label } from "@zedkit/ui";
<Label htmlFor="name">Name</Label>
<Input id="name" placeholder="Ada" />
```

## Separate content horizontally or vertically

- Import: `@zedkit/ui` — `Separator`
- Wraps: `@radix-ui/react-separator`
- Status: stable

```ts
import { Separator } from "@zedkit/ui";
<Separator />
<Separator orientation="vertical" className="h-6" />
```

## Show loading placeholder blocks

- Import: `@zedkit/ui` — `Skeleton`
- Wraps: `(none)`
- Status: stable

```ts
import { Skeleton } from "@zedkit/ui";
<Skeleton className="h-4 w-24" />
```
