---
"@zedtech/zedkit-ai": patch
---

Atlas entries support anchors: `path#Symbol#excerpt` re-resolves silently after line insertions. The excerpt must sit near its symbol: a symbol here plus matching text elsewhere still fails, and an excerpt that singles out one of several symbol hits resolves without an ambiguity warning. A missing symbol or moved excerpt fails validation. A `:line` past the end of the file fails; an ambiguous symbol or a bare `:line` on an indicative line only warns, since line numbers drift. Escaped pipes (`\|`) stay inside the cell instead of splitting the row; malformed anchors and anchors pointing at directories fail with an actionable diagnostic instead of passing silently. Record the verification commit beside the row's Checked date.
