---
'@pandacss/types': patch
'@pandacss/cli': patch
---

Support `minify` as a top-level config key. The migration guide and `panda cssgen --minify` already treated it as one, but the `Config` type rejected it and nothing read it. `cssgen` now honors `minify` from config, and the `--minify` flag still overrides it.
