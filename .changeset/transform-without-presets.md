---
'@pandacss/compiler': patch
---

Fix the source transform leaving every style call untouched in projects without a preset. Transformed code now returns
the same class names as the styled-system runtime when no utilities are configured.
