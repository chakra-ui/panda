---
'@pandacss/generator': patch
---

Fix issue where styled factory in Solid.js could results in `Maximum call stack exceeded` when composing with another
library that uses the `as` prop.
