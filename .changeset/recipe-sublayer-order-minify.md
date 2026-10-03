---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed an issue where slot recipes overrode recipe variants in production builds minified with Lightning CSS, the default
in Vite 8.
