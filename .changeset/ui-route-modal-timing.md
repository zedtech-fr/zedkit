---
"@zedtech/zedkit-ui": patch
---

RouteModal: exit timing reads `--motion-slow`/`--motion-base` live instead of hand-mirrored constants, so themed motion durations stay in sync with the exit animation (same defaults otherwise).
