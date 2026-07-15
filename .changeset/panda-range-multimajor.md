---
'@pandacss/compiler-shared': patch
---

`panda lib` peer ranges now accept multi-major `||` unions. A design system declaring `"panda": "^2.0.0 || ^3.0.0"` is compatible with consumers on either major, instead of only the first one listed.
