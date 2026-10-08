---
'@pandacss/compiler': patch
---

Fix `pure_helper_unevaluated` warning on calls that only pick between styles, like `css(useExpanded() ? a : b)`.
