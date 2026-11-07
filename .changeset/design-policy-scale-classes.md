---
"@zedtech/zedkit-quality": major
"@zedtech/zedkit-ui": minor
"@zedtech/zedkit-ai": patch
---

Ship one design policy: role class names, with numbers only in token values. Scale steps such as `p-4`, `text-sm`, `grid-cols-3` and `w-1/2` are lint errors. Migration: pass `scaleBaseline` for a count that only shrinks, or replace the class with a host role (`p-4` -> a role class). The check fails when Tailwind or the CSS entry cannot be resolved. Stack accepts `sm` / `md` / `lg` beside the old numeric steps, and field borders meet 3:1 on the token surfaces.
