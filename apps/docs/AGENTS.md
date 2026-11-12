# AGENTS.md — apps/docs

Public documentation site (Next.js). Renders the catalog: generated
pages per need, live kit previews, props tables, maturity badges.
Neutral, professional tone throughout (a CI check bans
self-promotional marketing terms — see scripts/check-tone.sh).

## Purpose and role

Reading surface of the kit: a developer reads a need, sees the live
component, copies the example. Reads `docs/catalog/` + the workspace
packages; owns no component logic. Out of scope: kit components
themselves (live in `packages/ui`), catalog content (lives in each
package `CATALOG.md`).

Rules:

- Docs-page views (`ComponentPage`, `ComponentPreview`, props, adoption,
  wraps) live in `features/docs/`. `preview-viewport.tsx` stays in
  `components/` because kit demos cannot import a feature.

## Mental model

Manifest-driven: `docs-manifest.json` maps catalog needs to demos;
the generator embeds demos by key; the docs check fails on drift
(missing demo, renamed need). Demos render the REAL workspace
components (same import a consumer writes), inside one shared frame.

## File placement

Where a new docs-site file goes. Enforced by
`apps/docs/scripts/module-placement.test.mjs` (owners, private folders,
cross-feature, shrink-only baseline) and ESLint one-way rules.

- Used by exactly one route: next to that route in one private folder
  `app/<route>/_<name>/` (view, `sections/`, hooks, `i18n/`, page CSS
  imported by the page, unit tests, fixtures). Home is a route group:
  `app/(home)/` with its own `layout.tsx` and `page.tsx`, private code in
  `app/(home)/_home/`. Do not create `app/(home)/` until the home move lot;
  today's in-flight lots still live under `ui/home/**` and
  `ui/docs-main-content.tsx`.
- Used by two or more routes of one domain: `features/<domain>/` (current:
  reviews, note-list). Ports/adapters/model only where there is I/O.
- Docs-site composed UI used by two or more domains, with no domain words:
  `components/` (chrome is `ui/site-chrome.tsx` until that lot moves). `ui/`
  is dissolving; do not add a fifth home there. Directory globs in
  `REQUIRED_GLOBS` (`ui/home/**`,
  `ui/docs-main-content.tsx`) silently absorb new files; do not add under
  them. Drop a glob from `REQUIRED_GLOBS` when that lot moves. Order: move
  the files, regen, drop the glob, regen again.
- Pure helpers used by two or more domains (and `.mjs` shared with
  `scripts/generate.mjs`): `lib/`.
- Domain-free code: a zedkit package (check zedkit first).
- One-way imports: `app → features → components/ui → lib`. A feature does
  not import another feature or app (compose in the route and pass props).
  A `_<name>` folder is imported only from its own route subtree.
  Temporary exceptions: L5 `ui/home/home-hero.tsx` may import features.
- Kit previews stay in `components/demos/` (the placement checker skips
  dead and single-owner there). Unit tests live beside their module,
  including under `app/`; Playwright stays in `tests/`.
- Baseline `apps/docs/scripts/module-placement.baseline.json` may only
  shrink. Move the file; never extend the baseline.
  `node apps/docs/scripts/module-placement.mjs --write-baseline`
  regenerates from the live tree and refuses growth; it drops stale
  entries after a move — do not add entries by hand.

## Demo rules (blocking — the `ui` lens fails the review otherwise)

The rules are Frontend rules 1-5 in `packages/ai/kit/skills/review/lenses.md`
(one demo per file, shared frame and registry, thin pages, kit layout
modules and tokens only, no bulk imports); they are not restated here.
`apps/docs/scripts/check.mjs` enforces them (`pnpm catalog:check`): pages
import demos only through `components/demos/registry`, no namespace imports,
no raw `<div>`/`<span>` in demos or the frame. Demos live in
`components/demos/<name>.tsx` or beside their doc. Feature-folder examples
live under `features/<name>/`: they are not kit demos and skip the shared
frame and the demo registry.

## Registry (`/r/*.json`)

Copy-paste install payloads for the official shadcn CLI (#187). `pnpm
registry:build` (root) rewrites `packages/ui` imports into gitignored
`registry/ui/`, runs `shadcn build`, and writes JSON under `public/r/`.
Docs `prebuild` runs that step; `registry:check` asserts staged sources,
rewritten imports, and `shadcn registry validate`. CI `checks` stages
before tests that read `registry/ui`. Copy install:
`npx shadcn@latest init -y --base radix --preset nova` then
`npx shadcn@latest add https://zedkit.app/r/<brick>.json` (composed bricks
need `@zedkit` first). The GitHub shorthand is retired.
Home install copy comes from `registry.json` via `content/registry-site.ts`
(`docs:generate`). `check-registry-urls.mjs` and `check-seo-export.mjs`
reject dead `/r/<name>.json` links.

## Work on it

- **Local loop** (every edit): reuse :3100 if it is up
  (`pnpm --filter @zedtech/zedkit-docs dev`, or root `pnpm dev`). Then
  `pnpm --filter @zedtech/zedkit-docs typecheck &&
  pnpm --filter @zedtech/zedkit-docs lint` and
  `node --test apps/docs/scripts/module-placement.test.mjs` and the Playwright
  spec that covers the files you touched, against that :3100 (relative
  paths; origin is `baseURL` in `playwright.config.ts`). One foreground
  command. A new or moved App Router file (`page`, `layout`, `route`,
  `opengraph-image`, `twitter-image`, `icon`) is not done until
  `pnpm --filter @zedtech/zedkit-docs build` has been run and read.
  Typecheck does not load the router. A file inside a catch-all segment
  (`[[...slug]]`) is a child route; that segment must stay last.
  Checked-in JSON read at build: import the file (`with { type: "json" }`).
  Next 16 turbopack's `fileURLToPath` rejects a URL from
  `new URL(..., import.meta.url)`.
- **PR / CI:** browser proof is `smoke` only (home, search, catalog, a
  component page, getting-started). Unit tests, `catalog:check`, the SEO
  export check and the first-load budget cover the rest. `pnpm e2e` is
  local-only, never a merge gate. A new spec must be listed in the
  `smoke` or `e2e` script; specs must not embed `127.0.0.1` or
  `localhost:` (`scripts/check-e2e-registered.sh`). Screenshots land in
  `test-results/`. Home smoke exact-text must quote a string from
  `ui/home/i18n/*-copy.ts` or `ui/i18n/site-chrome-copy.ts`; do not
  invent a sentence in the spec.
- **Reproducing a failed `docs-smoke` job:** CI already built `out/`
  (`docs-build`). Locally, only when :3100 is free — or set
  `DOCS_E2E_BASE_URL` to the port `serve` actually bound:

  ```sh
  pnpm exec turbo run build --filter=@zedtech/zedkit-docs   # writes apps/docs/out
  pnpm dlx serve@14.2.6 apps/docs/out -l 3100 &
  pnpm exec playwright install chromium
  pnpm --filter @zedtech/zedkit-docs run smoke
  ```
- Done = Local loop green + manifest/check in sync for catalog edits +
  examined screenshots for visual changes + a rendered-page critique
  (strongest remaining weaknesses) + demo rules respected. A
  self-assigned score is not done. Playwright `toHaveScreenshot`
  baselines in git are the linux files (`*-chromium-linux.png`). Darwin
  captures stay local (gitignored). Reproduce a screenshot failure with
  the Playwright image of the lockfile version
  (`docker run --ipc=host -v $PWD:/work -w /work/apps/docs mcr.microsoft.com/playwright:v<version>-noble`
  serving `out/`). Open expected, actual and diff, classify each (defect,
  unstable test, intended change) and only then regenerate, there; a
  baseline nobody has opened and judged is not a reference
  ([VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md), "Verifying the render").

## Install and copy instructions

Never hand-write an install or copy snippet in a page, prose file or
component. They come from the typed adoption contract: the catalog `adoption`
field (`docs/catalog/README.md`) feeding `apps/docs/lib/adoption-plan.mjs`,
which the home and every component page render, and
`scripts/adoption-smoke.mjs` replays the result in a clean Next.js project
(plus the `pnpm add` lines on getting-started that those cases do not cover).
A stylesheet or config need says so in its catalog entry, not in prose.
Guide snippets (`prose/guides/snippets/`) are run by the `verify-*-tutorial.mjs`
scripts inside `pnpm catalog:check`. The UI package install is
fonts-inclusive (`prose/guides/snippets/ui-add.sh`, matching
`home-quickstart/snippets/install.sh`); a consumer `layout.tsx` must
keep `import "./globals.css"` (Next.js loads the styles step from the
layout) and `import "./fonts"` so those packages load. A need whose
`exampleFile` is `src/app/layout.tsx` folds Glass into that one write;
do not also replace the path in the identity step. Do not add a
second fonts `pnpm add` next to that snippet.

## Identity editor and creator

- Identity data is constrained tokens, never code: no executable code, free
  CSS or HTML. One schema (`parseIdentityTokens`,
  `packages/ui/src/identity/identity-tokens.ts`) validates in the browser and in the
  suggest service ([deploy/AGENTS.md](../../deploy/AGENTS.md)).
  The page's client is `lib/identity-assistant.ts`: it parses whatever the
  service returns and turns every failure into a named outcome (`unavailable`
  with its reason). The floating dock is manual customize only and does not
  render those outcomes. There is no silent keyword fallback: a failed
  generation says so and leaves the draft untouched.
- Saved looks are local recipes (`lib/named-identities.ts`): re-validated on
  every read, no server copy. Changing the stored shape needs a version and a
  migration.
- Simple and Expert share `IdentityLookForm`. Simple colour fields read and
  patch `tokens[scheme]` (the preview), never always-light. Expert color
  fields pass `scheme` on patch, not the host default. A Radix
  `SelectTrigger` is a button: `htmlFor` cannot name it — set `aria-label`
  (Classic ChoiceSelect and catalog filters). After deleting a look, focus
  `[data-identity-look-control]`. User-facing editor copy is US spelling
  (`color`, not `colour`); `scripts/spelling.test.mjs` covers
  `i18n/identity-editor-copy.ts`.
- Classic edits in the floating dock restyle the whole site immediately and
  persist in `lib/site-identity-storage.ts`. Reset restores the site default
  look (`docsSiteDefaultTokens`: kit Glass plus docs-shell remaps). The dock
  has no Apply or Preview step and no opt-in key. Dock customize copy must
  not name a preview; the page and its specimens follow. The editor page
  still has Preview dark (card only) and Suggest Apply (draft only).
  Quotas, references and cost controls are server rules; the client never
  works around them.
- The floating dock opens with Control or Meta+I, closes with Escape, and on
  a phone is a bottom sheet. Demo specimens keep their own ThemeScope look.
  Export CSS applied to a blank page matches the editor specimen:
  `tests/identity-export-preview-parity.spec.ts`.

## ZedKit art direction (Product Atelier)

Read [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md) before changing home,
chrome, previews or specimens (traps included). Type, motion,
composition and elevation: [docs/design/signature.md](../../docs/design/signature.md)
(named type roles and motions, not raw `font-size` or duration). Identity
states: proof `tests/identity-state-matrix.spec.ts`, skill `use-signature`.

Scope: this docs site and its specimens. Exception: a specimen that
must match a kit primitive's own look.

- Stable, readable site frame around well-composed working specimens.
- Site styling stays distinct from specimen identities. Each styling
  decision has one owner layer (contract table); fix at the shared layer.
- One surface role per job.
- Color from tokens; no decorative gradients (the Glass material is the one exception, see signature.md).
- One focal specimen per section, not a uniform rounded-card grid.
- Mobile composes by priority, not by stacking.

## Boundaries

- Always: demo rules above, manifest keys matching catalog needs.
- Ask first: new docs deps, new preview harness, deployment changes.
- Never: component logic here; unexported types promised in props
  tables; weakening the docs check to fit.

## Related

- Root [AGENTS.md](../../AGENTS.md), kit [CATALOG.md](../../packages/ui/CATALOG.md).
- Visual contract: [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md).
- Signature: [docs/design/signature.md](../../docs/design/signature.md).
- Domain: [identity-suggest.md](../../.agents/domain/identity-suggest.md),
  [public-hygiene.md](../../.agents/domain/public-hygiene.md).
- Design / identity: [design.md](../../.agents/design.md).
- Lens registry: `packages/ai/kit/skills/review/lenses.md`
  (Frontend rules: the authoritative demo rules).
- Page layouts: [PAGE-TEMPLATE.md](./PAGE-TEMPLATE.md),
  [COMPONENT-PAGE.md](./COMPONENT-PAGE.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
