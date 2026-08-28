---
'@pandacss/compiler': patch
---

Name the fix when a token reference is missing its category. `{black/64}` now warns with
`Did you mean {colors.black}?` instead of only reporting that `black` is missing.
