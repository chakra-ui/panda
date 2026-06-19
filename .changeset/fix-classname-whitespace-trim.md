---
'@pandacss/compiler': patch
---

Fix cssgen class names for non-`!important` values with surrounding whitespace (e.g. `'0 auto '` → `p_0_auto`, not `p_0_auto_`), so generated CSS matches runtime `css()`.
