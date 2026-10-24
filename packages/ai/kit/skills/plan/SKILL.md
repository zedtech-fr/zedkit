---
name: plan
description: "Single entry point for planning work: verifies the starting facts, writes the spec and tickets at the right size, then challenges the result. Use before implementing anything non-trivial."
---

One command for "plan this". Research first, write the plan at the right
size, then attack it before anyone codes.

## 1. Research

Apply `ground-truth`: open the code, docs, CI and history the plan will rely
on; every claimed fact cites its source. Unverified items stay labelled, never
assumed.

## 2. Write it down

Small task: a short spec via `to-spec`. Multi-step work: `to-spec`, then
`to-tickets` for the ticket list with blocking edges. Work bigger than one
session: map it with `wayfinder` and resolve the decision tickets first.

## 3. Challenge

Run `challenge` on the finished plan. A plan that has not survived a challenge
is a draft: fix what it finds, then re-plan only the parts that changed.
