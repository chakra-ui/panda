---
'@pandacss/config': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Reloading the config in watch mode or the Vite plugin is faster. Presets and config files are only re-bundled when a file they import changes, and the compiler no longer copies the config back from the native engine on startup.
