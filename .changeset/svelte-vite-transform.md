---
'@pandacss/transformer': patch
'@pandacss/vite': patch
'@pandacss/compiler': patch
---

Fix `pandacss({ transform: true })` to compile static style calls in `.svelte`, `.vue`, and `.astro` files during Vite
builds.
