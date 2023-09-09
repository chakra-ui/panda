---
'@pandacss/generator': patch
---

Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()` with
`const button = cva({ ... })`)
