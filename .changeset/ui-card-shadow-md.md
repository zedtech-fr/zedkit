---
"@zedtech/zedkit-ui": patch
---

`Card` and `CardSkeleton` use `shadow-md`, so they pick up each identity's `--zk-shadow-md` (press stays flat; tide/glass read as deeper). Mist cards are one step stronger than the old `shadow` utility.
