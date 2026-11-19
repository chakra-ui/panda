---
'@pandacss/compiler': patch
---

Fixed false `panda_call_unextractable` warnings on the generated `cva.js` and `sva.js` with `transform: true`. The source
transform now skips files in your `outdir`.
