# @zedtech/zedkit-payload-seo

## 1.0.2

### Patch Changes

- 58b6f9d: Adoption fixes from the November product audit, revalidated against dev.

  AI kit lifecycle: installs record a manifest (`.agents/.zedkit-manifest.json`) so reruns update untouched files instead of sidecarring them; upgrades recognise untouched older-version skills and assets via extended legacy hashes, including the rendered 1.0.0 install tree vendored as a test fixture (fixes the 1.0.0 setup-ai `design-policy.md` broken-link class); provider layer collisions materialise as renamed `zk-*` copies instead of same-named links and `validate` flags same-name claims per layer; an existing `zk-*` sidecar is only replaced when it is still a kit copy (current, recorded or legacy bytes), a project skill the kit does not ship never gains a sidecar, and no replacement ever deletes the kit's own sources through a symlinked layer; observed `AGENTS.md` commands use the repo's lockfile runner (npm/yarn/bun/pnpm); `validate --setup` reports a recorded tool limitation (`inherit-reason`) as a partial setup (failing state, never `ok`); README no longer claims `init --adopt` equals `setup` and lists the full setup preset delta.

  UI install: `peerDependencies` declare tested floors (`react`/`react-dom` `^19.0.0`, `tailwindcss` `^4.0.0`, `payload` `^3.93.0` for payload-seo, `react` `^19.0.0` for i18n) so `npm install` no longer ERESOLVEs on current scaffolds, with the smoke cells as the compatibility proof; `DataTable` takes an explicit `scrollAriaLabel`. The Next src-dir smoke now asserts painted styles and runs pnpm, npm and plain-layout cells, builds the UI closure before packing (clean checkouts ship no `dist/`), installs Chromium on the Ubuntu path, and leaves snippets that already name both `@source` depths untouched.

## 1.0.1

### Patch Changes

- 2fe5608: Point every package `homepage` at https://zedkit.app so npm package pages link the docs site.

## 1.0.0

### Major Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

## 0.2.1

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.2.0

### Minor Changes

- f5cdb31: Optional field labels, keywords-as-text leaves, and locale-aware max-length validator messages for Payload SEO fields.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- e081fcf: Initial release: localized Payload SEO group field.
