---
"@pandacss/compiler": patch
---

Memoize multi-arg `css()` calls and shared recipe/pattern resolution in generated runtimes so repeated calls skip redundant merge work.
