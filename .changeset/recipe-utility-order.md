---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed recipes and `globalCss` where two keys set the same CSS property: the later key now wins, as in v1. This covers
`bgColor` and `backgroundColor`, a utility like `stack` and `display`, and compositions, which now expand in place:
`{ color: 'blue', textStyle: 'body' }` takes the text style's color, while `{ textStyle: 'body', color: 'blue' }` keeps
blue. Since 2.1.0 a property written before a `textStyle` or `layerStyle` kept its value; move it after the composition
to keep that result. Design systems need to rerun `panda lib` to regenerate their build info.
