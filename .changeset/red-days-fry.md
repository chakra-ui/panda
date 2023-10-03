---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
---

The `token()` function now returns the raw value for all non-semantic tokens and semantic token that are not a composite
or color palette. This is a breaking change for users who were using the `token()` function to get the CSS custom
property for a token, please migrate to `token.var()`.
