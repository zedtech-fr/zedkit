---
name: visual-verify
description: "Run zedkit-ai visual-verify and read the run record. Use when finishing visual work, filling a contact sheet, checking overflow or axe on renders, or when definition-of-done Visual work applies."
---

# Visual verify

The host command for definition-of-done Visual work. Run it; do not
improvise a second Playwright crawl. Open that skill for the bar (matrix,
blocking measures, `UNSEEN` / `UNVERIFIED`). This file is the command.

## 1. Gather inputs

- **Base:** `--url` (already-served origin) or `--dir` (static export;
  served on `127.0.0.1`).
- **Routes:** `--changed` (diff via the route map: App Router `page`
  files, optional `--manifest` `source` → `/docs/ui/<slug>`) union
  `--routes`. Unknown files add no extra route. A host fixed set (home,
  docs, one component page, catalog, foundations) is passed by the host
  script, not invented here.
- **Matrix:** widths 375, 809, 1440 × modes light, dark. Full **looks
  grid** (every host shipped look × both modes) only when a token, a
  primitive, or `identities*.css` changed (`--identities` names the looks).
- **Baseline:** `--baseline` path to a previous run record. Missing: this
  run is the baseline (0 new means 0 serious or critical).
- **Ticket:** `--ticket` with a `Visual reference:` path, when the image
  exists on disk.

Done when: every flag you will pass is a real path, URL, or route.

## 2. Run the command

```sh
zedkit-ai visual-verify --url <origin> --changed
zedkit-ai visual-verify --dir ./out --routes /,/docs --md table.md
```

Missing `@playwright/test` is exit 2: install it and run
`playwright install chromium`. Done when: the process has exited.

## 3. Collection, then verdicts

If CSS or fonts did not load, **collection failed**: no overflow or axe
verdict, exit 1, do not treat screenshots as evidence.

Per cell, when collection succeeded:

- `scrollWidth` ≤ `innerWidth` (1px tolerance)
- 0 `pageerror`, 0 console errors, 0 responses ≥ 400
- axe `wcag2a` / `wcag2aa` / `wcag21aa` / `wcag22aa` (keep A tags; add
  `wcag21a` / `wcag22a` when axe lists them) with 0 **new** serious or
  critical vs the host baseline
- click every `[role=tab]` and `[role=radio]`; composed contrast ≥ 4.5
- every Copy button sits with its `pre` / `code` / `figure` (overlap or
  header)
- one `h1`; record font-size, line count, and share of the first screen
  (fail only when the `h1` is missing or `font-size` is 0)

Done when: you have read the run record, not guessed the numbers.

## 4. Outputs

- Run record: `evidence/<branch>/manifest.json` (or `--out`)
- One contact-sheet PNG per route (3×2, plus the mockup crop when a
  Visual reference file exists)
- Markdown table on stdout and `--md`

Open the contact sheet. Generated-but-unread shots do not count. Paste
the table into the PR. Done when: every required cell is described or
marked `UNSEEN`, and every blocking measure is a number or `UNVERIFIED`.
