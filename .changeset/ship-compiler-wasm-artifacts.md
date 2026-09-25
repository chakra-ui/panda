---
'@pandacss/compiler-wasm': patch
---

Fix the published package missing its generated Node and browser WASM files. Browser builds now also apply codegen overlays and normalize source watcher globs like the native compiler.
