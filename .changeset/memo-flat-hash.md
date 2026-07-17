---
'@pandacss/compiler': patch
---

Speed up `css()`, style props, and recipe resolution in generated runtimes. Repeated calls with the same flat style objects hit the cache about 30–40% faster in SSR benchmarks.
