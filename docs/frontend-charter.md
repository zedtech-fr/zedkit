# Frontend charter

Short concrete rules for every UI built on this kit. Anything marked
**lint** is enforced by the shared ESLint preset
(`@zedtech/zedkit-quality`, install it and pass your Tailwind entry —
no copy); **test** by the
axe suite and the preview smoke run.

## Components

- One component per file, file name = component name in kebab-case
  (`data-table.tsx` exports `DataTable`).
- Props: one exported `XxxProps` interface, optional props last with
  defaults, slots as `ReactNode` (`actions`, `sidebar`, `children`).
- Variants via `class-variance-authority`, merged with `cn()`
  (clsx + tailwind-merge). No variant prop means one sensible default.
- Copy primitives from the official shadcn/ui registry; compose in the
  kit; never fork a Radix behavior by hand.

## Tokens only (lint)

- Only semantic color tokens: `background`, `foreground`, `card`,
  `muted`, `border`, `input`, `ring`, `primary`, `secondary`,
  `accent`, `destructive`, `success`, `warning` (+ `-foreground`
  pairs). No raw palette classes (`bg-red-500`), no hex/rgb literals,
  no arbitrary color values (`bg-[#fff]`).
- No `style` attributes. No raw `px` font sizes; use the type scale
  (`text-xs` … `text-2xl`) and spacing scale (`p-4`, `gap-2`, …).
- New token? Add it to the theme in both light and dark, then use it.
- Focus ring width/offset: `--ring-width`, `--ring-width-control`,
  `--ring-offset-width` in `styles.css`; use `focus-ring` (2px, Badge)
  or `focus-ring-control` (1px, Button/inputs) instead of raw `ring-*`
  widths during the component refactor.

## Dark / light

- Theme via next-themes (`attribute="class"`), tokens in `:root` +
  `.dark`. Every screen must be readable in both; the preview gallery
  shows both.

## Screen states (test)

Every screen that loads data ships four states: **loading**
(skeletons, never a blank page), **empty** (what it is + the next
step as a button), **error** (what happened + recovery: retry/back),
**success**. The gallery renders each state; the smoke run visits
each one.

## Forms

- react-hook-form + zod: schema first, `defaultValues` prefilled,
  inline field errors, server errors shown at the top with the field
  highlighted. Submit buttons disable while pending and say what
  happens next ("Create app", not "Submit").

## Data and realtime

- Server components fetch; client islands own interactivity. One live
  indicator pattern (`LivePulse`): pulsing dot + label when the feed
  is connected, gray "Idle" otherwise — never a silent stall.

## Accessibility (lint + test)

- Every input has a label; icon-only buttons have `aria-label`.
- Focus visible, full keyboard path, logical heading order, `aria-live`
  or `role="status"`/`role="alert"` for async updates and errors.
- Contrast from tokens only (never hand-picked grays). Zero axe
  violations per component, enforced by the vitest-axe suite.

## Responsive

- Mobile-first: single column and full-width actions under `md`,
  shell sidebar collapses (consumer owns the mobile nav). No
  horizontal scroll except inside `Table` containers.

## Microcopy

- Match the product language (English or French, never mixed on one
  screen). Reassure before asking ("shown once, copy it now"),
  always name the next step, and show price/duration when the action
  has one. Errors say what broke + what to do, in plain words.
