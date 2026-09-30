---
'@pandacss/transformer': patch
'@pandacss/vite': patch
---

`pandacss({ transform: true })` now rewrites static `css()`, `cva()`, `sva()` and pattern calls in `.svelte` files, so
your Svelte components stop shipping the style runtime.
