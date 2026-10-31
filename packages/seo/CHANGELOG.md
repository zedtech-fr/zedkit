# @zedtech/zedkit-seo

## 0.1.5

### Patch Changes

- 440ae47: `truncateDescription` now keeps the last complete sentence that fits
  the 160-char cap instead of slicing mid-sentence with an ellipsis.
  Sentence ends must be followed by a capital, so decimals, domains and
  "e.g." never cut early; the hard slice remains as fallback.

## 0.1.4

### Patch Changes

- db86533: Docs: getting started SEO scenario (#301).
- fa20bd4: Docs: SEO package row links to Scenario — SEO (#301).

## 0.1.3

### Patch Changes

- 818bb02: Add `localeInPath` for single-locale sites whose URLs omit a locale prefix.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- e081fcf: Initial release: robots, sitemaps, video sitemap, JSON-LD, metadata, llms.txt, slugs.
