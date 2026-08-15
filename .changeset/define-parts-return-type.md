---
'@pandacss/dev': patch
---

Fix `defineParts` returning an untyped object, which made the result unassignable to `base` or `variants` in
`defineRecipe`.
