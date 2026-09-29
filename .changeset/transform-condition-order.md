---
'@pandacss/compiler': patch
---

Fix transformed classes losing their styles when a selector or breakpoint wraps a condition, like
`'& > h3': { _before: … }` or `md: { _hover: … }`. The transform named these classes differently from the stylesheet.
