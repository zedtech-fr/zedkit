---
"@zedtech/zedkit-ui": patch
---

Tide `--spacing` no longer sits 0.01rem from Glass (0.28 vs 0.27). Tide is 0.32rem. Glass stays 0.27rem. Mist is unchanged. Tailwind `p-*` / `gap-*` on Tide open up; rem aliases from #798 still do not follow `--spacing`.
