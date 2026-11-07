---
name: from-audit
description: "Turn an existing audit into challenged tickets. Use when the user has an audit (file, paste, or report) and wants work items the codebase actually supports."
disable-model-invocation: true
---

Turn an existing audit into work the repo can actually do. Do not implement.

Unless this brief already contains `Playbook: from-audit` or `Mode: inline fallback`,
hand the user's text to `orchestrate` with `Playbook: from-audit` and stop.
Sibling entrypoints called from here get `Playbook: <name>` so they do not re-enter.

Go deep, be strict, and be brutally honest.

## Process

1. **Read the audit.** Path, paste, or `$ARGUMENTS`. List each finding as a
   claim (what, where, severity). If there is no audit, stop and point at
   `to-audit`.
2. **Challenge against the code.** For every claim, open the cited files
   (`ground-truth`, `explorer`). Drop or downgrade anything the current code
   does not support. A claim with no `file:line` is not a ticket. Rank what
   remains by blast radius.
3. **Draft tickets** via `to-tickets`: vertical slices, blocking edges,
   what / problem / fix / if-skipped. Default home: the configured tracker;
   else `.scratch/<slug>/issues/` — git-ignored, never `docs/`. High-quality
   means a newcomer can start from the ticket alone.
4. **Report.** Kept, dropped (with why), tickets. Evidence is `file:line`.

Do not invent findings the audit did not state unless the code contradicts
the audit — then say so, and still do not silently expand scope.
