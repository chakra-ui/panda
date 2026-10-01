---
'@pandacss/compiler': patch
'@pandacss/transformer': patch
'@pandacss/vite': patch
'@pandacss/bun': patch
---

Warn when styles are nested under a key that isn't a condition or selector, like
`css({ has: { svg: { color: 'red' } } })`. These styles never applied; the new `nested_property` warning suggests a fix,
such as `'&:has(svg)'`.
