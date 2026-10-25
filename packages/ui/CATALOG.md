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

## Open modal dialogs

- Import: `@zedkit/ui` — `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogOverlay`, `DialogPortal`
- Wraps: `@radix-ui/react-dialog`
- Status: stable

```ts
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@zedkit/ui";
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent><DialogTitle>Details</DialogTitle></DialogContent>
</Dialog>
```

## Confirm destructive actions

- Import: `@zedkit/ui` — `ConfirmDialog`, `ConfirmDialogProps`
- Wraps: `@radix-ui/react-dialog` (via Dialog)
- Status: stable

```ts
import { Button, ConfirmDialog } from "@zedkit/ui";
<ConfirmDialog trigger={<Button>Delete</Button>} title="Delete item?"
  description="This cannot be undone." onConfirm={remove} />
```

## Show toast notifications

- Import: `@zedkit/ui` — `Toaster`
- Wraps: `sonner`
- Status: stable

```ts
import { Toaster } from "@zedkit/ui";
import { toast } from "sonner";
<Toaster /> // once near the root, then toast("Saved") anywhere
```

## Display a shown-once secret with copy

- Import: `@zedkit/ui` — `SecretField`, `SecretFieldProps`
- Wraps: `lucide-react`
- Status: stable

```ts
import { Label, SecretField } from "@zedkit/ui";
<Label htmlFor="key">API key (shown once)</Label>
<SecretField id="key" value={key} />
```

## Show a sortable, filterable, paginated data table

- Import: `@zedkit/ui` — `DataTable`, `DataTableProps`, `DataTableColumn`, `createDataTableColumns`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- Wraps: `@tanstack/react-table`
- Status: stable

```ts
import { DataTable, createDataTableColumns } from "@zedkit/ui";
const helper = createDataTableColumns<Item>();
const columns = [helper.accessor("name", { header: "Name" })];
<DataTable columns={columns} data={items} loading={isLoading}
  error={error} pageSize={20} />
```

## Lay out an admin page (sidebar + topbar + header)

- Import: `@zedkit/ui` — `AppShell`, `AppShellProps`, `PageHeader`, `PageHeaderProps`
- Wraps: none (theme tokens only)
- Status: stable

```ts
import { AppShell, PageHeader } from "@zedkit/ui";
<AppShell sidebar={<OrgNav />} topbar={<UserMenu />}>
  <PageHeader title="Items" description="All items." />
</AppShell>
```

## Guide a multi-step flow with selectable option cards

- Import: `@zedkit/ui` — `WizardSteps`, `WizardStepsProps`, `OptionCards`, `OptionCardsProps`, `OptionCard`
- Wraps: none (native inputs + theme tokens)
- Status: stable

```ts
import { OptionCards, WizardSteps } from "@zedkit/ui";
const [picked, setPicked] = useState(["a", "b"]);
<WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
<OptionCards options={options} selected={picked} onChange={setPicked} />
```
