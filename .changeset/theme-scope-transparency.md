---
"@zedtech/zedkit-ui": patch
---

Document the transparent `ThemeScope` contract in the package README (a scope adds no background or surface; surfaces stay explicit; nested scopes keep the nearer identity; dropdowns portal into the scope, dialogs mirror on the body) and lock it with rendered tests: no `bg-*` class or inline background on scope hosts, plus a light/dark composition of an explicit `Card` surface, a nested scope, a dropdown portal kept inside, and a dialog mirrored on the body with the nested look.
