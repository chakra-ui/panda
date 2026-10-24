---
'@pandacss/postcss': patch
---

The first PostCSS build now parses every source file in one batch, the way `panda cssgen` does, instead of adding them
one at a time.
