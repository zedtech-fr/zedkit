# @zedtech/zedkit-ui

## 0.5.0

### Minor Changes

- 5398c86: Drawer: mobile bottom sheet (`mobile` prop), sheet height and safe-area tokens, `DrawerBody`, `DrawerCloseButton`, sticky chrome, and overlay motion tuned for phones. Left, right and top drawers now fit phones too: side panels are full height up to 90% of the width, the handle hides on sides and sits at the bottom of a top drawer, and safe-area insets are respected on every edge.
- 1ea4b9c: Add `IconLabel`: quiet inline icon + label with theme size, gap, and muted color tokens.
- c25c03e: OptionCards: card geometry uses theme tokens; adds composable `OptionCard` (data API unchanged). Migration: the `OptionCard` data interface is renamed to `OptionCardData` (name taken by the component) — replace the type name, no runtime change.
- d23d33f: List the six identities (`mist`, `press`, `tide`, `volt`, `maison`, `glass`) in the built-in `identities`: `IdentityScript`, `IdentitySwitcher` and `IdentityPicker` now offer them by default, and a stored built-in id is applied before first paint. No identity is applied until someone chooses one. Pass `identities={[]}` (or your own list) to keep the previous behaviour.
- 035ff81: Add the identity token foundation: `identities.css` (stock `--zk-*` tokens and the bridge that lets an identity restyle Tailwind utilities) and `motion.css` (reveal, stagger, hover lift and press utilities), both imported by `styles.css`. Body copy uses `leading-body` (1.6), hover styles only apply on devices that hover, and the focus ring is darker and 2px on controls.
- e5a617d: Add the `glass` identity: frosted translucent cards, popovers and code blocks over soft colour halos, hairline edges, generous radii. Surfaces turn near-solid without backdrop-filter support or when less transparency is requested. Inert until `data-identity="glass"` is set.
- c077015: Add the `maison` identity: airy ivory, Cormorant display over a Jost body, very fine borders, small radii, generous spacing, with metric-aligned fallback faces. Interactions stay within the motion caps; the slow feel is reserved for reveals. Inert until `data-identity="maison"` is set.
- 8d4b140: Add the `mist` identity: the stock look set in Inter (with a metric-aligned fallback face so the font swap does not shift the layout) and a visible text selection. Set `data-identity="mist"` on `<html>` to use it.
- 1802d22: Add the `press` identity: editorial paper and ink, square corners, 1px rules, no soft shadows, Newsreader display over a Space Grotesk body, with metric-aligned fallback faces. Inert until `data-identity="press"` is set.
- 68eb7fe: Add the identity provider and selectors: `IdentityScript` applies a stored `data-identity` before first paint, `IdentitySwitcher` (labelled select) and `IdentityPicker` (touch sheet) let people choose and persist the choice, and `applyIdentity` / `useIdentity` drive it from your own UI. The kit ships no identity yet: pass your own list, matching your `[data-identity]` CSS. Nothing changes until an identity is set.
- a600adf: Add the `tide` identity: navy and coral, Inter at heavy weights, large radii, soft glows, long eased reveals within the motion caps. Inert until `data-identity="tide"` is set.
- 974b112: Add the `volt` identity: dense near-black, Geist with a 12px xs body, hairline borders, layered depth, one acid accent, with a metric-aligned fallback face. Inert until `data-identity="volt"` is set.
- a2c8e06: Add `Logo`: the zedkit mark as an inline SVG that paints with `currentColor`, so it follows light, dark and every identity. Named image by default; pass `title=""` when the name is written next to it.
- a1c163f: Adds `useOnlineStatus` + `OfflineNote` (offline presence, part of #169).
- 32148d1: Touch-friendly controls: on touch or narrow screens, inputs, selects, textareas, buttons and tab lists reach a 44px tap height, and checkbox and switch carry an invisible 44px hit area while keeping their visible size. Mouse users keep compact heights. Dialogs keep a side gutter on phones and their close button is a full tap target, buttons get a subtle press feedback (skipped with reduced motion), invalid fields show a destructive border, wide tables fade the cut-off edge, and the data table resets to the first page when filtering and hides pagination when empty.

### Patch Changes

- f781d8a: Checkbox: token-driven size and focus ring, hidden check icon (no visual or API change).
- c6bc90e: Checkmark: size from canonical scale (`size-4`, value-identical 1rem, part of #367).
- 8aab3c2: Checkmark: size and draw animation use theme tokens; dash setup is path geometry (no visual or API change).
- bc62768: Docs: catalog fields for ConfirmDialog registry component pages (no API change).
- 77e8d1e: ConfirmDialog: keeps the props-bag API over Dialog (no styles of its own); trigger slot pinned by test.
- 293df49: DataTable: chrome geometry (stack, filter, sort, loading, pagination) uses theme tokens (no visual or API change).
- b1d317b: DataTable: adds composable `DataTableEmpty` (table output unchanged).
- 475ed85: Hide `DataTable` pagination when all rows fit on a single page.
- cb72a3c: DataTable: adds composable `DataTablePagination` (table output unchanged).
- 1664292: DataTable: adds composable `DataTableToolbar` (table output unchanged).
- ef23c2a: DetailPanel: row geometry uses theme tokens; adds composable `DetailPanelRow` (data API unchanged).
- 863f78c: Add `IconButton`, maturity-oriented `Badge` variants (`success`, `warning`), and darker `muted-foreground` in light mode for WCAG AA contrast.
- f890516: Export `BadgeProps` from the UI barrel so docs can reference the props type on registry component pages.
- 4a1b579: docs: accurate npm descriptions — UI kit is not admin-only; core is not backend-only.
- 7213de5: Export DrawerProps and catalog fields for the drawer registry doc page (part of #187).
- 5398c86: Drawer: content composed without `DrawerHeader`, `DrawerBody`, or `DrawerFooter` (a bare form, text, a list) now keeps the shared side gutters and clears the bottom safe area instead of touching the sheet edges. The slots carry `data-slot` markers. The admin dashboard demo and guide snippet compose the sheet with a handle, header, body, and footer.
- b7590da: Tokens: consolidate the three 0.875rem icon aliases into shared `--spacing-icon-sm` (no visual change).
- 7314c22: LivePulse: gap from canonical scale (`gap-1.5`, value-identical 0.375rem, part of #367).
- 9a0a2ec: Tokens: consolidate dialog/route-modal close offsets into shared `--spacing-overlay-close-offset` (no visual change).
- f9ba522: ProgressBar: segment gap and height use theme tokens (no visual or API change).
- 6ddbc95: `registry:check` now fails when `registry.json` theme `cssVars` / `css` drift from `packages/ui/src/styles.css`.
- 5f0e85d: RouteModal drawer variant: move focus inside on open so the focus trap engages (previously focus stayed on the trigger and Tab walked the background page). Matches the dialog variant; no API change.
- 3c11e6d: Consolidate the select item indicator box onto the shared `icon-sm` size token (same 0.875rem value, zero visual change, refs #367).
- ee95f6b: Switch: token-driven size, thumb travel, and focus ring (no visual or API change).
- ed3cd93: TabsList: scroll horizontally (`max-w-full overflow-x-auto`) instead of clipping on narrow widths.
- d501234: Tabs: list, trigger, and content geometry use theme tokens; focus ring uses the shared `focus-ring` utility (no visual or API change).
- e0e0625: Typography: add `asChild` composition to `Heading` and `Text`; heading anchor offset uses a theme token (`scroll-m-heading-scroll`).
- 88edb30: Alert: add `asChild` composition; padding and icon geometry use shared theme tokens (`px-alert-inline`, `top-alert-icon-offset`, `pl-alert-content-indent`).
- 747ec24: AppShell: sidebar width and main padding from `--spacing-app-shell-*` theme tokens (same rendered values — no visual change).
- 499d0b3: Badge: add `asChild` composition; padding and focus ring use shared theme tokens (`px-badge-inline`, `focus-ring`).
- ffbb1cf: Button: icon gap and default block padding use theme tokens (`gap-button-gap`, `py-control-block-lg`) instead of raw `gap-2` / `py-2` (same values).
- c1774ca: Button: control-height/button spacing theme tokens; `focus-ring-control` (1px, same keyboard focus as before — not Badge’s 2px `focus-ring`); fix `className` merge with `cn`.
- 0e501e7: Export the `CardProps` type for typed card overrides and generated docs.
- 5805d75: Card: header/content/footer/skeleton spacing from `--spacing-card-*` theme tokens (same rendered values — no visual change).
- da75051: Darken the light-theme `destructive` token so white text meets 4.5:1 contrast (was 3.6:1, failing axe color-contrast on destructive buttons and badges).
- 8c84a8d: Dialog: content centering from the `dialog-center` utility (`--spacing-dialog-center`) and elevation from `--shadow-overlay` (same rendered values — no visual change; replaces the `top-[50%]`/`translate-[-50%]`/`shadow-lg` literals).
- 525a365: Dialog: slot spacing, close offset, and overlay stacking from `--spacing-dialog-*` / `--z-index-overlay` tokens; close button uses the shared `focus-ring` and the kit `opacity-50` resting dim (was `opacity-70`). Same layout otherwise.
- dd17a5b: Drawer: stacking and content sizing use shared theme tokens (`z-overlay`, `max-h-drawer-max-height`, `sm:max-w-drawer-side`) instead of raw `z-50` / `max-h-[96dvh]` / `sm:max-w-md`.
- 863cd9e: Drawer: handle, header, and footer spacing use shared theme tokens instead of raw `mt-4` / `h-1.5 w-12` / `gap-*` / `p-4`.
- 4c3eece: Field compound layout: spacing via `gap-field-*` / `p-field-*` theme tokens (replaces raw `gap-6`, `gap-7`, `p-4`, etc.).
- 9ccec27: Form: item gap and description/message text size use shared theme tokens instead of raw `space-y-2` / `text-[0.8rem]`.
- 81cd2f2: Keep text fields at 16px or larger on touch and phone-width screens so iOS Safari no longer zooms the page when an `Input`, `Textarea`, `Select` trigger, `SecretField` or `DataTable` filter gets focus. Fields now read the new `--zk-input-font-size` token through the `text-control` utility; desktop keeps 14px.
- 0734dda: Input and Textarea: theme tokens for height, padding, and min-height; `focus-ring-control` (1px, unchanged from prior `ring-1`).
- e01face: Label: disabled peer dims to `opacity-50`, matching the kit-wide disabled convention (was `opacity-70`).
- 546c7b8: Export the `LabelProps` type for typed label overrides and generated docs.
- a9b8098: LivePulse: dot/label gap uses the shared theme token (`gap-live-pulse-gap`) instead of raw `gap-1.5`.
- 5f2215f: PageHeader and PageHeaderSkeleton: chrome spacing uses page-header tokens instead of raw `mb-6` / `gap-4` / `gap-2` (same values).
- db0a023: PageHeader: title/description stack uses the shared theme token (`space-y-page-header-title-gap`) instead of raw `space-y-1`.
- 7d9b0cf: RouteModal: drawer/dialog size props and close-button geometry use shared theme tokens instead of raw `max-w-*` / `top-4` / `h-4 w-4`.
- fa4d7e9: RouteModal: exit timing reads `--motion-slow`/`--motion-base` live instead of hand-mirrored constants, so themed motion durations stay in sync with the exit animation (same defaults otherwise).
- 09c501b: A scoped mist subtree (`data-identity-scope` with `data-identity="mist"`) now renders with the stock tokens under any page identity: colours (light and dark), radii, spacing, type scale, depth and motion no longer leak in from the page identity.
- 6cf491b: SecretField: row gap and copy/check icon size use shared theme tokens (`gap-secret-field-gap`, `size-icon-control`) instead of raw `gap-2` / `h-4 w-4`.
- ab35928: Select: content min-width uses the shared container token instead of arbitrary `min-w-[8rem]`.
- a4031d1: Select: label/item/separator spacing and indicator geometry use shared theme tokens instead of raw `px-2` / `py-1.5` / `pr-8` / `h-3.5 w-3.5` / `mx-1 my-1 h-px`.
- 3d43cc8: Select: content stacks on the shared `--z-index-overlay` token (`z-overlay`) instead of raw `z-50`; Radix runtime-var arbitraries documented as the allowed exception.
- b9aec64: Select: trigger and scroll buttons reuse the existing control tokens (`h-control-height`, `px-control-inline`, `py-control-block-lg`, `py-control-block`, `size-icon-control`, `focus-ring-control`) — no new tokens. Focus ring is now keyboard-only like the input pilot.
- aaeb113: Select: viewport padding and popper offsets reuse the select spacing token instead of raw `p-1` / `translate-*-1`.
- ff93465: Export the `SeparatorProps` type for typed separator overrides and generated docs.
- e60da25: Separator: thickness uses the shared theme token (`h-separator-thickness` / `w-separator-thickness`) instead of arbitrary `h-[1px]` / `w-[1px]`.
- 3c755c1: Export the `SkeletonProps` type for typed skeleton overrides and generated docs.
- afeaa6a: Toaster: re-export `toast` from the kit so docs and consumers need no direct `sonner` import; toast theme stays mapped to theme tokens.
- d8e69b7: StatusDot: dot size from the `--spacing-status-dot` theme token (same rendered value — no visual change). Tones already map to semantic color tokens.
- 05a5aed: StatusLabel: icon/text spacing from `--spacing-status-label-*` theme tokens (same rendered values — no visual change).
- bbaa116: Table: cell padding, head height, checkbox nudge and caption gap use shared theme tokens; structural selectors documented as the allowed arbitraries.
- 277069a: Export the `TabsProps` type for typed tabs overrides and generated docs.
- 160c50c: Export the `ToasterProps` type (re-exported from `sonner`) for typed toaster overrides and generated docs.
- d9ef8ae: Test that destructive and muted text pairs keep WCAG AA contrast (4.5:1) in both themes, so a token tweak cannot silently re-break downstream axe scans.
- 67d1ac8: UpdatedAgo: already token-driven (muted text tokens only); adds a live docs demo.
- d03a639: WizardSteps: geometry uses theme tokens; adds composable `Wizard` + `WizardStep` (data API unchanged).

## 0.4.0

### Minor Changes

- e50d5ef: Add `RouteModal` (route-driven drawer/dialog that plays its exit before navigating back) and `closeRoute` (back-or-fallback close action for parallel/intercepting routes).

## 0.3.0

### Minor Changes

- 1ee655e: Add faithful loading skeletons (`PageHeaderSkeleton`, `CardSkeleton`, `DataTableSkeleton`, `DetailPanelSkeleton`, each a named `role=status` zone) and pulse the base `Skeleton` only when motion is safe.
- a884cb5: Add `StatusLabel` (named inline operation status, `role=status`) and `UpdatedAgo` (stale-while-revalidate age stamp via `Intl.RelativeTimeFormat`).

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.
- b2c3c0f: Animate overlays by default: Dialog fades/scales in and out, Drawer slides on kit motion tokens with a reduced-motion guard. No API change.

## 0.2.0

### Minor Changes

- 5e9305e: Add `Drawer` (slide-in panel, `direction` top/right/bottom/left, side drawers full-width on mobile) wrapping `vaul` with the shadcn/ui drawer shape.
- 48fa6d8: Add state icons: `StatusDot` (motion-safe status dot), `ProgressBar` (determinate, `role=progressbar`), `Checkmark` (draw-once success check, static under reduced motion). `LivePulse` is rebased on `StatusDot` with identical output plus the reduced-motion guard.

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.
- c9c35aa: Mark shadcn-derived files (provenance header comments) and catalog entries (`Derived from:` flag, also in catalog.json); unmarked files are kit-authored.

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
