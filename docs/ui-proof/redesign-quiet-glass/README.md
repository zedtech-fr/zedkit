# Quiet-glass redesign mockup

Visual reference for the zedkit.app redesign described in issue #73.

This folder holds the unpacked four-screen mockup (self-contained HTML pages and PNG captures at 1440 and 390). Use it when implementing or reviewing tickets that carry a `Visual reference:` line pointing here.

Documented adjustments in [#73](https://github.com/zedtech-fr/zedkit/issues/73) take precedence over the mockup pixels. In particular:

- One Setup entry in the hero, backed by `map.md`. Do not build the mockup's AI / UI / AI + UI tabs.
- Replace the simulated hero-right run with a compact replay of a real public issue. Include a discreet link to `/issues/N`. Do not add Reviews or Issues to the primary nav.
- Do not build the large violet Catalog counters panel. Catalog should lead with search and the component grid.
- Identity customization lives in the site dock (see #110 / #142), not as a second form on Catalog, the hero, or review pages.
- Later decisions recorded on #73 (new-tab links that leave the adoption path, `prefers-reduced-motion`, and similar) also win over the mockup.

The PNG files are the canonical pixel reference. The HTML pages can be opened in a browser for layout and interaction; they load React from a public CDN and embed font files.

## Screens

| Screen | HTML | Desktop 1440 | Mobile 390 |
| --- | --- | --- | --- |
| Home | [page-home.html](page-home.html) | [home-desktop-1440.png](home-desktop-1440.png) (full page), [home-desktop-1440-first-screen.png](home-desktop-1440-first-screen.png) (first screen) | [home-mobile-390.png](home-mobile-390.png), [home-mobile-390-first-screen.png](home-mobile-390-first-screen.png) |
| UI kit — foundations | [page-ui-kit-foundations.html](page-ui-kit-foundations.html) | [ui-foundations-desktop-1440.png](ui-foundations-desktop-1440.png) | [ui-foundations-mobile-390.png](ui-foundations-mobile-390.png) |
| Docs — component page | [page-docs-component.html](page-docs-component.html) | [docs-component-desktop-1440.png](docs-component-desktop-1440.png) | [docs-component-mobile-390.png](docs-component-mobile-390.png) |
| Catalog | [page-catalog.html](page-catalog.html) | [catalog-desktop-1440.png](catalog-desktop-1440.png) | [catalog-mobile-390.png](catalog-mobile-390.png) |

### Home

Eyebrow, title (“Code that's checked. Screens that match.”), supporting copy, setup control, hero-right panel, then below-the-fold bands (same idea in two places, six sentences, paste-one-line, looks switcher, what it doesn't do, manifesto, closing CTA). Prefer the first-screen crops for hero work and the full-page captures for the bands below the fold.

### UI kit — foundations

Site chrome rules: neutral page, zinc text, black site actions; indigo and violet only inside panels and as small chips; type scale; site vs kit buttons; chips and status; cards and fields; section rhythm; motion.

### Docs — component page

Sidebar grouped by Actions, Forms, Overlays. A component page goes: role, maturity, package, Source, Preview, Use it, then install steps, then Props. Installation comes after usage.

### Catalog

Lead copy and search, category chips, and the component grid. The mockup's large counters panel is not to be built (see the adjustments above).

## Review

When a pull request touches `apps/docs` and the linked ticket points at a file in this folder, compare the rendered page to the matching HTML/PNG at 1440 and 390. Request changes only for a clear mismatch that is not an adjustment documented in #73. This is a review criterion, not a new end-to-end suite.
