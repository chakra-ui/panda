---
'@pandacss/generator': patch
'@pandacss/studio': patch
'@pandacss/types': patch
---

Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

Also make the `config.prefix` object Partial so that each key is optional.
