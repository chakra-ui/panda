---
'@pandacss/generator': patch
---

Refactor the type signature of `defineStyles` to return the object passed to it. This improves its composition with
`defineRecipe` and `defineSlotRecipe`
