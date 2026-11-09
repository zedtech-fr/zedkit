---
"@zedtech/zedkit-ai": patch
---

Bind an atlas anchor excerpt to its symbol's own location: the excerpt must sit on the symbol's line, inside the symbol's own declaration body (a same-line or forward `{` reached without crossing other code, so a method's one-line body never broadens to its class), inside the brace block enclosing a braceless hit, within the hit heading's Markdown section, or in the contiguous comment lines directly above it. Brace counting ignores string literals and `//` comments. Unsupported or ambiguous associations are reported explicitly instead of passing silently or claiming unchanged content moved.
