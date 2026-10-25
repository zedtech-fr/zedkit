# Catalog — @zedkit/ui

## Theme an admin app (dark/light included)

- Import: `@zedkit/ui/styles.css` (+ one `@source` line, see README)
- Wraps: `tailwindcss` (v4 CSS-first)
- Status: beta

```ts
import "@zedkit/ui/styles.css"; // tokens + theme, once per app
// globals.css also needs this line so Tailwind scans components:
// @source "../node_modules/@zedkit/ui/src/**/*.{ts,tsx}";
// .dark on <html> (next-themes recommended) flips the theme.
```

## Merge class names without conflicts

- Import: `@zedkit/ui` — `cn`
- Wraps: `clsx`, `tailwind-merge`
- Status: beta

```ts
import { cn } from "@zedkit/ui";
cn("px-4", isActive && "bg-accent"); // "px-4 bg-accent"
cn("px-4", "px-2"); // "px-2" — last conflicting utility wins
```

## Trigger actions with buttons

- Import: `@zedkit/ui` — `Button`, `buttonVariants`, `ButtonProps`
- Wraps: `@radix-ui/react-slot`, `class-variance-authority`
- Status: beta

```ts
import { Button } from "@zedkit/ui";
<Button>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon" aria-label="Close">×</Button>
```

## Show a status or count badge

- Import: `@zedkit/ui` — `Badge`, `badgeVariants`, `BadgeProps`
- Wraps: `class-variance-authority`
- Status: beta

```ts
import { Badge } from "@zedkit/ui";
<Badge>live</Badge>
<Badge variant="outline">3 retries</Badge>
```

## Collect text input with a label

- Import: `@zedkit/ui` — `Input`, `Label`
- Wraps: `@radix-ui/react-label`
- Status: beta

```ts
import { Input, Label } from "@zedkit/ui";
<Label htmlFor="name">Name</Label>
<Input id="name" placeholder="Ada" />
```

## Separate content horizontally or vertically

- Import: `@zedkit/ui` — `Separator`
- Wraps: `@radix-ui/react-separator`
- Status: beta

```ts
import { Separator } from "@zedkit/ui";
<Separator />
<Separator orientation="vertical" className="h-6" />
```

## Show loading placeholder blocks

- Import: `@zedkit/ui` — `Skeleton`
- Wraps: `(none)`
- Status: beta

```ts
import { Skeleton } from "@zedkit/ui";
<Skeleton className="h-4 w-24" />
```

## Open modal dialogs

- Import: `@zedkit/ui` — `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogOverlay`, `DialogPortal`
- Wraps: `@radix-ui/react-dialog`
- Status: beta

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
- Status: beta

```ts
import { Button, ConfirmDialog } from "@zedkit/ui";
<ConfirmDialog trigger={<Button>Delete</Button>} title="Delete item?"
  description="This cannot be undone." onConfirm={remove} />
```

## Show toast notifications

- Import: `@zedkit/ui` — `Toaster`
- Wraps: `sonner`
- Status: beta

```ts
import { Toaster } from "@zedkit/ui";
import { toast } from "sonner";
<Toaster /> // once near the root, then toast("Saved") anywhere
```

## Display a shown-once secret with copy

- Import: `@zedkit/ui` — `SecretField`, `SecretFieldProps`
- Wraps: `lucide-react`
- Status: beta

```ts
import { Label, SecretField } from "@zedkit/ui";
<Label htmlFor="key">API key (shown once)</Label>
<SecretField id="key" value={key} />
```

## Show a sortable, filterable, paginated data table

- Import: `@zedkit/ui` — `DataTable`, `DataTableProps`, `DataTableColumn`, `createDataTableColumns`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- Wraps: `@tanstack/react-table`
- Status: beta

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
- Status: beta

```ts
import { AppShell, PageHeader } from "@zedkit/ui";
<AppShell sidebar={<OrgNav />} topbar={<UserMenu />}>
  <PageHeader title="Items" description="All items." />
</AppShell>
```

## Guide a multi-step flow with selectable option cards

- Import: `@zedkit/ui` — `WizardSteps`, `WizardStepsProps`, `OptionCards`, `OptionCardsProps`, `OptionCard`
- Wraps: none (native inputs + theme tokens)
- Status: beta

```ts
import { OptionCards, WizardSteps } from "@zedkit/ui";
const [picked, setPicked] = useState(["a", "b"]);
<WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
<OptionCards options={options} selected={picked} onChange={setPicked} />
```

## Show key-value details and a live indicator

- Import: `@zedkit/ui` — `DetailPanel`, `DetailPanelProps`, `DetailItem`, `LivePulse`, `LivePulseProps`
- Wraps: none (theme tokens only)
- Status: beta

```ts
import { DetailPanel, LivePulse, PageHeader } from "@zedkit/ui";
<PageHeader title="Server" actions={<LivePulse />} />
<DetailPanel items={[{ label: "Region", value: "eu" }]} />
```

## Build validated forms with labels, errors, and pending state

- Import: `@zedkit/ui` — `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`, `useValidatedForm`, `FormSubmit`, `FormSubmitProps`
- Wraps: `react-hook-form`, `@hookform/resolvers`, `zod`
- Status: beta

```ts
import { Form, FormField, FormSubmit, Input, useValidatedForm } from "@zedkit/ui";
const form = useValidatedForm<Values>(schemaFromContracts, { defaultValues });
// <Form {...form}><form onSubmit={form.handleSubmit(save)}>
// <FormField control={form.control} name="name" render={...} />
// <FormMessage /> shows the error; <FormSubmit pendingLabel={t.saving}>
```

## Lay out fieldsets, fields, and error lists

- Import: `@zedkit/ui` — `FieldSet`, `FieldLegend`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldContent`, `FieldTitle`
- Wraps: none (presentational over `Label`, `Separator`)
- Status: beta

```ts
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@zedkit/ui";
<FieldSet><FieldGroup><Field>
<FieldLabel>Name</FieldLabel><FieldDescription>Public.</FieldDescription>
<FieldError errors={[{ message: "Too short." }]} />
```

## Group content in a card section

- Import: `@zedkit/ui` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Wraps: none (presentational, theme tokens only)
- Status: beta

```ts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zedkit/ui";
<Card><CardHeader><CardTitle>Server</CardTitle>
<CardDescription>Connection details.</CardDescription></CardHeader>
<CardContent>Body.</CardContent></Card>
```

## Render headings and body text without raw tags

- Import: `@zedkit/ui` — `Heading`, `HeadingProps`, `headingVariants`, `Text`, `TextProps`, `textVariants`
- Wraps: `class-variance-authority` (styles follow the documented shadcn typography recipes; no registry item exists)
- Status: beta

```ts
import { Heading, Text } from "@zedkit/ui";
<Heading level={1}>Page title</Heading>
<Heading level={2} as="div">Styled as h2, neutral tag</Heading>
<Text>Body copy.</Text>
<Text variant="muted">Secondary copy.</Text>
```

## Call out a notice or an error state

- Import: `@zedkit/ui` — `Alert`, `AlertTitle`, `AlertDescription`
- Wraps: `class-variance-authority`
- Status: beta

```ts
import { Alert, AlertDescription, AlertTitle } from "@zedkit/ui";
<Alert><AlertTitle>Heads up</AlertTitle>
<AlertDescription>Something worth knowing.</AlertDescription></Alert>
<Alert variant="destructive"><AlertTitle>Failed</AlertTitle>
<AlertDescription>Something went wrong.</AlertDescription></Alert>
```

## Pick one option from a dropdown

- Import: `@zedkit/ui` — `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- Wraps: `@radix-ui/react-select`
- Status: alpha

```ts
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zedkit/ui";
<Select onValueChange={setRegion}>
<SelectTrigger><SelectValue placeholder="Pick a region" /></SelectTrigger>
<SelectContent><SelectItem value="eu">Europe</SelectItem></SelectContent>
```
