---
'@pandacss/cli': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

`panda analyze` now counts what your config uses, not just your source files.

- Shows where each name is used, like `3 files, globalCss` or `via animations.spin`
- Adds a `compositions` scope for text, layer, and animation styles
- Counts styles a design system brings in through build info
- Fix `removeUnusedKeyframes` dropping keyframes used only through an animation token
- Fix `removeUnusedKeyframes` dropping keyframes used under `globalCss` selectors like `p` or `h`
