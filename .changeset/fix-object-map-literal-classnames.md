---
'@pandacss/compiler': patch
---

Fix object-map utility values generating selectors that do not match runtime class names.

Literal values now keep their authored class segment, so `minHeight: '100vh'` emits `.min-h_100vh`.
