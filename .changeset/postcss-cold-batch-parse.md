---
'@pandacss/postcss': patch
---

Make the first PostCSS build of a large project much faster. The plugin now parses every source file in one batch on its
first run, as `panda cssgen` does, instead of adding them one at a time.
