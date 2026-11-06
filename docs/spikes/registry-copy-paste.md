# Spike: copy-paste registry (shadcn CLI)

Checked 2026-10-25 against [shadcn registry docs](https://ui.shadcn.com/docs/registry)
(`registry.json`, `registry-item.json`, `shadcn build`, namespaces, GitHub
registries, FAQ) and a local install into a fresh Next app. CLI: `shadcn@4.22.1`.

Tracking: [#187](https://github.com/zedtech-fr/zedkit/issues/187).

Goal: a user who does not want the npm package can copy a kit brick into their
project the same way they add a shadcn item: `npx shadcn@latest add <url-or-name>`.
No kit-owned add CLI. The existing `shadcn` CLI is the installer.

There is no `StatusLabel` component in `packages/ui`. The composed sample is
`Drawer`. Closest sibling is `StatusDot` (comment-only mention of StatusLabel).

## Verdict

**Feasible.** Badge (simple) and Drawer (composed) installed from generated
registry JSON into a Next 16 + React 19 + Tailwind v4 app, compiled, and
rendered. Do it with the official CLI and schema; keep `packages/ui` as the
library source; rewrite imports only in the registry payload.

Do not ship a `zedkit add` command. Do not rewrite `packages/ui` to `@/lib/utils`
(that path is invalid inside the npm package).

## What ran

Registry source lived only in `/tmp` (not committed). `shadcn build` wrote
`public/r/{badge,drawer,registry}.json`.

| Step | Result |
|---|---|
| `shadcn build` | Inlined file contents, kept `dependencies`, `registryDependencies`, `cssVars`. |
| `registry validate` | Valid (2 items). |
| Fresh app | `create-next-app` Next 16.4.3 / React 19.3.0 / Tailwind 4.3.3, then `shadcn init -d`. |
| `shadcn add /path/to/badge.json` | Wrote `src/components/ui/badge.tsx`, skipped existing `utils`. Installed `class-variance-authority`. |
| `shadcn add /path/to/drawer.json` | Wrote `drawer.tsx`, installed `vaul`, injected `--overlay` into `globals.css`. |
| HTTP URL | `list` / `view` on `http://127.0.0.1:8765/r/registry.json` and `…/badge.json`. |
| Namespace `@zedkit` | `shadcn registry add @zedkit=http://127.0.0.1:8765/r/{name}.json` then `list @zedkit`, `view @zedkit/badge`, `add @zedkit/drawer --dry-run`. |
| `next build` | Compiled. |
| `next start` HTML | Badge text `Copied`; Drawer trigger `Open drawer`. |

`init -d` now scaffolds **base-nova** (Base UI, `@base-ui/react`). Kit components
stay Radix + vaul. Copy-paste does not switch the consumer onto Base UI, but a
fresh shadcn app already has a Base UI `button` next to a Radix kit `badge`.

## Gaps that block a clean copy

Imports in `packages/ui/src` are relative ESM (`from "./utils.js"`). `shadcn build`
does not rewrite them. A payload built from the library files as-is installs a
`badge.tsx` that imports `./utils.js`, which is not next to it in a shadcn app
(`utils` lives at `@/lib/utils`). **The registry payload must rewrite**
`./utils.js` → `@/lib/utils` and `./button.js` → `@/components/ui/button` (etc.).
Verified: the rewritten Badge installed and compiled; the raw `./utils.js` form
is what `shadcn build` emits without that step.

Bare `registryDependencies` names (`utils`, `button`) resolve to the **official
shadcn registry**, not this repo ([FAQ](https://ui.shadcn.com/docs/registry/faq)).
`utils` is the right reuse (same `cn()`). Kit-specific siblings must use
`@zedkit/<name>`, a GitHub address `zedtech-fr/zedkit/<name>`, or a full item URL.

No `@zedtech/*` imports in `packages/ui/src` (`@zedtech/zedkit-core` is tests
only). Workspace-only imports are not a UI copy-paste blocker.

| Gap | Where | Copy-paste effect |
|---|---|---|
| Relative `./foo.js` | every UI file | Broken unless rewritten in the payload. |
| Extra tokens `success`, `warning`, `overlay` | `styles.css`; `StatusDot`, `Checkmark`, `Drawer`, `Dialog` | Missing utilities unless a theme item or `cssVars` ships them. Spike Drawer declared `overlay`; CLI wrote `--overlay: hsl(0 0% 0%)` and `bg-overlay` appeared in the built CSS. `success` / `warning` were absent. |
| Token format | kit: HSL channels + `@theme inline { --color-*: hsl(var(--*)) }`; shadcn v4: oklch on `:root` + `--color-*: var(--*)` | Mixed CSS. Prefer oklch (or full `hsl(...)`) in `cssVars` so the CLI output matches v4. |
| Kit motion CSS | `styles.css`: `--motion-*`, `zk-check-draw`, `zk-fade-in`/`out`, `zk-zoom-in`/`out`, vaul duration + reduced-motion override | `Checkmark` and `Dialog` classes reference those keyframes; a copied `Drawer` keeps vaul’s 500ms slide and loses the reduced-motion guard unless the `theme` item ships this CSS. `motion-safe:animate-ping` on `StatusDot` is stock Tailwind. |
| Hard-coded English | `DataTable` (Page/Previous/Next), `LivePulse` (`Live`/`Idle`), `SecretField` (`Copy to clipboard`), `ConfirmDialog` defaults | Copied files are English-only. `FormSubmit` already takes labels from the caller. |
| Composed files | `SecretField` → Button+Input; `ConfirmDialog` → Button+Dialog; `DataTable` → Button+Input+Skeleton+Table; `LivePulse` → StatusDot; `Field` → Label+Separator | Each needs `registryDependencies` on **kit** addresses, not bare shadcn names (kit Button is Radix `Slot`, not Base UI). |
| Base UI vs Radix | shadcn `init -d` vs kit | Two button implementations can coexist. Document it; do not silently depend on the official `button` for kit compositions. |

## Plan

### 1. Structure

Root catalog plus includes (shadcn `include`; paths relative to the file that
declares the item):

```text
registry.json                 # name: zedkit, homepage: this GitHub repo
registry/ui/registry.json     # UI items
registry/ai/registry.json     # AI kit files (later)
```

`shadcn build -o apps/docs/public/r` in the docs prebuild. Gitignore
`apps/docs/public/r/` (generated, same idea as `apps/docs/content/`). Do not
commit the JSON.

A small **build transform** (not a user CLI) copies `packages/ui/src/*.tsx`
and rewrites `from "./utils.js"` (and other `./foo.js` siblings) to the
consumer aliases (`@/lib/utils`, `@/components/ui/button`, …), then
`shadcn build` reads those generated sources. Library files stay as they are.
There are no `#*` or `@zedtech/*` imports in `packages/ui/src`.

GitHub registry: once `registry.json` is on `main`,
`npx shadcn@latest add zedtech-fr/zedkit/badge` works with no docs host
([GitHub registries](https://ui.shadcn.com/docs/registry/github)). GitHub
dependencies must use `zedtech-fr/zedkit/<name>`, not bare `button`.

Hosted namespace (after the docs URL exists, tracking #137):

```sh
npx shadcn@latest registry add @zedkit=https://<docs-host>/r/{name}.json
npx shadcn@latest add @zedkit/badge
```

Ship a `theme` item (type `registry:theme`) with `success`, `warning`, `overlay`,
the motion tokens/keyframes, and the vaul reduced-motion override so composed
items do not each repeat CSS.

### 2. Docs site: `/r/<name>.json`

Next already serves `apps/docs/public/` at `/`. After `shadcn build --output apps/docs/public/r`,
`https://<docs-host>/r/badge.json` and `/r/registry.json` are static. No extra
route. `next.config.mjs` stays empty. Static export copies `public/`.

### 3. “Copy code” / “Add via CLI” on each need page

Today `apps/docs/scripts/generate.mjs` only emits `pnpm add @zedtech/zedkit-ui`.
Add two actions on UI need pages (same generator, not a new site):

- **Copy code** — the rewritten registry file body (what `shadcn add` would write).
- **Add via CLI** — copy `npx shadcn@latest add @zedkit/<name>` (and the GitHub
  form as a fallback until the docs host is live).

Keep the npm install tab. The user picks package vs copy.

### 4. CI: install into a fresh app

New job, after `shadcn build`:

1. `create-next-app` (or `shadcn init -t next -d`) in a temp dir.
2. `npx shadcn@latest add <workspace>/apps/docs/public/r/badge.json` and `drawer.json`.
3. `next build` must pass.

Use local JSON in CI (PR refs are awkward on GitHub addresses). Start with the
two spike items; extend as items land. Heavy (~2–3 min) but that is the contract.

### 5. AI kit: copy without the npm package

`packages/ai/kit/` is already files (skills, agents, commands, personas
template, `AGENTS.template.md`). `zedkit-ai init` copies them but the package
depends on `@zedtech/zedkit-core`.

Add `registry/ai` items of type `registry:file` / `registry:item` with `target`
under `~/.agents/…`, `~/AGENTS.md`, etc. Users run `npx shadcn@latest add
zedtech-fr/zedkit/ai-core` (or `@zedkit/ai-core`) and get the markdown without
installing `@zedtech/zedkit-ai`. No second installer. Cursor still needs real
files, not symlinks (existing kit rule).

The npm CLI stays for `validate` and provider wiring. Copy mode is files only.

## Ladder

| Piece | 1 Need? | 2 In repo? | 3 Stdlib? | 4 Native tool? | 5 Installed dep? | 6 One line? | Rung |
|---|---|---|---|---|---|---|---|
| `registry.json` + items | yes | no | no | shadcn schema | shadcn CLI | no | 4 |
| Import rewrite | yes | no | no | not in `shadcn build` | no | no | 7 (tiny transform feeding shadcn) |
| `public/r/*.json` | yes | no | no | `shadcn build -o` | shadcn | no | 4 |
| `/r/<name>.json` on docs | yes | Next `public/` | no | Next static files | Next | no | 4 |
| Copy / Add buttons | yes | install tabs only | no | clipboard + generator | kit `Button` | no | 7 |
| CI fresh-app install | yes | no | no | create-next-app + shadcn + next | those CLIs | no | 4 |
| AI kit copy items | yes | `packages/ai/kit/` files | no | GitHub `registry:file` | shadcn | no | 4 |
| User-facing `zedkit add` | no | — | — | shadcn `add` | — | — | skip |

## Challenge

1. **Two sources of truth.** Parallel `registry/` copies will drift. Fix: generate
   rewritten sources at build from `packages/ui/src`; never edit them by hand.
2. **Bare dependency names steal official shadcn items.** Fix: `@zedkit/…` or
   `zedtech-fr/zedkit/…` for every kit sibling. `utils` may stay bare.
3. **Base UI default.** Copy-paste stays Radix. Say so on the docs page. Do not
   remap kit Button onto the official Base UI button.
4. **Generated JSON is an artifact.** Fix: gitignore `apps/docs/public/r/`;
   produce it in docs prebuild + CI. Extend `scripts/check-no-artifacts.sh` if
   the ignore list grows.
5. **Fresh-app CI is slow and networked.** Worth it for two items; do not run
   create-next-app per component.
6. **i18n** is a kit limit, not a registry feature. Track it on UI PRs. The
   `theme` item carries extra color tokens, motion tokens/keyframes, and the
   vaul reduced-motion override.
7. **#159 (quality package)** is the opposite move (versioned npm, no copies).
   Do not fold quality/eslint into this registry.

**Proceed (amended):** first code PR is the transform + `registry.json` + Badge +
Drawer + docs prebuild + gitignore. Buttons, remaining UI items, CI job, and AI
items are later unstacked PRs from `main`.

## Effort

| PR | Size |
|---|---|
| This spike | Done (doc). |
| Transform + Badge + Drawer + docs prebuild | One session. The install path is proven; remaining work is wiring `shadcn build` into this repo. |
| Rest of UI + `theme` item | 2–3 PRs. Cost is the import graph and tokens, not the CLI. |
| Copy / Add buttons | Small generator change. |
| CI fresh-app job | Small YAML; ~2–3 min per run (create-next-app). |
| AI kit file items | Small: `registry:file` targets over files that already exist. |

## Follow-up PRs (unstacked)

1. This spike (doc only).
2. Registry transform + Badge + Drawer + `shadcn build` in docs prebuild.
3. Remaining UI items (primitives, then composed), plus the `theme` item.
4. Copy code / Add via CLI on generated need pages.
5. CI job: install Badge + Drawer into a fresh app and `next build`.
6. `registry/ai` copy items for skills / agents / personas / `AGENTS.md`.
