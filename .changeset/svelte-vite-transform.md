---
'@pandacss/transformer': patch
'@pandacss/vite': patch
'@pandacss/compiler': patch
---

`pandacss({ transform: true })` now rewrites static `css()`, `cva()`, `sva()` and pattern calls in `.svelte`, `.vue` and
`.astro` files, so your components stop shipping the style runtime.
