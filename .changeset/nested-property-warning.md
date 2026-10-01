---
'@pandacss/compiler': patch
---

Warn when a style is nested under a key that isn't a condition or selector, like `css({ has: { svg: { color: 'red' } } })`. These styles never applied and kept the full runtime under `transform: true` without a word; the new `nested_property` warning points at the call or config recipe and suggests a fix, such as `'&:has(svg)'`.
