# @zedtech/zedkit-ui

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-ui.svg)](https://www.npmjs.com/package/@zedtech/zedkit-ui)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

The UI half of zedkit, a UI/AI kit (the AI half is
[`@zedtech/zedkit-ai`](../ai/README.md): one prompt sets up your coding agents).
Ship a calm React UI fast: dark/light design tokens plus accessible
React building blocks (data tables, forms, dialogs, toasts),
shadcn/ui-based (MIT, see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)). Neutral and calm by
default.

**Install** with `pnpm add @zedtech/zedkit-ui`, or **copy** individual bricks with
`npx shadcn@latest init -y --base radix --preset nova` then
`npx shadcn@latest add https://zedkit.app/r/<brick>.json` where the registry lists
them. Composed bricks need the namespace once:

```sh
npx shadcn@latest registry add @zedkit=https://zedkit.app/r/{name}.json
```

See [zedkit and shadcn/ui](https://zedkit.app/docs/zedkit-and-shadcn).

## Install

```sh
pnpm add @zedtech/zedkit-ui
```

Needs: React 19 + Tailwind v4 in the consumer (peer dependencies),
`.dark` class strategy for dark mode (`next-themes` recommended).

### Agent: one paste

Docs walkthrough: [zedkit.app/docs/getting-started](https://zedkit.app/docs/getting-started). Agent steps (raw markdown): [zedkit.app/ui/setup.md](https://zedkit.app/ui/setup.md).

Paste this single message in a new chat at the repo root:

```text
Set up zedkit UI on this repo following https://zedkit.app/ui/setup.md
```

## Usage

Adopt in 3 lines:

```css
/* Tailwind v4. Path is relative to this CSS file. */
@import "@zedtech/zedkit-ui/styles.css";
/* app/globals.css or src/index.css */
@source "../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
@source not "../node_modules/@zedtech/zedkit-ui/src/**/*.test.*";
/* src/app/globals.css */
@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
@source not "../../node_modules/@zedtech/zedkit-ui/src/**/*.test.*";
```

```tsx
import { Button } from "@zedtech/zedkit-ui"; // see CATALOG.md for every component
```

Container-aware sizing: mark a layout slot with `Container`'s `query`
prop (or the `zk-query` class on any grid cell/slot) and adaptive
components size to their allocated space, not the viewport. `Card`
takes `size="sm" | "lg"`; each variant's padding, internal gap,
radius and title/body type step up in wide slots (30rem), compose
with identity density, and fall back to the base recipe with no
marked ancestor. Controls keep explicit sizes and target floors.

## Theme scopes

`ThemeScope` is transparent: it adds no background or surface of its own.
Surfaces stay explicit (`Card`, `GlassSurface`, dialog/drawer panels). The
scope only names the identity and pins the mode for its subtree:

- A nested scope without `identity` keeps the nearer identity; a `mode`
  pinned without `identity` still carries that identity on its own node.
- Dropdown panels portal into the scope itself; dialog/drawer portals mount
  on `document.body` with a look-mirroring twin, so no consumer stacking
  context traps them under the site header.

## Migration

Ref as a prop, and kit messages: before/after, search patterns, and a
per-app checklist live in
[docs/migrations/ui-ref-and-messages.md](../../docs/migrations/ui-ref-and-messages.md).

## When to use

Reach for this package when you build an admin console or dashboard on
React + Tailwind v4 and want tokens, theme, and states
(empty/loading/error) handled once. For non-UI helpers see the other
kit packages.

## Guides

- [Upgrade: ref as a prop, and kit messages](../../docs/migrations/ui-ref-and-messages.md)
- [Route modals](../../docs/route-modals.md): pointer to the catalog recipe
  (drawer vs dialog vs page, `RouteModal`, `closeRoute`).

## Contents

- `styles.css`: tokens + dark/light theme preset.
- `cn()`: classnames merge.
- Primitives: `Button`, `Badge`, `Input`, `Label`, `Separator`,
  `Skeleton` (see CATALOG.md for usage).
- Overlays: `Dialog` set, `ConfirmDialog`, `Popover`, `Tooltip`,
  `DropdownMenu`, `Toaster`, `SecretField`.
- Dates: `Calendar`, `DatePicker`, `DateRangePicker`.
- Searchable lists: `Combobox`, `MultiSelect` (downshift + popover).
- Data: `DataTable` (sort, filter, pagination, empty/loading/
  error states) + `Table` primitives.
- Layout: `AppShell` (sidebar + topbar + main slots), `PageHeader`,
  `Stack`, `Section`, `SectionScroll`, `Container` (named widths + full-bleed bands),
  `SidebarNavItem` / `SidebarNavGroup` (sidebar run-list rows),
  `AgentConsole` (live agent run: sidebar, decision, transcript).
- Motion: `Animate`, `AnimateObserver`, `observeAnimate` (`data-animate`
  appear / scroll / press / longpress / hover / focus), `WordRoll`, `MotionScript`,
  `useMotionPreference`. Parallax layers live on `@zedtech/zedkit-ui/motion`
  (`ParallaxSection`, `ParallaxLayer`; CSS scroll-driven, 0 JS). Original
  work by the same author.
- Stored choice and identity repair: `createStoredChoice`, `repairContrast`.
  Original work by the same author.
- Wizard: `WizardSteps` (step indicator), `OptionCards` (multi-select cards, or pick-one with `multiple={false}`).
- Detail: `DetailPanel` (key-value rows, or `variant="grid"` stats), `LivePulse` (live indicator).
- Transcript: `ToolCallRow`, `ThinkingRow`, `AssistantMessage`, `TranscriptBurst`, `groupToolCallBursts`.
- Marketing (`@zedtech/zedkit-ui/marketing`, separate entry): `GlassSurface`.

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
smoke` runs the Playwright smoke over both themes: every gallery section is
visible, overlay triggers render, console errors in the light theme and
uncaught page errors in all themes, and layouts do not overflow the viewport
(no pixel baselines).
