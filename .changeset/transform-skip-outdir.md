---
'@pandacss/vite': patch
'@pandacss/bun': patch
'@pandacss/compiler-shared': patch
---

With `transform: true`, the Vite and Bun plugins no longer transform files in your `outdir`. This removes the false
`panda_call_unextractable` warnings on `styled-system/css/cva.js` and `sva.js`.
