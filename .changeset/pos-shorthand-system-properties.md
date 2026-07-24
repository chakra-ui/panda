---
'@pandacss/compiler': patch
---

Fix `pos` and other shorthands for value-less native properties (like `position`) missing from the generated types. Use
them as style props, in `css()`, and on pattern components.
