# Final-decision record

After the second pass, write one final-decision record. That record is what
gets posted (including to GitHub) and what a default view treats as final.
First-pass synthesis is not the posted artifact. This file ships in the
`review/` skill folder.

## Contents

**Verdict:** `ship` | `fix-then-ship` (list remaining blockers) | `rework`.

**Confidence:** 0-10. `UNSEEN` on a required screenshot caps Confidence at 6.
A missing evidence manifest or a failing blocking measure forbids `ship`;
when the host posts a GitHub review, the event is at most COMMENT.

**Remaining blockers:** findings the second pass still rates as blockers.
Dropped or recast findings are not unchecked must-change items.

**Findings:** each is **kept**, **dropped**, or **adjusted**, with a label:

- dropped → `superseded`
- recast / adjusted down → `downgraded`
- kept, or adjusted up and still blocking → remaining blocker at the new
  severity

## When the second pass cannot run

Say so. Its absence does not drop blockers. First-pass findings stay among
remaining blockers: do not label them superseded. There is then no
post-second-pass final record.

## Still available

Agent navigation, model visibility, transcripts, and independent-pass
inspection stay available. They are not the default final view.
