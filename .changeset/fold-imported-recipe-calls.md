---
'@pandacss/compiler': patch
---

With `transform: true`, replace static calls on a `cva` or `sva` imported from another file with their classes. When
every call to a recipe is replaced, bundlers drop the recipe entirely.
