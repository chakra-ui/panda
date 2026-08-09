---
'@pandacss/compiler': patch
---

Accept styles nested more than one array deep in `css()` and `css.raw()`. The runtime already flattened them; the type
stopped at a single level, so a wrapper chain three or more levels deep failed to typecheck.
