---
"@zedtech/zedkit-ui": patch
---

Drop the `@custom-variant hover` redefinition: it emitted malformed CSS that broke consumer builds, and Tailwind v4's default hover variant is already hover-gated.
