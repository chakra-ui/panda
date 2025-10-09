---
'@pandacss/config': patch
'@pandacss/generator': patch
---

Fix issue where `create-recipe.mjs` helper was not generated when adding the first recipe to a project that previously
had no recipes.
