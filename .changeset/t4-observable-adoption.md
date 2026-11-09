---
"@zedtech/zedkit-ai": patch
---

Lock in the observable state of adopting the published 1.0.0 skill tree: a second setup pass changes no file bytes and no modification time except the install's own record, user-owned files stay byte-identical across adoption and rerun, files intact since 1.0.0 match current kit bytes, and every installed link resolves with a clean `validateKit`.
