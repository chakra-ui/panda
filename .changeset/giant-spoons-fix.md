---
'@pandacss/preset-base': patch
---

Fix regression in `_marker` condition due to the use of `:is()` which doesn't work for pseudo elements.
