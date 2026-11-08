# AGENTS.md — @zedtech/zedkit-ui

UI kit. shadcn/ui-based (Radix + Tailwind v4, copied in —
see THIRD_PARTY_NOTICES.md), lucide icons, sonner toasts, TanStack
Table, react-day-picker calendars. Neutral/calm look; no custom
component may replace a mature primitive (ladder rung 5).

Rules:

- New code goes in `src/`, tests in `tests/unit/` (Testing
  Library + jsdom for rendered output, plain vitest otherwise).
- Animate triggers (`data-animate`, `<Animate>`): types, grammar and
  reduced-motion rules in [docs/animate-spec.md](docs/animate-spec.md).
- Every public export gets a `## <need>` entry in CATALOG.md
  (format in `docs/catalog/README.md`), then run
  `pnpm catalog:build` from the root.
- `src` ships in the tarball (`files`) on purpose — Tailwind
  scans component sources via the consumer's `@source` line.
  Keep class names literal (no dynamic construction) so the
  scanner finds them.
- `cn()` every `className` prop (conflicts resolve last-wins).
- `.dark`-class theming only; new tokens go in `src/styles.css`
  in both `:root` and `.dark`.
- Spacing: a class names a role or a layout job (`px-field-pad`,
  `px-button-pad`, `gap-stack-sm` for a stack, `content-shrink`). Do not
  spell a number (`min-w-zero`) and do not add a token per scale step.
  Shared design values use `calc(var(--spacing) * N)`. A structural
  constraint (`min-width: 0`, pinning to an edge) is a declaration on that
  layout class, not a spacing token. Dense UI (controls, tabs, menus,
  tables, nav) is `text-dense`: 13px with a line about 18.6px. `text-sm`
  is that same size and is banned. `text-zk-type-small` is the same size
  and a 19.5px line. Do not swap them. Captions, badges and timestamps
  are `text-caption`: 12px with a 16px line. `text-xs` is that size and
  is banned. The label role is also 12px, with a 16.8px line and medium
  weight. Do not swap those either. `Stack` gaps are role-named only
  (`tight` | `sm` | `md` | `lg` | `prose` | `list` | `blocks`).
  Multipliers must land on the declared scale
  (`tests/unit/declared-scales.test.ts`). Density-derived tokens live
  in the one `:root, [data-identity-scope]` rule in `styles.css`
  (nested scopes re-resolve them). Container sizing: `zk-query`
  slots, Card/Section recipes — same `styles.css` section. Density
  still follows `--spacing` for every purpose (today's behavior). The
  recommended alternative is control/stack rhythm only; that owner
  decision (D-0.1) is open and is not applied here. The shipped rule is
  `packages/ai/kit/skills/setup-ai/design-policy.md`. Phone targets are
  44px, stricter than the kit's 24px floor. `min-h-target` follows
  `--spacing` and floors at 44px on a coarse pointer or a narrow screen.
- Deleting a utility/token: prove zero usage with a full-repo search
  that includes `preview/`, other packages and docs — never a truncated
  hit list.
- React 19 ref-as-prop: `ComponentProps<"el">`, ref is a prop, no
  `forwardRef` (lint in the quality preset). Each exported host sets
  `data-slot` on its root (see `src/button.tsx`).
- Kit chrome strings come from `ZedkitUiProvider` (English default, `zedkitUiMessagesFr`
  for French). A label prop on the host wins. Do not hard-code
  `aria-label` / `title` / `placeholder` literals in `src/`.
- No `any`, no `ts-ignore`; no eslint-disable except with a cited
  upstream reason in the comment (one exists: TanStack's own
  `ColumnDef<TData, any>` for mixed-value columns).
- UI PRs: the PR body carries the four lenses plus a UX pass as a
  lazy, distracted, doubtful end user (can they finish the flow
  half-asleep?), and attaches a screenshot of the changed preview
  (from `pnpm --filter @zedtech/zedkit-ui preview`; never committed).
- Token and primitive fixes belong here; which layer owns a given fix, and
  the known traps (overlay is a sibling, calendar grid hover, identity
  `--spacing`, `overflow-clip` on pinned scenes, fixed containing blocks), are
  in [VISUAL-CONTRACT.md](../../apps/docs/VISUAL-CONTRACT.md), not restated
  here. After source changes, rebuild this package before judging the docs
  site.
- Public repo: generic wording only, no private project names
  anywhere (CI denylist enforces it).
