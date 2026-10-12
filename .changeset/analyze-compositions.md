---
'@pandacss/cli': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

`panda analyze` now counts uses from your config, not just source files. A new "Used in" column shows where each name is
used, such as `3 files, globalCss` or `via animations.spin`, so names used only by global styles, static CSS, or
recipes no longer show as unused. Text styles, layer styles, and animation styles get their own `compositions` scope.

Source inspection now reads values the way the stylesheet does, so `mt: '-4'` counts as `spacing.4`, and
`colorPalette: 'blue'` counts as using the blue tokens. The ESLint `no-deprecated` rule reports those too.
