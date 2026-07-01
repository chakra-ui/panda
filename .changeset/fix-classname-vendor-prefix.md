---
'@pandacss/compiler': patch
---

Fix vendor-prefixed properties in cssgen.

Classes and CSS properties for values like `WebkitBackgroundClip`, `WebkitTextFillColor`, and `MozAppearance` now keep
the leading dash, matching the runtime class names.
