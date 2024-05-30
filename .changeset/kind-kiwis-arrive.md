---
'@pandacss/generator': patch
'@pandacss/core': patch
---

Fix issue where using `jsxStyleProps: none` with the generated jsx patterns, lead to unoptimized code that causes the
component to be recreated on every render.
