---
"@zedtech/zedkit-ui": minor
---

List the six identities (`mist`, `press`, `tide`, `volt`, `maison`, `glass`) in the built-in `identities`: `IdentityScript`, `IdentitySwitcher` and `IdentityPicker` now offer them by default, and a stored built-in id is applied before first paint. No identity is applied until someone chooses one. Pass `identities={[]}` (or your own list) to keep the previous behaviour.
