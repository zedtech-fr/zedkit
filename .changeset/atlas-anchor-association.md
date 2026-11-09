---
"@zedtech/zedkit-ai": patch
---

Bind an atlas anchor excerpt to its symbol's own location: the excerpt must sit on the symbol's line, inside the brace block enclosing it, or in the contiguous comment lines directly above it. An excerpt found only in an adjacent, unrelated function no longer validates the reference, while an excerpt that singles out one declaration among several still resolves without an ambiguity warning. Brace counting ignores string literals and `//` comments so code samples in the body cannot shift the block boundary.
