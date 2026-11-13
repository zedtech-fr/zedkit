# Docs site visual contract (Product Atelier)

Scope: the website frame only (header, sidebar, prose, home, previews' frame). Identities shown inside specimens keep their own type, shape, density and color. The frame never restyles a specimen, and a specimen never restyles the frame.

Order of every page: what it enables, a working example, how to adopt it, then breadth.

## Evidence baseline (dev.zedkit.app, v0.9.4, 1 Nov 2026)

Observed in `.turbo/evidence/before/`: heavy tan border + shadow + radius on search, toggles, sidebar footer, preview frame and every control, so nothing leads; hero copy leaves the left column mostly empty while the demo carries 5+ controls; the Button preview frame is about 370px wide inside a wide column, and its toolbar (style, size, mode) is louder than the buttons; "Who / Use when / Avoid when" are bold labels with large gaps.

## Who owns what

One decision, one owner. Fix a repeated problem at the lowest layer that shares it, never in the layer where you noticed it.

| Layer | Owns | Lives in | Fix here when |
|---|---|---|---|
| Token | A value every consumer reads: sizes, spacing, radii, colours, shadows, motion | `packages/ui/src/identities*.css`, `shared-type-scale.css`, `styles.css` | Two components or two looks disagree on a value |
| Primitive | One component's states and structure (focus ring, hit area, containment) | `packages/ui/src/*.tsx` | The same control misbehaves on two pages |
| Composed component | A recurring arrangement of primitives | `apps/docs/components` | The arrangement repeats and has its own states |
| Docs shell | The site's own chrome: header, nav, prose, tables, code, gutters | `app/docs-*.css`, `app/home-*.css` | It is the site's presentation, on every page |
| Identity scope | The look a specimen wears, resolved on its own `ThemeScope` node | `packages/ui/src/identities/*.css` | A look's token or the boundary between looks is wrong |
| Page | Order, spacing and content of one composition | the route and its view | Nothing else shares it |

Choosing the shared fix: (1) name the owner of the *value* that is wrong; (2) look for a second place that has the same problem (another identity, viewport, page); (3) if there is one, fix the token or primitive and delete the local patch; (4) a selector that mentions a page id, an element class of another layer, or `!important` to beat a token is a symptom, not a fix. `tide-fit.css` was one: a phone rule that restyled every Tide specimen to make one hero fit. The cure was recomposing the hero, not compressing tokens.

**Invariant across identities** (the shell and the tests pin these): the type size table below, the 13px floor for anything a person reads to act, 44px touch targets on phones, a focus indicator of at least 2px and 3:1 added by focus itself, AA text contrast in both modes, motion caps, the DOM and its semantics, the placement of the destructive action, and the content of a shared comparison task.

**Free to vary per identity**: font family and weight flavour, tracking, spacing unit, radius scale, border width, shadow and depth, the paired light/dark palette, motion personality, texture. "In full" for a specimen means these, not a different size table.

The three owners of a render, in order of precedence:

- **Specimens** (`ThemeScope`, the nearest scope wins, also for a nested dark section): their own identity and mode. Nothing in the shell restyles them (headings, spacing and text sizes included), and they never restyle the shell. A site rule that must not reach a specimen says so: `:not([data-identity-scope] *)`.
- **Selected identity** (default Glass, or the visitor's live-applied look): what the site's own chrome wears for the variables above. It never changes a size in the table below. Runtime default is `DEFAULT_IDENTITY` in `apps/docs/lib/default-identity.ts`.
- **Site shell** (pinned in `app/docs-shell-tokens.css` and `docs-typography.css`): sizes and weights below, reading widths, section rhythm, gutters, nav density, the contrast overrides for chrome.

## Roles

Sizes are the implemented tokens (`packages/ui/src/shared-type-scale.css`, applied by `docs-typography.css`). A test pins each; change the token and the test together, with a reason.

| Role | Rule |
|---|---|
| Marketing H1 | `--zk-type-h1-size` on `#home-page`: `clamp(2.125rem, 1.6rem + 2.2vw, 3rem)` (~34px at 375, ~43px at 809, 48px at 1440), Inter 500, tracking `-0.035em`, leading 1.08, one per page. Foundations display specimens stay 48px (3rem) on the shell token. Catalog is the documented overlay: `--zk-catalog-title-size` `clamp(2rem, 1.7rem + 1.2vw, 2.5rem)` on `[data-catalog-shell]` (`apps/docs/app/(site)/catalog/_catalog/catalog-shell.css`). Section H2: `--zk-type-h2-size` 30px (1.875rem), Inter 500, tracking `-0.025em`, leading 1.15. |
| Docs H1 | `--zk-type-doc-h1-size`: 2rem, 1.75rem below 48rem (not the marketing display). H2 `--zk-type-h2-size` 22-26px, H3 18px, weight 600. Linked headings inherit size and weight. Registry component pages (`[data-component-page]`) are the exception: title 2.5rem / 500 / 1.12 / -0.03em, section H2 1.375rem / 500. `/docs/foundations` (`[data-foundations-page]`) is the other exception: hero title overlay `--zk-foundations-title-size` 2.5rem (40px) on `[data-foundations-hero]`; display specimens stay `--zk-type-h1-size` 48px / 3rem. |
| Prose | 15/1.6 (`--zk-type-prose-size`), 64-72ch. Lead paragraph `--zk-type-lead-size` 16-18px, once. |
| Body and dense UI | Body 14/1.55. Dense UI (controls, tabs, example links, table cells, nav) is `text-dense`: 13px, line about 18.6px (`--text-sm`). Nothing a person must read to act is below 13px. |
| Metadata | Captions, badges and timestamps are `text-caption`: 12px, 16px line. Eyebrow labels use the label role: 12/1.4, weight 500. Never essential copy or a link people need. |
| Code | Mono family of the identity, 13/21 in blocks, inline code follows its sentence. |
| Dense looks | Density is rhythm (row height, gaps, rules), not smaller type. Volt's activity rows are 13px: the event is what a person reads to act. Only the timestamp column may be metadata. Decision, 2 Nov 2026: the 13px floor wins over a 12px mono row. |
| Widths | Marketing 1200 max (`--zk-container-default` / `--zk-container-wide`: 75rem on the docs shell). Docs cluster at 1440 unchanged; nav 240, article 720-800, TOC 180 only if it fits. |
| Spacing | 4px base, steps 4/8/12/16/24/32/48/64. Between groups 32-48, between marketing sections 64-96. No blank band without a job. Class names are roles; the numbers stay in the token values (`packages/ai/kit/skills/setup-ai/design-policy.md`). |
| Gutters | 24 at every width, including 390 (`--zk-page-gutter: 1.5rem` on the docs shell). |

## Surfaces, borders, elevation

- Three surfaces: page (reading), specimen stage (demonstration), overlay (transient). Nothing else gets a container.
- A border exists where two regions meet or a control is interactive. Divider (quiet) and control border (clear) are different strengths. Grouping alone is never a reason for a border.
- Shadow only on overlays and genuinely raised controls. Sections, fields, code wells and cards in a grid are flat.
- Radius: controls 8, specimens and overlays 12, pills only for compact status/selection.
- Color: one action accent per view or high-value panel, explicit success/warning/danger. Active text 4.5:1, large 3:1. Dark is a paired hierarchy, not an inversion.
- Docs chrome color: indigo/violet are not page fill or body text. Page is a neutral reading surface; body text is zinc-neutral. Glass indigo/violet stay specimen and accent roles.
- Glass (the default look) may carry decorative colour halos and a lit rim: it is a material, defined in [signature.md](../../docs/design/signature.md#glass-material). No other look and no other surface gets decorative gradients.

## Controls and hierarchy

- One primary action per view. Secondary is outlined or quiet. Tertiary is a link.
- Site chrome: site chrome actions are not Glass `--primary` unless inside a high-value panel. Default site actions use stock near-black `--primary`. `.site-action` is the class for those default actions (near-black, flat, 8px radius). A high-value panel is a Glass-material site-owned overlay or marketing card (Guides menu panel, glass header chips, raised marketing code wells, the foundations hero glass callout) — not the page, not body copy, not default header/hero CTAs. On a registry component page, the primary Preview stage is also a high-value panel: the one place violet is allowed on that page.
- Destructive: the trigger is outlined (destructive colour on the text or icon) and sits apart from Save and Discard, below a divider or at the end of the row. The solid destructive button appears only inside its confirmation. Anything simulated says so in its outcome message.
- Preview frame: one stage, one quiet toolbar. Stage height follows content. Appearance choices (identity, mode, width) sit in one row under "Display", current values visible, subordinate to the example.
- Touch targets 44px on mobile, separate from the visible control size.

## States and overflow

- A specimen shows the states its task has. A data table has loading, empty, error and ready; a form has invalid and pending; a reading page, a code block or a static example has none of them, and nothing is added to say so. When a state is omitted, the example's own sentence says why.
- Code blocks and data tables may scroll sideways inside their own region. That region is keyboard-reachable and named; the page itself never scrolls sideways. Anything else that overflows is a layout bug: wrap, recompose or truncate with the full text one tap away.

## Motion

Only to explain a change or keep context (overlay in/out, panel following focus, row insert). 120-160ms feedback, 180-220ms panels, transform/opacity. Small state feedback may be instant. Reduced motion removes displacement. Site chrome uses named motions only and does not invent durations. One hero entrance, one pausable illustration. Reduced motion shows the final state with no movement.

The home page has one scene that is allowed to do more, because it is the first impression and each motion shows the kit working:

- **Hero illustration** (`app/(home)/_home/home.css`): the glass illustration enters on load, then Plan / Build / Check / Fix / Done step opacities loop on the card (Pause freezes them). Entrances are finite (320-640ms, `backwards` fill, nothing left applied); loops stay on the illustration steps and one decorative blob on the purple stage, never on the page fill. Reduced motion shows the paused illustration; a live run still keeps the Pause control.

It obeys reduced motion completely (no animation, paused illustration, final numbers), never takes over scrolling, and never put a running transform, filter or mask on anything that holds a toast, a dialog or a portaled menu (see the traps).

## Home

Promise and one glass illustration (hero: the question-plus-invitation title, one muted body sentence, one copyable map prompt from generated constants, beside a purple glass card that swaps in one live run when the public feed has an active row; empty or stale lists return the combined placeholder, and a fetch or parse error keeps the last live card, no kit selector, no live console, no scroll pinning of the hero), then same idea in two places (three cards — zedkit AI, zedkit UI, Together — each with a product window, copy and a link, stacked on a phone, three columns from `lg`, then a What lands in your repo count bar with a full `--zk-section-pad` gap above it, no paste fields, Nest stays in the Together card), then six quote/reply cards (sentences agents say, then the kit's answer; Quality and Consistency as primary high-value panels among four flat cards; stacked on a phone, featured `span-rest` in a four-column grid from `lg`), then paste one line (dark zinc band, hashes `#paste` / `#ai-setup` / `#get-started`, four timeline facts, one bordered AI|UI well with badges and live skill/agent counts, no Getting started link in this band, no second copy field), then four looks of the same product screen (Glass, Mist, Press, Maison; compact Project settings in one stage, two columns from `lg` with the specimen beside look-name pills and a `data-identity` caption, stacked on a phone with copy first; switched by tab, built from the same components, never one page restyled per look; nothing is pinned, the page scrolls normally), then what it does not do (three limits, stacked on a phone, three columns from `lg`), then the origin band (full-bleed high-value Glass band: tokenized `--primary`→`--accent` gradient plus static circle/stripe, not an inner inset card, still not indigo page fill, lock-in quote plus the golden-rule line, no off-path company link), then a closing ask (shared copy-command field with an attached black Copy, not Setup to `#ai-setup`). Each band has one focal point, one next action and a different shape from its neighbours. A band that repeats another (two blocks about coding agents) is removed.

Identity examples sell what the kit builds, not how many identities it ships: no count in the title or copy, and every look restyles the same compact Project settings screen (Glass, Mist, Press, Maison). Each example uses live kit components and keeps its identity on the specimen, not on `html`.

## Component page

Title, purpose (role), maturity including Stable, package, source, preview, usage, then install (npm or source, both when available), guidance, kit props first, inherited attributes collapsed, related. Contents list every section. Full order: [COMPONENT-PAGE.md](./COMPONENT-PAGE.md). Desktop chrome bar is 56px (`--zk-site-header-height`), not the mockup 60px, so home, catalog, and docs stay one height.

## Mobile

Compose by priority, not by stacking desktop. The first screen reaches the example or its start. Secondary tools are disclosed. Wide data scrolls in its own region, never clipped.

**#73 adjustment (#261, #303):** at 390 the quiet-glass mockup wraps the header onto two rows. The shipped phone bar is one compact row (wordmark; Try it yourself or icon search; Menu) no taller than 64px. Menu is a kit Drawer of AI, UI, Docs, Catalog, Issues, and GitHub (#303 adds Issues; the mockup still omits it). Desktop 1440 stays the mockup single row at 56px (`--zk-site-header-height`), not the mockup 60px.

**#73 adjustment (#301):** at 390 the quiet-glass mockup shows a short in-flow grouped nav. The shipped docs page tree is a collapsed kit Drawer in the docs shell (not the site Menu). Opening it shows grouped, readable links; 809 and 1440 keep a styled sidebar column.

**#73 adjustment (#258):** the quiet-glass mockup Home hero shows AI / UI / AI + UI pills. The shipped hero has no selector: one map prompt, no caption. Kit choice stays in `map.md`.

Recompose (change the order or the arrangement, not the tokens) when any of these holds at 390px: the first action sits below the first screen; a control group wraps onto a second row of equal weight; two columns become two unreadable ones. Order with one DOM and CSS `order`, or with a slot (the editor's `afterShape`); never render a control twice and hide one. Compressing a look's spacing or type to make a phone fit changes the specimen and is not recomposition.

## Traps (31 Oct–1 Nov 2026)

These broke real previews. Check them before changing home, chrome, specimens or overlays.

- **Frame vs content height.** `min-h-svh` / `min-h-screen` inside a bounded preview (hero card, 40rem stage) leaves empty chrome. The frame owns height; the specimen is `h-full pane-shrink`.
- **Identity `--spacing` scales spacing utilities.** A numeric width tracks `--spacing`, so it is not a fixed length. Use a role width when the job has one. Pin chrome that must stay compact, and look at Tide before calling a layout done.
- **Calendar is `role="grid"`.** Do not paint `tbody tr:hover` on it; hover `.rdp-day`.
- **Fixed containing blocks.** A running animation of `transform`, `translate`, `scale`, `rotate` (even to `none`), a `filter` or `will-change` on an ancestor makes it the containing block of its `position: fixed` descendants: a toast or a floating bar inside is laid out against that ancestor, not the viewport, and can sit on the controls it reports on. Animate opacity, or keep fixed content out of the animated subtree. Check with a real toast at 1280x720.
- **Scroll pinning loses the example in use.** A scroll-driven fade ends the example it is fading when a click scrolls the page by a few hundred pixels. The hero is one map prompt (no kit tablist) for that reason, and the looks band is plain tabs with no pin. A scene that must pin keeps one rule: the scroll position is the only thing that picks the example, and nothing the visitor does inside it scrolls the page.
- **Overlay is a sibling.** Vaul/Radix scrim sits next to the panel. `backdrop-filter` on the overlay becomes the backdrop root, so the panel blurs the scrim, not the page. Frost with a lighter overlay (`drawer-scrim` plus blur) or put blur on the panel and set the overlay filter to `none` (Glass). `prefers-reduced-transparency`: solid scrim, no filter.
- **Hero.** The proposition stays outside the glass illustration. One map prompt; the glass card starts as the combined empty-state run and swaps in one live active run when the public feed has one (empty or stale lists return to the placeholder; a fetch or parse error keeps the last live card). The illustration card footer may link to `/issues?open=first` (selects the first issue after mount). After kit source changes: `pnpm --filter @zedtech/zedkit-ui build` before judging localhost:3100.
- **Hero motion and fixed positioning.** The illustration runs a finite entrance, then looping step opacities on the card and one decorative blob on the purple stage. Those hosts wrap nothing that portals a toast. Check with a toast raised after the entrance.
- **One `main` per page.** The illustration is not the kit's `AppShell`: that renders `main`, `aside` and `header`, and the home page already has its own `main` (specs and axe assume one).
- **Fumadocs CSS.** Import the preset as source. A precompiled `style.css` duplicates utilities and can hide responsive variants.
- **Class merging and custom tokens.** `cn()`/tailwind-merge does not know the kit's token utilities (`h-tabs-list-height`): a later `h-auto` leaves both. Use `h-auto!` or fix the primitive, then read the computed height.
- **Nearest scope wins.** A look's dark rule for plain `.dark` sections skips anything inside a deeper scope of another look (root Tide to local Press to nested dark; scope Tide to scope Press to nested dark). Load order must never decide: `identity-nested-dark.spec.ts` compares all outer/inner pairs against the inner look pinned dark. Alternating chains deeper than one look change need `ThemeScope mode="dark"`, which carries the identity on its own node.
- **Identity `--spacing` also sizes dots, icons and swatches.** Pin fixed-size marks (`[data-palette-dots]`).
- **Page-specific shell patches** (`tide-fit.css`) are debt: they made a Tide specimen differ with the site's identity. Fix the token, primitive or composition, then delete the patch.
- **Site rules reach specimens.** `#home-page h3` set every heading in every look to 18px and -0.02em. A site selector that targets elements (headings, text, controls) excludes scopes: `:not([data-identity-scope] *)`. Probe a heading inside a specimen, not only one in the page.
- **The pointer is part of a screenshot.** The click that opens an overlay leaves the pointer where the trigger was; the overlay opens under it and whichever button lands there is painted hovered. Park the pointer before capturing a surface; test hover on its own.
- **Dates and the reader's zone.** A `Date` built in a server component is a UTC instant fixed on the build host. Build dates where they are shown (a client component), or format with an explicit time zone. Hydration error #418 is the symptom, and CI (UTC to UTC) cannot show it: the test reads the page from other zones.
- **Identity probes.** Site chrome pins radii/shadows on `:root`. A probe in `main` does not prove a look. Resolve tokens on `[data-identity-scope]`.
- **Inverted home bands pin ghost fills.** A dark band that only sets `--foreground` / `--muted-foreground` leaves light-mode `--muted` / `--secondary` in place; ghost hover is then ~1.6:1. Pin `--muted`, `--secondary`, and `--secondary-foreground` with the fill (`#paste` uses `--zk-site-action-hover`). A focusable control on an inverted `--primary` fill also needs `--ring` pinned to the inverted foreground: Glass `--ring` is `--primary`, so the outline disappears on that fill (`#manifesto` still pins `--ring`; the band has no link).
- **Reading tokens follow `html.dark`.** `--zk-site-page/band/ink/body/hairline` alias identity reading roles in dark; pin hero text to `--zk-site-ink` / `--zk-site-body` so they stay paired with the band; never pin a light band inside a dark page. Action zinc tokens stay inverted on purpose.
- **Docs grid without a sidebar.** `#nd-docs-layout` still sets `--fd-sidebar-col: 16.75rem` when `#nd-sidebar` is unmounted. Restack with `:not(:has(#nd-sidebar))` or `overflow-x-clip` hides the header at 809.
- **Public issues list.** Desktop (`md+`, same breakpoint as kit AppShell) `/issues` is a master-detail workspace: independently scrollable `aside` (issue list) and `article` (selected detail) inside the 1400px header column (`--zk-header-max-width`), not the marketing 1200px well. Compose AppShell tokens (`w-app-shell-sidebar`, muted wash, `p-app-shell-padding`) plus `SidebarNavItem` / `SidebarNavGroup`; do not mount AppShell (it nests a second `main`) or a kit Accordion. List rows are `SidebarNavItem` hash links with `StatusDot`, title, and one chip when present (headline outcome, else issue state; unlinked rows with no outcome show type and run count only); relative time lives on the detail. The selected row is `aria-current="page"`. The list has no nested links and no GitHub issue/PR text. Detail is kit `Card` (console decision-band shell) with title, state, and outcome, a `DetailPanel` grid (Duration when present, Finished or Started, Issue, PR), and newest-first steps; steps with an in-page live URL are one log link with a View log Button (plain row when the href is missing or not in-site). Steps list newest first (running, then `endedAt ?? startedAt`, then `id` descending); do not flip port `sortEntries`. Do not put a Timeline button in the detail (`/issues/N` stays for bookmarks). First item is selected by default; `?open=first` / `#first` / `#issue-<n>` / `#pr-<n>` still select that row. A well-formed hash that is not on the list keeps the URL and shows the list missing note; do not silently open the first row. Inline links use `hit-target`, not `min-h-target`. Below `md` the list is an AppShell-shaped kit Drawer (trigger copy is “Issue list”, not the page heading) and the detail is the first screen; on 375px, duration and relative time stack and must not run together on one wrapping line. Dual panes on `md+` are bounded to the viewport (`100svh` minus `--zk-site-header-height`) so the document does not double-scroll.

## Verifying the render

1. Confirm the stylesheet and fonts loaded before judging a capture: rule count above zero, `document.fonts.ready`, the expected family on the page text. An unstyled capture is a collection failure; diagnose it separately and do not count it as evidence.
2. Compare like with like: same content, viewport, identity, mode and state, before and after. A captured baseline is only a reference once someone has opened it and judged it right; one that shows a defect (a chip overlapping a toggle) is not.
3. When geometry surprises you, read the computed style of the element, not the class list.
4. Wait for transitions to settle before reading computed colours or shadows.
5. Test provenance and behavior (where a value is declared, what an action changes), not that a name or text appears.
6. A failing screenshot diff is read, not accepted: open expected, actual and diff, then classify it as a product defect, an unstable test (pointer, timing, content behind a translucent surface), or an intended change. Only the last two justify touching the baseline, and the commit says which. Regenerate baselines in the CI environment (Linux, same Playwright), never from a local capture on another OS.
7. **Cascade boundaries**: resolve tokens on the specimen's own node, in light and dark, inside every nesting that is supported (look in look, dark in look, portalled overlay), against the same look pinned alone.
8. **Focus**: focus the control with the keyboard (a script or pointer focus does not match `:focus-visible`). The indicator must be added by focus (an outline that never changes is decoration), at least 2px, 3:1 against what is behind it, unclipped by an ancestor, and still drawn under `forced-colors`. Also check where focus goes after an overlay closes.
9. **Contrast**: computed colours on the settled state, both modes, every look the page can wear; large text 3:1, other text 4.5:1.
10. **Overflow**: `documentElement.scrollWidth` at 320, 360, 390, 768, 1024, 1440 and 1920, then 200% zoom; long labels and dense data; the only regions allowed to scroll sideways are code and data tables.
11. **Motion**: with and without `prefers-reduced-motion`; look at an intermediate state, not only the ends; an animated ancestor must not change where fixed content lands.
12. Every iteration ends with a critique of the strongest remaining visual weakness.

## Honest finish

Every iteration records: what changed, matching before/after screenshots (same content, viewport, identity, mode, state), what still looks weak. Tests passing and a self-assigned score are not evidence of design quality.

Sufficient visual evidence for a change:

- Each distinct template and each changed shared component, rendered and opened at 390 and 1440; the home, the editor and one table page also at the other widths of step 10.
- A shared component or token change: every look in both modes, including a specimen whose mode differs from the site's.
- Before and after under the same conditions, with the interaction exercised (pointer and keyboard) and its failure case.
- A test that is red on the base and green on the change. A test that cannot fail proves nothing.
- Anything not covered is listed as untested, never implied.
