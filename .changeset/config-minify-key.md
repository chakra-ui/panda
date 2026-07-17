---
'@pandacss/types': patch
'@pandacss/cli': patch
---

Support `minify` as a top-level config key. `cssgen` reads it from config; `--minify` still overrides it.
