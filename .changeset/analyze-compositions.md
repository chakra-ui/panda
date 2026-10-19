---
'@pandacss/cli': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

`panda analyze` now counts tokens, keyframes, and recipes used in your config, not just your source files, and shows
where each one is used. Text, layer, and animation styles get their own `compositions` scope.
