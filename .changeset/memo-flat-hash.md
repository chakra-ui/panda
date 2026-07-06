---
'@pandacss/compiler': patch
---

Speed up `css()`, style-prop, and recipe resolution: the generated `memo()` cache now hashes flat style objects directly
instead of always falling back to `JSON.stringify`. Nested and responsive values still use the original path, so caching
stays correct.

SSR throughput up 30-40% across all three in a variant-button benchmark.
