---
'@pandacss/compiler': patch
---

Fix object-map utility values generating CSS selectors that do not match runtime class names.

Authored literal values now keep their literal class segment, e.g. `minHeight: '100vh'` emits `.min-h_100vh` instead of reverse-mapping to `.min-h_screen`.
