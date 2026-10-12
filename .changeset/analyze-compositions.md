---
'@pandacss/cli': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

`panda analyze` now counts uses from config, not just source files. A new "Used in" column shows where each name is used
(`3 files, globalCss`, `via animations.spin`), and text, layer, and animation styles get a `compositions` scope.
