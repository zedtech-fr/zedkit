---
"@zedtech/zedkit-ui": minor
---

Add a `multiline` prop to SecretField: the value renders wrapped in an
auto-growing read-only textarea so long values (install commands, short
snippets) read in full on narrow screens instead of truncating mid-token.
Default rendering is unchanged. Also registers the spacing-token min-height
utilities as one conflict group in `cn`, so token min-height overrides win
like stock ones.
