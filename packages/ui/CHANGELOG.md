# @zedtech/zedkit-ui

## 0.1.1

### Patch Changes

- 889d207: Re-release with build output: 0.1.0 shipped without dist/ (the release job published before building) and is unusable; use 0.1.1.

## 0.1.0

### Minor Changes

- b664c35: Add the Alert family (Alert + Title/Description, default/destructive, shadcn source).
- bc6de49: Add AppShell (sidebar + topbar + main slots) and PageHeader (title + description + actions).
- f914184: Add the Card family (Card + Header/Title/Description/Content/Footer, shadcn source).
- 7d25f0e: Add DataTable filter input and pagination footer (TanStack global filter + pagination features).
- 617b596: Add DataTable (sortable TanStack Table wrapper with empty/loading/error states) and Table primitives.
- 9f6b122: Add DetailPanel (key-value rows) and LivePulse (live indicator), plus success/warning theme tokens.
- 18b1712: Add the Form brick: shadcn form (RHF wiring) + field primitives, useValidatedForm (zod schema from shared contracts), FormSubmit with pending state.
- e0d6de6: Initial release: admin UI kit scaffold — design tokens + dark/light theme CSS, cn() util, shadcn/ui-based toolchain (Radix, Tailwind v4, CVA, lucide, sonner, TanStack Table).
- 2db26ac: Add the layout helper family: Stack (direction + gap) + Section (titled content block).
- 0f7b3a0: Overlays slice: Dialog set, ConfirmDialog, themed Toaster, shown-once SecretField with copy.
- cec8f13: Primitives slice: Button, Badge, Input, Label, Separator, Skeleton (shadcn/ui-based).
- 878fec6: Add the Select family (Radix select primitives, shadcn source).
- 1c7256f: Add the Tabs family (Radix tabs primitives, shadcn source).
- 709b69f: Add the Textarea family (styled native textarea, shadcn source).
- 4b5209f: Add the Checkbox/Switch family (Radix primitives, shadcn sources).
- 5d8581d: Add the Typography family: Heading (levels 1-4, tag override) + Text (body/muted), following the documented shadcn typography recipes.
- fa382f5: Add WizardSteps (step indicator) and OptionCards (multi-select checkbox cards).

### Patch Changes

- cb519d1: Accessibility: SecretField accepts aria-label for its input; DataTable loading state uses aria-busy plus a labeled table instead of labeled skeleton divs.
- 0529e23: Consistent Tailwind class order; dialog overlay uses the new overlay theme token (same rendering).
- 16b564d: DataTable footer never shows page 0 (empty tables read Page 1 of 1).
- 781348a: Add "use client" to client-only modules so React Server Component adopters (Next.js) build: without it the server graph resolves client-only stubs (react-hook-form react-server) and fails.
