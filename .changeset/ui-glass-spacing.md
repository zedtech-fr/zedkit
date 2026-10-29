---
"@zedtech/zedkit-ui": patch
---

Glass `--spacing` no longer sits 0.01rem from Tide (0.27 vs 0.28). Glass is 0.32rem. Tide stays 0.28rem. Mist is unchanged. Tailwind `p-*` / `gap-*` on Glass open up; rem aliases from #798 still do not follow `--spacing`.
