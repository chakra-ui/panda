---
'@pandacss/cli': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

`panda analyze` now counts uses from your config, not just source files. A new "Used in" column shows where each name is
used, such as `3 files, globalCss` or `via animations.spin`, so names used only by global styles, static CSS, or recipes
no longer show as unused. Text styles, layer styles, and animation styles get their own `compositions` scope.
