---
'@pandacss/generator': patch
---

Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal` or `none`
with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
