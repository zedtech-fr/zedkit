# AGENTS.md — @zedtech/zedkit-ui

Admin UI kit. shadcn/ui-based (Radix + Tailwind v4, copied in —
see THIRD_PARTY_NOTICES.md), lucide icons, sonner toasts, TanStack
Table. Neutral/calm look; no custom component may replace a
mature primitive (ladder rung 5).

Rules:

- New code goes in `src/`, tests in `tests/unit/` (Testing
  Library + jsdom for rendered output, plain vitest otherwise).
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
- React 19, no `forwardRef` in NEW code (ref-as-prop); copied
  shadcn code keeps its shape until shadcn itself migrates.
- No `any`, no `ts-ignore`; no eslint-disable except with a cited
  upstream reason in the comment (one exists: TanStack's own
  `ColumnDef<TData, any>` for mixed-value columns).
- UI PRs: the PR body carries the four lenses plus a UX pass as a
  lazy, distracted, doubtful end user (can they finish the flow
  half-asleep?), and attaches a gallery screenshot showing the
  change (`pnpm --filter @zedtech/zedkit-ui smoke` writes them to
  test-results/, never committed).
- Public repo: generic wording only, no private project names
  anywhere (CI denylist enforces it).
