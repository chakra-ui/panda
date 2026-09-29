---
'@pandacss/compiler': patch
---

Fix the source transform folding a style nested under an unknown key, like `css({ foo: { color: 'red' } })`, to a
different class name than the styled-system runtime. The transform now leaves these calls to the runtime.
