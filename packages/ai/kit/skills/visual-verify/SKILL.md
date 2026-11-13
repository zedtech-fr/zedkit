---
name: visual-verify
description: "Run zedkit-ai evidence (alias: visual-verify) and read the run record. Use when finishing visual work, filling a contact sheet, checking overflow, axe, clipped text, or 24px hit targets, or when definition-of-done Visual work applies."
---

# Visual verify

The host command for definition-of-done Visual work. Run
`zedkit-ai evidence` (or `zedkit-ai visual-verify`); do not improvise a
second Playwright crawl. Open that skill for the bar (matrix, blocking
measures, `UNSEEN` / `UNVERIFIED`). This file is the command.

## 1. Gather inputs

- **Base:** `--base-url` or `--url` (already-served origin) or `--dir`
  (static export; served on `127.0.0.1`). Pass only one of `--url` and
  `--base-url`. `--cwd` is the git and path root (default: process cwd).
  `--base` defaults to origin/dev, else origin/main, else `HEAD~1`, else
  `HEAD`.
- **Routes:** `--changed` or `--routes auto` (diff via the route map: App
  Router `page` files, optional `--manifest` `source` → `/docs/ui/<slug>`)
  union `--routes`. Unknown files add no extra route. A host fixed set is
  passed by the host `visual:verify` script (or equivalent), not invented
  here.
- **Matrix:** `--widths` default 375, 809, 1440 × `--modes` default light,
  dark. Full **looks grid** (every shipped look × both modes) only when a
  token, a primitive, or a shared identity sheet (`identities.css`)
  changed. A look file `identities/<id>.css` adds that look only.
  `--identities` names the looks; omitted, the looks grid uses mist,
  press, tide, volt, maison, glass.
- **Baseline:** `--baseline` path to a previous run record. Missing: this
  run is the baseline (0 new means 0 serious or critical).
- **Ticket:** `--ticket` with a `Visual reference:` path, when the image
  exists on disk. The contact sheet includes that whole file, not a crop.
  `States: no transient states` (plain or `**States:**`) adds no extra
  cells. English `States:` names without `--states` are recorded as
  `statesUnverified` on stdout and `summary.md`.
- **States:** `--states <file>` JSON `[{ "name": "...", "click": "..." }]`.
  `click` is optional; `{ "name": "..." }` adds a no-click cell. After the
  default tree's axe and screenshot, each present `click` (2s timeout)
  becomes another cell at the same width × mode × look. Screenshot stems
  use `routeStem(name)` (`/` → `home`; spaces become `-`); colliding stems
  get a numeric suffix.
- **Mockup:** `--mockup <file-or-dir>` (wins over `Visual reference:`).
  A file is reused at every width; a directory looks for
  `{stem}-{width}.png` (`/` → `home-375.png`), else `{width}.png`, else
  the only PNG. Missing path is exit 2. Unresolvable directory PNGs warn
  and write no pair. Writes `pair-<stem>.png` per route. Pixel differences
  do not fail the run.

Done when: every flag you will pass is a real path, URL, or route.

## 2. Run the command

```sh
zedkit-ai evidence --base-url <origin> --routes auto
zedkit-ai evidence --dir ./out --routes /,/docs --states states.json --mockup mockups --out evidence/run
zedkit-ai visual-verify --url <origin> --changed
```

Missing `@playwright/test` or `@axe-core/playwright` is exit 2: install
the missing package and run `playwright install chromium`. Done when: the
process has exited.

## 3. Collection, then verdicts

If CSS or fonts did not load, or a `--states` click timed out or missed,
**collection failed**: no overflow or axe verdict, exit 1, do not treat
screenshots as evidence.

Per cell, when collection succeeded, in this order: axe and the
screenshot on the **default** tree, then clicks:

- `scrollWidth` ≤ `innerWidth` (1px tolerance)
- no clipped text (`overflow: hidden|clip` with `scrollWidth` /
  `scrollHeight` past the box, or an unintended ellipsis; skip
  `overflow: auto|scroll`, visually hidden sr-only / clip-path / 1×1
  boxes, native `input`/`textarea`/`select`, and intended
  `truncate` / `line-clamp-*`)
- 0 `pageerror`, 0 console errors, 0 responses ≥ 400 (favicon 404s ignored)
- axe `wcag2a` / `wcag2aa` / `wcag21aa` / `wcag22aa` with 0 **new**
  serious or critical vs the host baseline
- then click every `[role=tab]` and `[role=radio]`; composed contrast ≥ 4.5
- every Copy button sits with its `pre` / `code` / `figure` (overlap or
  within 48px of the block header)
- one `h1` (fail when count is not 1 or `font-size` is 0); record
  font-size, line count, and share of the first screen
- hit targets ≥ 24px on visible `a`/`button`/`input`/`select`/`textarea`
  and button/link/tab/menuitem/checkbox/radio/switch/combobox roles.
  Skip `display:inline`, `pointer-events:none`, `disabled`,
  `visibility:hidden`, `display:none`, and zero-size boxes. Union the
  border box with an **overlapping** `::before` / `::after` (distant
  pseudos do not count). This host is intentionally stricter than SC
  2.5.8 (inline only; no equivalent/essential/user-agent/Spacing). If a
  listed exception applies, say so in the PR and mark that cell
  `UNVERIFIED` — the command still fails the 24px gate.

Done when: you have read the run record, not guessed the numbers.

## 4. Outputs

- Run record: `evidence/<branch>/manifest.json` (or `--out`)
- `summary.md` next to the run record (table, then `statesUnverified`
  when present, then `pass`/`fail`, then the run-record path)
- One contact-sheet PNG per route (matrix cells, plus the Visual
  reference or `--mockup` file when it exists)
- One side-by-side PNG per route when `--mockup` or `Visual reference:`
  is set (`pair-<stem>.png`, `/` → `pair-home.png`); not a fail
- Markdown table on stdout and `--md`, then `statesUnverified` when
  present, then `pass`/`fail` and the run record path

Open the contact sheet. Generated-but-unread shots do not count. Paste
the table into the PR. Done when: every required cell is described or
marked `UNSEEN`, and every blocking measure is a number or `UNVERIFIED`.
