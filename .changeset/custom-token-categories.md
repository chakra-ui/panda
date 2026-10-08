---
'@pandacss/compiler': patch
---

Fix tokens in custom categories (like `theme.tokens.iconSizes`) being dropped. They now emit CSS variables and work with
`{iconSizes.sm}`, `token()` and custom utilities, as in v1.
