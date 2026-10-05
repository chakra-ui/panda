---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed recipes where two keys set the same CSS property, such as `bgColor` and `backgroundColor` or a utility like
`stack` and `display`: the later key now wins, as in v1. Design systems need to rerun `panda lib` to regenerate their
build info.
