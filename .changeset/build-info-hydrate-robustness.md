---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
'@pandacss/config': patch
'@pandacss/cli': patch
'@pandacss/postcss': patch
---

Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You get clearer errors for token conflicts and mismatched config.
