---
"@zedtech/zedkit-ui": minor
---

Add the identity provider and selectors: `IdentityScript` applies a stored `data-identity` before first paint, `IdentitySwitcher` (labelled select) and `IdentityPicker` (touch sheet) let people choose and persist the choice, and `applyIdentity` / `useIdentity` drive it from your own UI. The kit ships no identity yet: pass your own list, matching your `[data-identity]` CSS. Nothing changes until an identity is set.
