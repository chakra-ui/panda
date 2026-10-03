---
'@pandacss/config': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/cli': patch
'@pandacss/preset-base': patch
'@pandacss/preset-panda': patch
'@pandacss/preset-typography': patch
---

`panda` starts faster. Installed presets load with Node instead of being re-bundled on every run, and a build no longer
loads the code for `init` and `debug`.

- `@pandacss/preset-base`, `@pandacss/preset-panda` and `@pandacss/preset-typography` are now ESM-only, like the rest of
  v2.
- Generated `styled-system/patterns` files are reformatted once.
