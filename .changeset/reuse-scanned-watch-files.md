---
'@pandacss/compiler-shared': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/rollup': patch
'@pandacss/vite': patch
---

Reuse parsed source paths when registering bundler watch files, avoiding a second full project scan during startup. Keep
tracked paths in sync when explicitly parsed files are deleted.
