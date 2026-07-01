---
'@pandacss/compiler': patch
---

Fix runtime class names for `!important` values.

Runtime `css()` now emits the same class names as cssgen for values like `padding: '0 !important'`, so the generated
rules apply correctly.
