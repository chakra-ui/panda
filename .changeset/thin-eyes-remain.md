---
'@pandacss/node': minor
---

Fix `@pandacss/postcss` plugin regression when the entry CSS file (with `@layer` rules order) contains user-defined
rules, those user-defined rules would not be reloaded correctly after being changed.
