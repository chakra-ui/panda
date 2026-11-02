---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Lint rules now point at, and fix, style values in Vue, Svelte, and Astro template attributes like
`<Box color="{colors.red.500}" />`. Before, those values were reported against the whole tag with no fix.
