# QA report — zedkit site design reference

Branch `epic/73-redesign`. Route inventory: [qa/routes.md](routes.md).
Method: Wave 0 readiness → Wave 1 five-track audit (1440/390 ×
light/dark; 1920 only on layout break) → Wave 2 skeptic attack →
fix loop (small batches, verifier green, local conventional commits).
No committed PNGs; no push/PR/merge. FR gap logged as blocked (owner).

## Wave 0 — readiness (verified 2026-11-14)

- `GET /` → 200, `GET /docs` → 200 (`http://127.0.0.1:3100`, `next dev`).
- HEAD `3130b42d` on `epic/73-redesign`; only `registry.json` modified
  (pre-existing; later normalized by the docs export build — clean now).
- Harness: Playwright + chromium present; `zedkit-ai evidence` rebuilt
  from source (`dist/` was stale, predated the command).

## Wave 1 — audits (all read-only; child sessions have no shell, so all
rendered evidence below was collected by the caller)

- Track A (home/catalog, ui-designer): no blockers; should-fix H1
  unsubstantiated claim, catalog All-chip discoverability, counter scope,
  live-region chatter, HSL copy, 320px grid floor, 13px floor check.
- Track B (docs/identity, ui-designer): must-fix note-list load-error
  dead end; FR gap (later resolved: site is EN-only by config,
  `lib/site.ts` `locales: ["en"]` — logged blocked, owner decision).
- Track C (issues/reviews, ui-designer): D1 deep-URL 500s, D2
  load-error self-link; G1 deep-route DetailMeta gap; G2 empty state.
- Track D (a11y): V1 skip-link 24px vs 44px invariant; V2
  MutationObserver-injected names; V3 global aria-hidden→inert sweep;
  gate-coverage gaps G1–G5 (no new E2E per constraints — logged).
- Track E (seo/chrome): 3× JSON-LD home; demo pages indexable but
  unsitemapd; 404 canonical → /issues; sitemap omissions; footer/404 exits.
- Rendered baseline (`evidence`, 17 routes × 390/1440 × light/dark,
  run record in `/tmp/qa-evidence/`): overflow clean everywhere, 0 new
  serious axe, h1=1 everywhere except 500 pages. Fails: 24px hit gate on
  3 heading self-link anchors (`/docs`, 2 guides) + dev-500 collection
  failures on unbaked `/issues/[n]` URLs with axe `document-title,
  html-has-lang` on the 500 page.

## Wave 2 — skeptic verdict: REVISE (amendments adopted)

- D1 dev-500s are Next dev export-mode strictness (verified in
  `next/dist` source), not a product defect; production host 404s.
  Re-scoped to the real wart: baked `/issues/0` placeholder served 200
  with dual robots tags + canonical self.
- Ladder enforced per fix (owning layer named, no page overrides).
- Catalog HSL re-copy rejected → shared token. Note-list error path
  kept minimal + unit-tested. All-chip doubles toggle-off → dropped.
  Skip-link: 44px on `:focus-visible` only. Canonical omission needs a
  kit API change → blocked, self-canonical kept.

## Fix batches

- W1 `docs-typography.css` (heading anchors ≥24px, copy-button
  `:focus-within` reveal): DONE by caller after the assigned worker
  reported edits it had not made (its diff was empty; claim rejected
  on evidence, re-applied inline). Probe-verified: no block-level
  anchor under 24px on the three failing routes; no new tests
  (style tweak; evidence hit gate is the checker).
- W2 issues/reviews metadata (placeholder + missing → `{index:false}`
  + self canonical; new `generateMetadata` on the two reviews/pr
  pages): DONE, verified by full static-export build (`out/*.html`
  single noindex + self canonical). Canonical omission blocked (kit
  `buildPageMetadata` always sets canonical; no API to omit).
  Pages use a deep `adapters/live` import; a barrel facade is a
  follow-up. Dev-only 500s on unbaked numeric URLs are Next dev
  export-mode strictness (verified in `next/dist` source), not a
  product defect — production host 404s.
- W3 catalog honesty: intro grid floor, `total` counts all active
  filters (unit-pinned), debounced live-region announcement, grid
  test re-pinned to the fixed string. DONE (33/33).
- W3b shared stage token: `--zk-preview-stage-*` recipe deduped into
  `docs-shell-tokens.css` (`html[data-docs-shell]`, identity-free so
  SSR/first paint is covered); deleted from `catalog-shell.css` and
  `docs-component-page.css`. Visual parity confirmed on contact
  sheets (`/catalog`, one component page, 1440 light/dark).
- W4 note-list states: `load-error` + Retry, add disabled when
  empty/pending, cancel-safe refresh/add, `pending`/`loadError`
  reducer flags. DONE (14/14 new tests). Skeleton skipped
  deliberately (named loading text kept; no Skeleton churn).
- Note: the pre-existing `registry.json` worktree modification was
  normalized by the docs export build (tree clean for that file).
- W5 reviews honesty: `ReviewLoadErrorView` takes `recoveryHref/Label`
  (list route passes home, killing the self-link); `DetailMeta` now
  renders on deep PR routes via shared export from
  `review-issue-detail.tsx` (mirror deleted, unused imports cleaned);
  empty state links home; log-cell keeps kit `hit-target`.
  DONE, typecheck+lint green. Empty-state branch is typecheck-only
  (sandbox has no network; list short-circuits to the error view).
- W6 chrome a11y: skip link pins 44px on `:focus-visible` only
  (parked box untouched); dead GitHub MutationObserver branch removed
  (name was already SSR via `OffPathLink` — the branch never matched).
  DONE, probe-verified (parked 122×44 offscreen; focused 122×44;
  SSR == hydrated names), existing `skip-link.spec.ts` still passes.
- W7 home head+copy: single `@graph` JSON-LD (count=1 verified);
  demo pages `{index:false}` (noindex verified); H1 reframed as the
  thin-wrapper principle; back link now "Back to identities". DONE.
- Blocked (owner): full FR parity (EN-only by architecture);
  canonical omission on 404s (kit API); a11y gate-coverage extensions
  (no new E2E per constraints); inert-sweep narrowing (no coverage).

## Final verification (2026-11-14, after all batches)

- `typecheck` + `lint` (incl. `check-native-controls`,
  `check-raw-css-values`, `module-placement --check`) green;
  47 unit tests pass (note-list 14 new, catalog 33 incl. 3 new pins).
- `evidence` full matrix 17 routes × 390/809/1440 × light/dark
  (`/tmp/qa-final/`): overflow ok in all 102 cells; hit gate ok in
  all cells (heading-anchor fix confirmed); 0 new serious axe;
  h1=1 on every real page. Overall verdict still `fail` ONLY on the
  dev-server 500s for unbaked `/issues/[n]` URLs (Next dev
  export-mode strictness; production host 404s) plus the axe flags
  on the dev 500 page itself. Contact sheets opened and described:
  catalog violet parity, component-page stage parity, fixed guide
  route at all widths × both modes.
- Observation (unfixed, owner call): the floating identity dock
  pill overlaps body copy at 390 until dragged. Non-modal +
  draggable by design; consider defaulting to collapsed on small
  screens.

## Summary

- Fixed: heading-anchor 24px hits + keyboard-visible copy button;
  placeholder/missing issue metadata (single noindex + self
  canonical); catalog counter honesty, settled live-region
  announcements, 320px grid floor, shared preview-stage token;
  note-list error/retry/pending/disabled states + 14 tests;
  reviews recovery action, deep-route DetailMeta reuse, empty-state
  link; skip-link 44px on focus, dead observer branch removal;
  single `@graph` JSON-LD, demo-page noindex, two copy fixes.
- 9 local commits, all checks green. No PNGs committed, no
  push/PR/merge, no CI/config changes.
- Remains: FR parity (architectural, epic-scale); canonical omission
  (needs kit API); gate-coverage extensions (need new E2E);
  inert-sweep narrowing (needs coverage first).

## Top 5 systemic improvements for the design system

1. One shared token per shared value, enforced by a same-value
   lint: the preview-stage fork survived because nothing flags
   identical literals in two page CSS files (`check-raw-css-values`
   only sees raw colors, not duplicated variables).
2. Heading anchors are interactive targets: any component that
   wraps headings in links (fumadocs or kit) must ship ≥24px boxes
   and a visible `:focus-within` reveal by default, not per-page CSS.
3. Static-export dev parity: `dynamicParams: false` + unbaked URLs
   500 in dev but 404 in production — every dynamic segment needs a
   documented host-404 contract so audits stop filing dev-only
   crashes.
4. Placeholder params must be noindex by construction: any
   `orPlaceholder` bake should pair with missing-metadata, not rely
   on per-page follow-ups.
5. Gate coverage must match the invariant list: 44px, focus-ring,
   and shell-drawer assertions lag the documented contract —
   promote the strictSemantics/a11y rows to CI-blocking or downgrade
   the contract language; a gate that does not test the claim
   teaches contributors the claim is decorative.

## Outstanding findings (not yet fixed)

- Catalog: HSL literals, 320px grid floor, counter scope, live-region
  chatter, `shadow-none` override. (Next: W3.)
- Note-list: load-error state + retry, add-form disabled state,
  skeleton. (Next: W4.)
- Reviews: D2 self-link, G1 DetailMeta, G2 empty-state link. (Next: W5.)
- Chrome: skip-link 44px focus-only, inert sweep scoping, SSR names.
  Home: JSON-LD count, demo indexability, copy claims. (Next: W6.)
- Blocked (owner): full FR parity (EN-only by architecture);
  canonical omission (kit API); a11y gate-coverage extensions (no new
  E2E); FR rendering beyond source.
