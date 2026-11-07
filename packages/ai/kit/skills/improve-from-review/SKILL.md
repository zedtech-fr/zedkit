---
name: improve-from-review
description: "Apply a review's concrete corrections, then encode any reusable one into the AI setup. Use when the user pastes review feedback, a punchlist, or asks to improve from a review."
disable-model-invocation: true
---

Apply the review. Then encode what the next session would miss again.

This is one punchlist. Stay in this conversation. Do not hand it to `orchestrate`. A finding that is a new feature or a cross-cutting design goes to `/plan` and is not implemented here.

## Process

1. **Read the review.** List each correction as a claim (what, where). A remark, a question, or a one-off nit is listed and not encoded.
2. **Challenge each claim against the current code** (`ground-truth`). Read `.agents/atlas.md` first when it exists: it says where to open. Open the cited files. Drop what the code already does. A claim you did not open is not applied.
3. **Apply** what remains: smallest complete change, one area at a time, with a test for the behavior that was wrong. Run that area's cheap loop.
4. **Self-improve.** For each applied correction, use `rules-upkeep`: would the next similar change repeat the miss if the setup stays silent? If yes, encode it in this turn. If no, say `Rules: none` for that item. A path, word or command the review or the work had to rediscover is an atlas row: add or fix it in the same turn.
5. **Report** what you kept, dropped, and applied, then the Rules section from `rules-upkeep`.

Do not weaken a test to make a finding pass. Do not add work the review did not ask for.
