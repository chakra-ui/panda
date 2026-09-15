---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Speed up JSX extraction for JavaScript and TypeScript files by skipping template scans reserved for Vue, Svelte, and Astro files.
