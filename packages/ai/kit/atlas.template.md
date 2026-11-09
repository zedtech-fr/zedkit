# Atlas

Where things live, what we call them, how to run them, why we chose them. Before a task, read the row for your topic, open its Entry, and widen the search only if it does not hold. Rows are leads, not law.

- **Add a row** the same turn a search cost 3 or more reads, or a correction was about a path, a word or a command. One row, one line.
- **Fix in place.** Never append a duplicate; replace a stale fact. A row one search away does not belong here: delete it. A moved file or changed command fixes its row in the same change.
- **Link, never copy.** The rule, ADR or domain file owns the why; the row names it. No secrets, no private names.
- **Bounded.** About 120 lines. `zedkit-ai validate` fails past 150 lines, and on any path in the Entry column of Where that no longer exists.
- **Anchors.** Pin a moving target as one token, `` `path#Symbol#short excerpt` `` (path, then the symbol or section title, then an identifying excerpt; the excerpt part is optional). A silent line insertion re-resolves without noise. The excerpt must sit near its symbol: a symbol here plus matching text elsewhere still fails. A missing symbol or moved excerpt fails; an ambiguous symbol or a bare `:line` only warns, since line numbers drift. Anchor to files, not directories; write a literal `|` inside a token as `\|`. Record the verification commit beside the Checked date.
- A read-only task (audit, review, subagent) writes nothing: it lists rows to add, fix or drop under `Atlas:` in its report; the caller writes them. Stale factual rows are deleted without asking; changing a rule is a separate step.

## Where

| Topic | Entry | Why it lives there / trap | Touches | Checked |
| ----- | ----- | ------------------------- | ------- | ------- |

## Words

| Say | Means | Home |
| --- | ----- | ---- |

## Run

| Intent | Command | Note |
| ------ | ------- | ---- |

## Why

| Decision | Reason | Source |
| -------- | ------ | ------ |
