---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Semantic colors that set only conditional values (`_light`/`_dark`, no `base`) now join their `colorPalette`. Before, `bg: 'colorPalette.solid'` fell through to the raw string when `blue.solid` had no `base` value, so adding a `base` was the only workaround.
