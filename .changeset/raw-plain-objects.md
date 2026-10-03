---
'@pandacss/compiler': patch
---

Fixed issue where `css.raw()`, `cva().raw()`, `sva().raw()`, and `splitCssProps()` returned null-prototype objects,
which broke `toStrictEqual`, `hasOwnProperty`, and string coercion.
