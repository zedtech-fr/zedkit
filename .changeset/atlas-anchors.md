---
"@zedtech/zedkit-ai": patch
---

Atlas entries support anchors: `path#Symbol#excerpt` re-resolves silently after line insertions, while a missing symbol or changed excerpt fails validation. A `:line` past the end of the file fails; an ambiguous symbol or a bare `:line` on an indicative line only warns, since line numbers drift. Record the verification commit beside the row's Checked date.
