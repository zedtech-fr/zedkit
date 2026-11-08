---
"@zedtech/zedkit-quality": major
"@zedtech/zedkit-ui": minor
"@zedtech/zedkit-ai": patch
---

Ship one design policy: a class names a role, a layout job, or a design purpose. Scale steps such as `p-4`, `text-sm`, `grid-cols-3` and `w-1/2` are lint errors, and so is a spelled step (`min-w-zero`, `px-stack-lg`). Migration: pass `scaleBaseline` for a count that only shrinks, or replace the class with a host role. A structural constraint stays a literal on that layout class (`content-shrink { min-width: 0 }`); it is not a zero token. The check fails when Tailwind or the CSS entry cannot be resolved. `Stack` gaps are role-named only (`sm` / `md` / `lg` and the other role names). Numeric gap props are removed. Field borders meet 3:1 on the token surfaces.
