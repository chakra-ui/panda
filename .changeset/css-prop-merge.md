---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Merge the `css` prop over the style props beside it before encoding, so `<Box color="red" css={{ color: 'blue' }} />`
emits one declaration instead of two classes whose winner depended on stylesheet order. Shorthands resolve first, so
`padding` and `p` collide the way they do at runtime.
