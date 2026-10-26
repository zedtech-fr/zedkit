# Catalog — @zedtech/zedkit-ui

- Keywords: react, react-components, ui-kit, design-system, admin, dashboard, tailwindcss, tailwind-v4, radix-ui, shadcn, dark-mode, accessible, nextjs
- Audience: Teams building admin consoles and dashboards on React 19 + Tailwind v4.
- Purpose: Ship a calm admin UI fast: dark/light design tokens plus accessible building blocks (data tables, forms, dialogs, toasts).


## Theme an admin app (dark/light included)

- Import: `@zedtech/zedkit-ui/styles.css` (+ one `@source` line, see README)
- Wraps: `tailwindcss` (v4 CSS-first)
- Status: beta
- Derived from: shadcn/ui (theme)
- Short name: Theme
- Audience: Teams starting a React admin app who want dark/light design tokens without setup.
- Purpose: One CSS import plus a source line gives the full token set and theme switching.
- When to use: As the first install in every app using the kit.
- When not to use: For apps with their own design system — use your tokens instead of fighting these.
- See also: `Merge class names without conflicts`

```ts
import "@zedtech/zedkit-ui/styles.css"; // tokens + theme, once per app
// globals.css also needs this line so Tailwind scans components:
// @source "../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
// .dark on <html> (next-themes recommended) flips the theme.
```

## Merge class names without conflicts

- Import: `@zedtech/zedkit-ui` — `cn`
- Wraps: `clsx`, `tailwind-merge`
- Status: beta
- Derived from: shadcn/ui (utils)
- Short name: cn
- Audience: Developers composing conditional Tailwind classes.
- Purpose: Merge class lists so conflicting utilities resolve to the last one.
- When to use: Whenever classes are conditional or come from props.
- When not to use: For static class strings — write them directly instead.

```ts
import { cn } from "@zedtech/zedkit-ui";
cn("px-4", isActive && "bg-accent"); // "px-4 bg-accent"
cn("px-4", "px-2"); // "px-2" — last conflicting utility wins
```

## Trigger actions with buttons

- Import: `@zedtech/zedkit-ui` — `Button`, `buttonVariants`, `ButtonProps`
- Wraps: `@radix-ui/react-slot`, `class-variance-authority`
- Status: beta
- Derived from: shadcn/ui (button)
- Short name: Button
- Audience: Anyone placing actions in an admin UI.
- Purpose: Accessible buttons with variants (primary, destructive, outline, ghost) and sizes.
- When to use: For every clickable action, including links styled as buttons.
- When not to use: For navigation menus — use links or tabs instead.
- See also: `Confirm destructive actions`

```ts
import { Button } from "@zedtech/zedkit-ui";
<Button>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon" aria-label="Close">×</Button>
<Button asChild variant="secondary">
  <a href="/docs">Read the docs</a>
</Button>
```

## Show a status or count badge

- Import: `@zedtech/zedkit-ui` — `Badge`, `badgeVariants`, `BadgeProps`
- Wraps: `class-variance-authority`
- Status: beta
- Derived from: shadcn/ui (badge)
- Registry: badge
- Short name: Badge
- Audience: Developers flagging state or counts inline (lists, headers, tables).
- Purpose: Small status/count pills with semantic variants.
- When to use: For short labels next to the thing they describe.
- When not to use: For long text or actions — use Text or Button instead.
- See also: `Indicate status with a dot`
- Examples: Simple, Variants, In a table row, As a link (asChild)
- A11y: Default badge is a `div` (not a live region). Use `asChild` with an anchor or button for links; `focus-ring` applies on keyboard focus. Keep labels short.
- Troubleshooting: Wrong colors in dark mode — ensure `.dark` is on the document root. `BadgeProps` is defined in `badge.tsx` for typing; import types from the same module when using the registry copy.

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge>live</Badge>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge variant="outline">3 retries</Badge>
<Badge variant="destructive">failed</Badge>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<tr>
  <td>sync</td>
  <td><Badge variant="secondary">queued</Badge></td>
</tr>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge asChild variant="secondary">
  <a href="/status">all systems go</a>
</Badge>
```

## Collect text input with a label

- Import: `@zedtech/zedkit-ui` — `Input`, `Label`
- Wraps: `@radix-ui/react-label`
- Status: beta
- Derived from: shadcn/ui (input, label)
- Short name: Input
- Audience: Form builders collecting single-line text.
- Purpose: Labelled text input with consistent styling and focus states.
- When to use: For names, emails, search boxes and other single-line values.
- When not to use: For long text — use Textarea instead.
- See also: `Collect multi-line text input`, `Build validated forms with labels, errors, and pending state`
- A11y: Pair with `Label` or `aria-label`; `focus-ring-control` matches Button keyboard focus. A disabled peer dims the label to `opacity-50`, the kit-wide disabled convention.

```ts
import { Input, Label } from "@zedtech/zedkit-ui";
<Label htmlFor="name">Name</Label>
<Input id="name" placeholder="Ada" />
```

## Separate content horizontally or vertically

- Import: `@zedtech/zedkit-ui` — `Separator`
- Wraps: `@radix-ui/react-separator`
- Status: beta
- Derived from: shadcn/ui (separator)
- Short name: Separator
- Audience: Developers dividing stacked or inline content.
- Purpose: Accessible horizontal/vertical divider lines.
- When to use: Between sections, menu groups, or inline items.
- When not to use: For spacing alone — use Stack gap instead.
- See also: `Stack content and group titled sections`

```ts
import { Separator } from "@zedtech/zedkit-ui";
<Separator />
<Separator orientation="vertical" className="h-6" />
```

## Show loading placeholder blocks

- Import: `@zedtech/zedkit-ui` — `Skeleton`
- Wraps: `(none)`
- Status: beta
- Derived from: shadcn/ui (skeleton)
- Short name: Skeleton
- Audience: Developers covering loading states without layout shift.
- Purpose: Animated placeholder blocks that hold layout while data loads.
- When to use: For content areas with known approximate shape.
- When not to use: For progress with a known percentage — use ProgressBar instead.
- See also: `Show determinate progress`

```ts
import { Skeleton } from "@zedtech/zedkit-ui";
<Skeleton className="h-4 w-24" />
```

## Indicate status with a dot

- Import: `@zedtech/zedkit-ui` — `StatusDot`, `StatusDotProps`, `StatusDotTone`
- Wraps: `(none)`
- Status: alpha
- Registry: status-dot
- Short name: StatusDot
- Audience: Developers showing compact live state (lists, headers, realtime panels).
- Purpose: A small status dot with semantic tones (active, idle, success, warning, danger).
- When to use: Beside a label that names the state (the dot is decorative).
- When not to use: As the only state signal — pair it with text, never color alone.
- A11y: `aria-hidden` by design — the paired text carries the meaning. Size comes from the `--spacing-status-dot` theme token; tones map to semantic color tokens.
- See also: `Show a status or count badge`, `Show key-value details and a live indicator`
- Examples: Single tone, All tones with labels, Static ping override
- Troubleshooting: Dot invisible — the paired text must carry the state (never color alone). Pinging when it should not — ongoing tones (`active`, `warning`, `danger`) ping by default; pass `pulse={false}`.

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="active" /> // active | idle | success | warning | danger; decorative, pair with text
```

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="success" /> // Saved
<StatusDot tone="warning" /> // Retrying…
<StatusDot tone="danger" /> // Failed
```

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="active" pulse={false} /> // static dot, no ping
```

## Show determinate progress

- Import: `@zedtech/zedkit-ui` — `ProgressBar`, `ProgressBarProps`
- Wraps: `(none)`
- Status: alpha
- Short name: ProgressBar
- Audience: Developers reporting measurable progress (uploads, jobs, wizards).
- Purpose: An accessible progressbar with clamped value and label.
- When to use: When you can report a percentage or fraction done.
- When not to use: For unknown-shape loading — use Skeleton instead.
- See also: `Show loading placeholder blocks`
- Examples: Simple, Complete
- A11y: Root carries `role="progressbar"` with clamped value; keep the label screen-only and pair with visible text.

```ts
import { ProgressBar } from "@zedtech/zedkit-ui";
<ProgressBar value={40} label="Uploading report" /> // role=progressbar, value clamped to 0..max
```

```ts
import { ProgressBar } from "@zedtech/zedkit-ui";
<ProgressBar value={100} label="Upload complete" />
```

## Quiet icon beside inline text

- Import: `@zedtech/zedkit-ui` — `IconLabel`, `IconLabelProps`
- Wraps: `lucide-react` (icon slot)
- Status: beta
- Short name: IconLabel
- Audience: Developers pairing a small decorative icon with a text label (chips, table cells).
- Purpose: Fixed-size muted icon + label row; icon is `aria-hidden`, label stays readable.
- When to use: Recognition hints next to names or actions, not in running prose.
- When not to use: Standalone icons — use the Lucide component directly; primary actions — use `Button`.
- See also: `Celebrate completion with a checkmark`
- A11y: Icon is decorative; put the readable name in `children`.

```ts
import { Search } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";
<IconLabel icon={Search}><code>explorer</code></IconLabel>
```

## Celebrate completion with a checkmark

- Import: `@zedtech/zedkit-ui` — `Checkmark`, `CheckmarkProps`
- Wraps: `(none)`
- Status: alpha
- Short name: Checkmark
- Audience: Developers confirming a completed action (saved, sent, done).
- Purpose: An animated checkmark that draws once (static under reduced motion).
- When to use: For success confirmations right after the action completes.
- When not to use: As a persistent status icon — use StatusDot or Badge instead.
- See also: `Show toast notifications`
- Examples: Simple, Decorative
- A11y: Draws once under `motion-safe` (static full check under reduced motion); omit `label` when decorative.
- Registry: checkmark
- Troubleshooting: No draw animation — the path animates only under `motion-safe`; reduced motion shows the static check by design. Announced twice — pass `label` once (it names the `role="img"`); nearby text should not repeat it. Registry copies without the theme show the static check (the `zk-check-draw` keyframes live in `styles.css`).

```ts
import { Checkmark } from "@zedtech/zedkit-ui";
<Checkmark label="Saved" /> // draws once, static under reduced motion; omit label when decorative
```

```ts
import { Checkmark } from "@zedtech/zedkit-ui";
<Checkmark /> // decorative, pair with visible text
```

## Load each zone with a faithful skeleton

- Import: `@zedtech/zedkit-ui` — `CardSkeleton`, `CardSkeletonProps`, `DataTableSkeleton`, `DataTableSkeletonProps`, `DetailPanelSkeleton`, `DetailPanelSkeletonProps`, `PageHeaderSkeleton`, `PageHeaderSkeletonProps`
- Wraps: `(none)`
- Status: alpha
- Short name: Skeletons
- Audience: Developers loading async zones without layout shift (pages, cards, tables, panels).
- Purpose: One faithful loading skeleton per kit component shape, each a named live zone.
- When to use: As a `Suspense` fallback matching the component that will land.
- When not to use: For freeform blocks — use a plain `Skeleton`; for named operations — use `StatusLabel`.
- See also: `Show loading placeholder blocks`

```ts
import { Suspense } from "react";
import { CardSkeleton } from "@zedtech/zedkit-ui";
<Suspense fallback={<CardSkeleton label="Loading report" />}>
  <ReportCard />
</Suspense>
```

## Name an operation in progress

- Import: `@zedtech/zedkit-ui` — `StatusLabel`, `StatusLabelProps`, `StatusLabelTone`
- Wraps: `(none)`
- Status: alpha
- Short name: StatusLabel
- Audience: Developers naming a background or foreground operation for the user.
- Purpose: A named live-region label for the current operation state (loading, saved, error…).
- When to use: Next to the content an operation affects, while it runs or right after.
- When not to use: For bare spinners without a name — use `ProgressBar`; for data age — use `UpdatedAgo`.
- A11y: `role=status` announces the named operation; icon/text spacing comes from `--spacing-status-label-*` theme tokens.
- See also: `Stamp data with its age`
- Examples: Loading operation, Saved and error states, Offline state
- Troubleshooting: Announcement spam — one live label per operation; unmount or repurpose it when done. Wrong tone icon — `loading`/`updating`/`syncing` share the active dot; only `saved` shows the check.

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="loading">Saving report…</StatusLabel> // loading|updating|syncing|saved|retry|error|offline, role=status
```

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="saved">All changes saved</StatusLabel>
<StatusLabel tone="error">Could not save</StatusLabel>
```

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="offline">You are offline</StatusLabel>
```

## Stamp data with its age

- Import: `@zedtech/zedkit-ui` — `UpdatedAgo`, `UpdatedAgoProps`
- Wraps: `(none)`
- Status: alpha
- Short name: UpdatedAgo
- Audience: Developers stamping cached or polled data with its freshness.
- Purpose: A relative "Updated N minutes ago" stamp via `Intl.RelativeTimeFormat`, no date library.
- When to use: Under data that refreshes (polling, SWR, manual refetch).
- When not to use: For absolute timestamps — render a `<time dateTime>` instead.
- A11y: Static text (not a live region) — screen readers meet it while reading; re-render when the data refreshes. Styled with `text-xs text-muted-foreground` only.
- See also: `Name an operation in progress`
- Examples: Simple, Custom prefix
- Registry: updated-ago
- Troubleshooting: Stamp never changes — it renders once per render; re-render from your polling tick or SWR refresh. Future dates read as “just now” (clamped, never “in 5 minutes”).

```ts
import { UpdatedAgo } from "@zedtech/zedkit-ui";
<UpdatedAgo date={updatedAt} /> // "Updated 3 minutes ago" via Intl.RelativeTimeFormat
```

```ts
import { UpdatedAgo } from "@zedtech/zedkit-ui";
<UpdatedAgo date={syncedAt} prefix="Synced" />
```

## Open modal dialogs

- Import: `@zedtech/zedkit-ui` — `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogOverlay`, `DialogPortal`
- Wraps: `@radix-ui/react-dialog`
- Status: beta
- Derived from: shadcn/ui (dialog)
- Short name: Dialog
- Audience: Developers interrupting the flow for focused input or decisions.
- Purpose: Accessible modal dialogs (trigger, content, title, footer) with focus trap and Escape.
- When to use: For short tasks that need full attention (confirm, edit one thing).
- When not to use: For destructive one-click confirms — use ConfirmDialog instead; for long forms use a page.
- A11y: Focus trap and Escape come from Radix; content centers via the `dialog-center` utility (`--spacing-dialog-center`) and elevates with `--shadow-overlay`. Slots, close offset, and overlay stacking come from `--spacing-dialog-*` / `--z-index-overlay`; the close button carries the shared `focus-ring`.
- See also: `Confirm destructive actions`, `Slide in a drawer panel`

```ts
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@zedtech/zedkit-ui";
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent><DialogTitle>Details</DialogTitle></DialogContent>
</Dialog>
```

## Confirm destructive actions

- Import: `@zedtech/zedkit-ui` — `ConfirmDialog`, `ConfirmDialogProps`
- Wraps: `@radix-ui/react-dialog` (via Dialog)
- Status: beta
- Registry: confirm-dialog
- Short name: ConfirmDialog
- Audience: Developers guarding delete/revoke/remove actions.
- Purpose: A one-call destructive confirmation (trigger, title, description, onConfirm).
- When to use: Before any irreversible action.
- When not to use: For reversible or trivial actions — do it and offer undo (toast) instead.
- See also: `Open modal dialogs`
- Examples: Delete confirmation, Custom button labels
- A11y: Opens a Radix dialog (`role="dialog"`) with `DialogTitle` and `DialogDescription`; focus stays inside while open; Escape and Cancel dismiss without calling `onConfirm`. vitest-axe covers the open state in `packages/ui/tests/unit/a11y.test.tsx` ("confirm dialog after opening").
- Troubleshooting: `onConfirm` runs synchronously then closes — start async work inside the handler if needed. `trigger` must be one element (use `Button` asChild target). Registry install lists `button` and `dialog` as shadcn dependencies — use `pnpm add @zedtech/zedkit-ui` when you want one dependency graph.

```ts
import { Button, ConfirmDialog } from "@zedtech/zedkit-ui";
<ConfirmDialog trigger={<Button>Delete</Button>} title="Delete item?"
  description="This cannot be undone." onConfirm={remove} />
```

```ts
import { Button, ConfirmDialog } from "@zedtech/zedkit-ui";
<ConfirmDialog
  trigger={<Button variant="outline">Revoke</Button>}
  title="Revoke access?"
  description="API keys stop working immediately."
  confirmLabel="Revoke"
  cancelLabel="Keep access"
  onConfirm={() => revoke()}
/>
```

## Slide in a drawer panel

- Import: `@zedtech/zedkit-ui` — `Drawer`, `DrawerProps`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerHandle`, `DrawerClose`, `DrawerOverlay`, `DrawerPortal`
- Wraps: `vaul`
- Status: alpha
- Derived from: shadcn/ui (drawer)
- Registry: drawer
- Short name: Drawer
- Audience: Developers showing detail views beside a list without navigation.
- Purpose: Slide-in panels (right-side detail on desktop, bottom sheet on mobile).
- When to use: For list-detail previews and short side forms.
- When not to use: For multi-step flows — use a full page or wizard instead.
- See also: `Open modal dialogs`, `Show key-value details and a live indicator`
- Examples: Right detail panel, Bottom sheet
- A11y: Built on vaul / Radix Dialog: focus trap, Escape to close, rest of the page hidden from assistive tech while open (`role="dialog"`). Provide `DrawerTitle` (and `DrawerDescription` when the panel needs context). Pair the drag handle with a visible close control for keyboard users.
- Troubleshooting: Dim overlay missing after `shadcn add` — install the drawer registry item (it injects the `--overlay` token) or add the token to your theme. On small screens a `direction="right"` drawer spans the width by design.

```ts
import { Button, Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@zedtech/zedkit-ui";
<Drawer direction="right">
  <DrawerTrigger asChild><Button>Open</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerClose asChild><Button variant="ghost" size="sm">Close</Button></DrawerClose>
    <DrawerTitle>Details</DrawerTitle>
  </DrawerContent>
</Drawer>
```

```ts
import { Button, Drawer, DrawerContent, DrawerHandle, DrawerTitle, DrawerTrigger } from "@zedtech/zedkit-ui";
<Drawer>
  <DrawerTrigger asChild><Button variant="outline">Filters</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHandle />
    <DrawerTitle>Filters</DrawerTitle>
  </DrawerContent>
</Drawer>
```

## Render a route as a modal over the list

- Import: `@zedtech/zedkit-ui` — `RouteModal`, `RouteModalProps`, `RouteModalDirection`, `RouteModalSize`, `RouteModalVariant`, `closeRoute`, `CloseRouteOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: RouteModal
- Audience: Developers opening list details in an overlay with a shareable URL (Next.js parallel/intercepting routes).
- Purpose: A route-driven modal (right drawer or centered dialog) that plays its exit before navigating back, with a list fallback.
- When to use: Inside an intercepting `@modal` slot, with `onClose` wired to `closeRoute`.
- When not to use: For state-driven modals — use `Dialog`/`Drawer` directly with local state.
- A11y: Inherits the Dialog/Drawer focus trap and Escape handling; exit plays before `onClose` navigates (immediate under reduced motion). Widths come from `--container-route-modal-*` tokens; exit timing reads `--motion-slow`/`--motion-base` live.
- Composition: Variant props kept deliberately — the variant selects between two Radix roots sharing one exit orchestration, which slots cannot express; custom layouts compose `Dialog`/`Drawer` directly.
- See also: `Slide in a drawer panel`, `Open modal dialogs`, `Confirm destructive actions`

```ts
import { RouteModal, closeRoute } from "@zedtech/zedkit-ui";
import { useRouter } from "next/navigation";
const router = useRouter();
<RouteModal title="Delivery" onClose={() => closeRoute({ ...router, fallback: "/items" })}>
  <DetailView />
</RouteModal>
```

## Show toast notifications

- Import: `@zedtech/zedkit-ui` — `Toaster`, `toast`
- Wraps: `sonner`
- Status: beta
- Derived from: shadcn/ui (sonner)
- Short name: Toaster
- Audience: Developers confirming background outcomes (saved, failed, copied).
- Purpose: A root toaster plus toast() calls for transient notifications.
- When to use: For outcomes that do not need the user's reply.
- When not to use: For errors needing action — use Alert or Dialog instead.
- A11y: The viewport announces via an `aria-live` polite region — keep toasts short, one outcome each. Styling maps toast slots to theme tokens only.
- See also: `Call out a notice or an error state`

```ts
import { Toaster, toast } from "@zedtech/zedkit-ui";
<Toaster /> // once near the root, then toast("Saved") anywhere
```

## Display a shown-once secret with copy

- Import: `@zedtech/zedkit-ui` — `SecretField`, `SecretFieldProps`
- Wraps: `lucide-react`
- Status: beta
- Short name: SecretField
- Audience: Developers displaying API keys and tokens shown only once.
- Purpose: A masked secret field with reveal and copy controls.
- When to use: Right after creating a credential the user must store.
- When not to use: For passwords the user typed — use a password Input instead.
- See also: `Collect text input with a label`

```ts
import { Label, SecretField } from "@zedtech/zedkit-ui";
<Label htmlFor="key">API key (shown once)</Label>
<SecretField id="key" value={key} />
```

## Show a sortable, filterable, paginated data table

- Import: `@zedtech/zedkit-ui` — `DataTable`, `DataTableProps`, `DataTableColumn`, `createDataTableColumns`, `DataTablePagination`, `DataTablePaginationProps`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- Wraps: `@tanstack/react-table`
- Status: beta
- Short name: DataTable
- Audience: Developers listing queryable records (deliveries, users, orders).
- Purpose: Tables with sorting, filtering, pagination plus loading/error/empty states.
- When to use: For record lists over ~20 rows or needing search.
- When not to use: For a handful of static rows — map a simple table instead.
- A11y: Native table semantics (column headers associate by position); head/cell/caption spacing comes from `--spacing-table-*` theme tokens.
- See also: `Show key-value details and a live indicator`
- Examples: Simple, Standalone pagination

```ts
import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";
const helper = createDataTableColumns<Item>();
const columns = [helper.accessor("name", { header: "Name" })];
<DataTable columns={columns} data={items} loading={isLoading}
  error={error} pageSize={20} />
```

```ts
import { DataTablePagination } from "@zedtech/zedkit-ui";
const [page, setPage] = useState(2);
<DataTablePagination page={page} pageCount={4}
  canPrevious={page > 1} canNext={page < 4}
  onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
```

## Lay out an admin page (sidebar + topbar + header)

- Import: `@zedtech/zedkit-ui` — `AppShell`, `AppShellProps`, `PageHeader`, `PageHeaderProps`
- Wraps: none (theme tokens only)
- Status: beta
- Short name: AppShell
- Audience: Teams scaffolding a consistent admin layout.
- Purpose: Sidebar + topbar shell with page header (title, description, actions).
- When to use: As the frame of every admin page.
- When not to use: For public marketing pages — use your site layout instead.
- A11y: Landmark structure (`aside`/`header`/`main`) comes free; sidebar width and main padding come from `--spacing-app-shell-*` theme tokens.
- See also: `Group content in a card section`

```ts
import { AppShell, PageHeader } from "@zedtech/zedkit-ui";
<AppShell sidebar={<OrgNav />} topbar={<UserMenu />}>
  <PageHeader title="Items" description="All items." />
</AppShell>
```

## Guide a multi-step flow with selectable option cards

- Import: `@zedtech/zedkit-ui` — `WizardSteps`, `WizardStepsProps`, `Wizard`, `WizardProps`, `WizardStep`, `WizardStepProps`, `WizardStepState`, `OptionCards`, `OptionCardsProps`, `OptionCard`, `OptionCardProps`, `OptionCardData`
- Wraps: none (native inputs + theme tokens)
- Status: beta
- Short name: WizardSteps
- Audience: Developers building onboarding, setup, or checkout flows.
- Purpose: Step indicator plus selectable option cards with state.
- When to use: For 2–6 step flows with choices per step.
- When not to use: For single forms — use Form instead of inventing steps.
- See also: `Build validated forms with labels, errors, and pending state`
- Examples: Simple, Composed steps, Solo card
- A11y: List carries `aria-label="Progress"`; current step gets `aria-current="step"`. Cards are native checkboxes in labels.

```ts
import { OptionCards, WizardSteps } from "@zedtech/zedkit-ui";
const [picked, setPicked] = useState(["a", "b"]);
<WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
<OptionCards options={options} selected={picked} onChange={setPicked} />
```

```ts
import { Wizard, WizardStep } from "@zedtech/zedkit-ui";
<Wizard>
  <WizardStep step="Pick" index={0} state="done" showConnector />
  <WizardStep step="Configure" index={1} state="current" />
</Wizard>
```

```ts
import { OptionCard } from "@zedtech/zedkit-ui";
const [solo, setSolo] = useState(false);
<OptionCard title="Solo option" checked={solo} onChange={() => setSolo(!solo)} />
```

## Show key-value details and a live indicator

- Import: `@zedtech/zedkit-ui` — `DetailPanel`, `DetailPanelProps`, `DetailItem`, `DetailPanelRow`, `DetailPanelRowProps`, `LivePulse`, `LivePulseProps`
- Wraps: none (theme tokens only)
- Status: beta
- Short name: DetailPanel
- Audience: Developers rendering record details (drawers, side panels, headers).
- Purpose: Key-value detail lists plus an optional live pulse.
- When to use: For read-only record summaries next to the list.
- When not to use: For editable records — use Form instead.
- See also: `Show a sortable, filterable, paginated data table`, `Slide in a drawer panel`
- Examples: Simple, Composed rows
- A11y: Native `dl`/`dt`/`dd` semantics; rows read in order.

```ts
import { DetailPanel, LivePulse, PageHeader } from "@zedtech/zedkit-ui";
<PageHeader title="Server" actions={<LivePulse />} />
<DetailPanel items={[{ label: "Region", value: "eu" }]} />
```

```ts
import { DetailPanelRow } from "@zedtech/zedkit-ui";
<dl>
  <DetailPanelRow label="Region" value="eu" />
</dl>
```

## Build validated forms with labels, errors, and pending state

- Import: `@zedtech/zedkit-ui` — `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`, `useValidatedForm`, `FormSubmit`, `FormSubmitProps`
- Wraps: `react-hook-form`, `@hookform/resolvers`, `zod`
- Status: beta
- Derived from: shadcn/ui (form); kit (useValidatedForm, FormSubmit)
- Short name: Form
- Audience: Developers collecting validated input with accessible errors.
- Purpose: Validated forms (schema, field errors, pending submit) on react-hook-form + zod.
- When to use: For any form needing validation or async submit.
- When not to use: For a single search box — use Input directly instead.
- See also: `Lay out fieldsets, fields, and error lists`, `Collect text input with a label`

```ts
import { Form, FormField, FormSubmit, Input, useValidatedForm } from "@zedtech/zedkit-ui";
const form = useValidatedForm<Values>(schemaFromContracts, { defaultValues });
// <Form {...form}><form onSubmit={form.handleSubmit(save)}>
// <FormField control={form.control} name="name" render={...} />
// <FormMessage /> shows the error; <FormSubmit pendingLabel={t.saving}>
```

## Lay out fieldsets, fields, and error lists

- Import: `@zedtech/zedkit-ui` — `FieldSet`, `FieldLegend`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldContent`, `FieldTitle`
- Wraps: none (presentational over `Label`, `Separator`)
- Status: beta
- Derived from: shadcn/ui (field)
- Short name: FieldSet
- Audience: Developers structuring long or grouped forms.
- Purpose: Fieldsets, field rows, labels, descriptions and error lists.
- When to use: To group related fields with legends and per-field errors.
- When not to use: For validation logic itself — pair with Form instead.
- See also: `Build validated forms with labels, errors, and pending state`
- A11y: `FieldError` uses `role="alert"`; spacing uses `gap-field-*` theme tokens (not raw spacing literals).

```ts
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@zedtech/zedkit-ui";
<FieldSet><FieldGroup><Field>
<FieldLabel>Name</FieldLabel><FieldDescription>Public.</FieldDescription>
<FieldError errors={[{ message: "Too short." }]} />
```

## Group content in a card section

- Import: `@zedtech/zedkit-ui` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Wraps: none (presentational, theme tokens only)
- Status: beta
- Derived from: shadcn/ui (card)
- Short name: Card
- Audience: Developers grouping related content in bordered sections.
- Purpose: Cards with header/title/description/content/footer slots.
- When to use: For self-contained blocks (panels, summaries, previews).
- When not to use: For page-level layout — use AppShell and Stack instead.
- A11y: Slots are plain containers — put headings and labels inside. Spacing comes from `--spacing-card-*` theme tokens; `CardSkeleton` mirrors the same tokens so async content lands without shifting.
- See also: `Stack content and group titled sections`

```ts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zedtech/zedkit-ui";
<Card><CardHeader><CardTitle>Server</CardTitle>
<CardDescription>Connection details.</CardDescription></CardHeader>
<CardContent>Body.</CardContent></Card>
```

## Stack content and group titled sections

- Import: `@zedtech/zedkit-ui` — `Stack`, `stackVariants`, `StackProps`, `Section`, `SectionProps`
- Wraps: none (flex/gap utilities over `Heading`, `Text`)
- Status: alpha
- Short name: Stack
- Audience: Developers laying out kit pages without raw divs.
- Purpose: Gap-based vertical/horizontal stacks plus titled sections.
- When to use: For all kit-page layout instead of hand-written flex.
- When not to use: For complex grids — use CSS grid directly instead.
- See also: `Render headings and body text without raw tags`, `Group content in a card section`

```ts
import { Section, Stack } from "@zedtech/zedkit-ui";
<Section title="Team" description="Who can access.">
<Stack direction="horizontal" gap={2}>...</Stack>
```

## Render headings and body text without raw tags

- Import: `@zedtech/zedkit-ui` — `Heading`, `HeadingProps`, `headingVariants`, `Text`, `TextProps`, `textVariants`
- Wraps: `class-variance-authority` (styles follow the documented shadcn typography recipes; no registry item exists)
- Status: beta
- Short name: Typography
- Audience: Developers writing kit pages with consistent type.
- Purpose: Heading levels and Text variants with theme-aware styles.
- When to use: For every heading and paragraph in kit UI.
- When not to use: For raw HTML emails or markdown — style those separately.
- See also: `Stack content and group titled sections`
- Examples: Simple, Heading styles on a link (asChild)
- A11y: Keep one `h1` per page; `asChild` merges styles onto the child — keep the outline meaningful.

```ts
import { Heading, Text } from "@zedtech/zedkit-ui";
<Heading level={1}>Page title</Heading>
<Heading level={2} as="div">Styled as h2, neutral tag</Heading>
<Text>Body copy.</Text>
<Text variant="muted">Secondary copy.</Text>
```

```ts
import { Heading } from "@zedtech/zedkit-ui";
<Heading level={2} asChild>
  <a href="#section">Section title as a link</a>
</Heading>
```

## Call out a notice or an error state

- Import: `@zedtech/zedkit-ui` — `Alert`, `AlertTitle`, `AlertDescription`, `alertVariants`, `AlertProps`
- Wraps: `class-variance-authority`
- Status: beta
- Derived from: shadcn/ui (alert)
- Short name: Alert
- Audience: Developers surfacing notices, warnings and errors inline.
- Purpose: Notice/error callouts with title and description.
- When to use: For states tied to page content (load errors, warnings).
- When not to use: For transient confirmations — use Toaster instead.
- See also: `Show toast notifications`
- Examples: Simple, As a section (asChild)
- A11y: Root carries `role="alert"` (announced assertively). Use `asChild` to render another element; keep one title plus one description.

```ts
import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";
<Alert><AlertTitle>Heads up</AlertTitle>
<AlertDescription>Something worth knowing.</AlertDescription></Alert>
<Alert variant="destructive"><AlertTitle>Failed</AlertTitle>
<AlertDescription>Something went wrong.</AlertDescription></Alert>
```

```ts
import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";
<Alert asChild>
  <section aria-label="Maintenance notice">
    <AlertTitle>Scheduled maintenance</AlertTitle>
    <AlertDescription>Sunday 02:00–03:00 UTC.</AlertDescription>
  </section>
</Alert>
```

## Switch the visual identity with one attribute

- Import: `@zedtech/zedkit-ui` — `IdentityScript`, `IdentityScriptProps`, `IdentitySwitcher`, `IdentitySwitcherProps`, `IdentityPicker`, `IdentityPickerProps`, `IdentityOption`, `identities`, `DEFAULT_IDENTITY`, `IDENTITY_STORAGE_KEY`, `IDENTITY_CHANGE_EVENT`, `legacyIdentityIds`, `IdentityCycle`, `IdentityCycleProps`, `IdentityScope`, `IdentityScopeProps`, `Reveal`, `RevealProps`, `Stagger`, `StaggerProps`
- Wraps: none (CSS variables in `styles.css`, `identities.css`, `motion.css`)
- Status: alpha
- Short name: Identities
- Audience: Teams that want to change the whole look of an app, or offer a choice, without touching components.
- Purpose: `data-identity` on the root swaps radius, borders, shadows, fonts, palette and motion tokens, combined with light and dark; a labelled switcher persists the choice and a head script applies it before first paint.
- When to use: To rebrand or offer several looks from one set of components.
- When not to use: For a single fixed brand — edit the base tokens in `styles.css` instead.
- See also: `Theme an admin app (dark/light included)`
- A11y: native labelled `select`; entrance animations are disabled under `prefers-reduced-motion`.

```ts
import { IdentityScript, IdentitySwitcher, Reveal } from "@zedtech/zedkit-ui";
// <head><IdentityScript /></head> applies the stored identity before paint
<IdentitySwitcher />
<Reveal>{children}</Reveal>
```

## Show the zedkit logo

- Import: `@zedtech/zedkit-ui` — `Logo`, `LogoProps`
- Wraps: none (inline SVG)
- Status: alpha
- Short name: Logo
- Audience: Teams building a header, a footer or a share image for a zedkit-based site.
- Purpose: The zedkit mark as an inline SVG that paints with `currentColor`, so it follows the text colour in light, dark and every visual identity.
- When to use: Next to the product name in a site header, or anywhere a small brand mark is needed.
- When not to use: For your own brand — ship your own mark instead.
- See also: `Switch the visual identity with one attribute`
- A11y: named image ("zedkit") by default; pass `title=""` to hide it when the name is written next to it.

```ts
import { Logo } from "@zedtech/zedkit-ui";
<Logo className="h-6 text-foreground" title="" />
```

## Pick one option from a dropdown

- Import: `@zedtech/zedkit-ui` — `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- Wraps: `@radix-ui/react-select`
- Status: alpha
- Derived from: shadcn/ui (select)
- Short name: Select
- Audience: Form builders offering 4+ exclusive options in little space.
- Purpose: Accessible dropdown select with trigger, value and items; empty lists render a disabled message item.
- When to use: For long option lists where radio groups would sprawl.
- When not to use: For 2–3 visible options — use radio inputs or OptionCards instead.
- See also: `Toggle a checkbox or a switch`, `Guide a multi-step flow with selectable option cards`

```ts
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zedtech/zedkit-ui";
const items = regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>);
<Select onValueChange={setRegion}>
<SelectTrigger><SelectValue placeholder="Pick a region" /></SelectTrigger>
<SelectContent>{items.length === 0 ? <SelectItem value="none" disabled>No regions available</SelectItem> : items}</SelectContent>
```

## Collect multi-line text input

- Import: `@zedtech/zedkit-ui` — `Textarea`
- Wraps: none (styled native `textarea`)
- Status: alpha
- Derived from: shadcn/ui (textarea)
- Short name: Textarea
- Audience: Form builders collecting paragraphs (bios, notes, messages).
- Purpose: Labelled multi-line textarea with consistent styling.
- When to use: For free text longer than one line.
- When not to use: For single-line values — use Input instead.
- See also: `Collect text input with a label`
- A11y: `min-h-textarea-min-height` from theme tokens; `focus-ring-control` on keyboard focus.

```ts
import { Label, Textarea } from "@zedtech/zedkit-ui";
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" placeholder="A few words." />
```

## Toggle a checkbox or a switch

- Import: `@zedtech/zedkit-ui` — `Checkbox`, `Switch`
- Wraps: `@radix-ui/react-checkbox`, `@radix-ui/react-switch`
- Status: alpha
- Derived from: shadcn/ui (checkbox, switch)
- Short name: Checkbox
- Audience: Form builders collecting booleans and on/off settings.
- Purpose: Accessible checkbox and switch toggles.
- When to use: Checkbox for agreements and multi-picks, switch for instant on/off settings.
- When not to use: For exclusive choices — use Select or radio inputs instead.
- See also: `Pick one option from a dropdown`

```ts
import { Checkbox, Label, Switch } from "@zedtech/zedkit-ui";
<Checkbox id="terms" />
<Label htmlFor="terms">Accept the terms</Label>
<Switch id="notify" aria-label="Notify me" />
```

## Switch between tabbed panels

- Import: `@zedtech/zedkit-ui` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Wraps: `@radix-ui/react-tabs`
- Status: alpha
- Derived from: shadcn/ui (tabs)
- Short name: Tabs
- Audience: Developers grouping related panels under one heading.
- Purpose: Accessible tabs (list, triggers, content panels).
- When to use: For sibling views that share context (settings groups, code variants).
- When not to use: For sequential steps — use WizardSteps instead.
- See also: `Guide a multi-step flow with selectable option cards`

```ts
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
<Tabs defaultValue="one"><TabsList>
<TabsTrigger value="one">First</TabsTrigger>
</TabsList><TabsContent value="one">First panel.</TabsContent></Tabs>
```
