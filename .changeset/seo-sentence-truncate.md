---
"@zedtech/zedkit-seo": patch
---

`truncateDescription` now keeps the last complete sentence that fits
the 160-char cap instead of slicing mid-sentence with an ellipsis.
Sentence ends must be followed by a capital, so decimals, domains and
"e.g." never cut early; the hard slice remains as fallback.
