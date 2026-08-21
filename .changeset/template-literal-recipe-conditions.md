---
'@pandacss/compiler': patch
---

Fix config recipes throwing at import time with `syntax: 'template-literal'`. The recipe runtime imported `breakpointKeys` from the conditions file, which the template-literal build didn't export, so any `defineRecipe` failed to load.
