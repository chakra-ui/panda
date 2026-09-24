---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Semantic tokens that set only conditional values (`_light`/`_dark`, no `base`) now resolve to their CSS variable when used directly, e.g. `css({ color: 'onlyDark' })`. Before, the utility emitted the raw token name, which the browser ignored, so adding a `base` value was the only workaround.
