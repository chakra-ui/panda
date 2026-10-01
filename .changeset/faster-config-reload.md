---
'@pandacss/config': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Loading the config is faster, on cold CLI runs and on reloads in watch mode or the Vite plugin. Panda keeps the bundled config and presets in `node_modules/.panda` and only re-bundles them when a file they import changes.
