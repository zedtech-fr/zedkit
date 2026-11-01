# Docs site visual contract (Product Atelier)

Scope: the website frame only (header, sidebar, prose, home, previews' frame). Identities shown inside specimens keep their own type, shape, density and color. The frame never restyles a specimen, and a specimen never restyles the frame.

Order of every page: what it enables, a working example, how to adopt it, then breadth.

## Evidence baseline (dev.zedkit.app, v0.9.4, 1 Nov 2026)

Observed in `.turbo/evidence/before/`: heavy tan border + shadow + radius on search, toggles, sidebar footer, preview frame and every control, so nothing leads; hero copy leaves the left column mostly empty while the demo carries 5+ controls; the Button preview frame is about 370px wide inside a wide column, and its toolbar (style, size, mode) is louder than the buttons; "Who / Use when / Avoid when" are bold labels with large gaps.

## Roles

| Role | Rule |
|---|---|
| Marketing H1 | 40/44 desktop, 32/36 mobile, weight 600, one per page. No second display size. |
| Docs H1 | 32/38 desktop, 28/34 mobile. H2 22/30, H3 17/26. Linked headings inherit the heading size and weight. |
| Prose | 16/26, 64-72ch. Lead paragraph 17/28, once. |
| UI and controls | 14/20. Metadata 12/18, never for essential copy. Code 13/21. |
| Widths | Marketing 1200 max. Docs shell 1440 max, nav 240, article 720-800, TOC 180 only if it fits. |
| Spacing | 4px base, steps 4/8/12/16/24/32/48/64. Between groups 32-48, between marketing sections 64-96. No blank band without a job. |
| Gutters | 16 mobile, 24 tablet, 32 desktop. |

## Surfaces, borders, elevation

- Three surfaces: page (reading), specimen stage (demonstration), overlay (transient). Nothing else gets a container.
- A border exists where two regions meet or a control is interactive. Divider (quiet) and control border (clear) are different strengths. Grouping alone is never a reason for a border.
- Shadow only on overlays and genuinely raised controls. Sections, fields, code wells and cards in a grid are flat.
- Radius: controls 8, specimens and overlays 12, pills only for compact status/selection.
- Color: one action accent, explicit success/warning/danger. Active text 4.5:1, large 3:1. Dark is a paired hierarchy, not an inversion.

## Controls and hierarchy

- One primary action per view. Secondary is outlined or quiet. Tertiary is a link.
- Preview frame: one stage, one quiet toolbar. Stage height follows content. Appearance choices (identity, mode, width) sit in one row under "Display", current values visible, subordinate to the example.
- Touch targets 44px on mobile, separate from the visible control size.

## Motion

Only to explain a change or keep context (overlay in/out, panel following focus, row insert). 120-160ms feedback, 180-220ms panels, transform/opacity. Small state feedback may be instant. Reduced motion removes displacement.

## Home

Proposition + one working fragment (a compact record list the visitor can use), one adoption choice (npm or copy source) with one command, then family discovery. Other packages, agents and identities follow as a short, distinct section each. No repeated card grids; every section has one focal point and a different shape from its neighbors.

## Component page

Title, one purpose sentence, status, example, install (npm or source, both when available), usage, states, behavior and accessibility, kit props first, inherited attributes collapsed, related. Contents list every section.

## Mobile

Compose by priority, not by stacking desktop. The first screen reaches the example or its start. Secondary tools are disclosed. Wide data scrolls in its own region, never clipped.

## Honest finish

Every iteration records: what changed, matching before/after screenshots (same content, viewport, identity, mode, state), what still looks weak. Tests passing and a self-assigned score are not evidence of design quality.
