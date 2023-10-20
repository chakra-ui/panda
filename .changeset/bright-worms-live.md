---
'@pandacss/generator': patch
---

Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
`root, :host, ::backdrop`
